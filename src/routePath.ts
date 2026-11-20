// 运镜路径:关键点序列 -> 圆角路径 -> 时间映射 -> 标识牌注视事件

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GEAR_SPEED, KeyPoint, Route, SpeedGear } from "./store";
import { TUNNEL, getNode, nodePosition, signWorldPosition } from "./tunnel";
import { ArcLengthTable, clamp, filletPolyline, smoothstep } from "./geometry";

export interface SignGazeEvent {
  signId: string;
  label: string;
  /** 停留开始时间(s) */
  start: number;
  /** 停留结束时间(s) */
  end: number;
  /** 注视目标世界坐标 */
  target: Vector3;
  /** 事件所在弧长(m) */
  s: number;
}

interface TimedNode {
  kp: KeyPoint;
  /** 在弧长表上的弧长 */
  s: number;
}

export class RoutePath {
  readonly route: Route;
  readonly table: ArcLengthTable;
  /** 圆角采样点(用于渲染) */
  readonly sampled: Vector3[];
  readonly totalLength: number;
  readonly duration: number;
  private timed: TimedNode[] = [];
  private signs: SignGazeEvent[] = [];
  readonly fogEndPct: number;

  constructor(
    route: Route,
    filletRadius: number,
    dwellSec: number,
    fogEndPct = 60
  ) {
    this.route = route;
    this.fogEndPct = fogEndPct;
    const raw = route.keyPoints.map((kp) => nodePosition(kp.nodeId));
    this.sampled = filletPolyline(raw, filletRadius);
    this.table = new ArcLengthTable(this.sampled);
    this.totalLength = this.table.totalLength;

    if (route.keyPoints.length > 0) {
      this.timed = route.keyPoints.map((kp) => ({
        kp,
        s: this.table.projectPoint(nodePosition(kp.nodeId)),
      }));
      this.duration = route.keyPoints[route.keyPoints.length - 1].time;
      this.signs = this.buildSignEvents(dwellSec);
    } else {
      this.duration = 0;
    }
  }

  get keyPointCount(): number {
    return this.route.keyPoints.length;
  }

  get signEvents(): SignGazeEvent[] {
    return this.signs;
  }

  /** 当前关键点的速度档:取最近的上一个关键点的档位 */
  private gearAt(s: number): SpeedGear {
    let gear: SpeedGear = 2;
    for (const tn of this.timed) {
      if (tn.s <= s + 1e-4) gear = tn.kp.speed;
      else break;
    }
    return gear;
  }

  /**
   * 时间 -> 弧长。段内按该关键点档位的基准速度比例换算,
   * 保证严格按关键点的到达时间抵达。
   */
  timeToS(t: number): number {
    if (this.timed.length === 0) return 0;
    if (t <= this.timed[0].kp.time) return this.timed[0].s;
    const last = this.timed[this.timed.length - 1];
    if (t >= last.kp.time) return last.s;

    for (let i = 0; i < this.timed.length - 1; i++) {
      const a = this.timed[i];
      const b = this.timed[i + 1];
      if (t >= a.kp.time && t <= b.kp.time) {
        const dt = b.kp.time - a.kp.time;
        if (dt <= 1e-6) return b.s;
        const u = (t - a.kp.time) / dt;
        return a.s + (b.s - a.s) * u;
      }
    }
    return last.s;
  }

  positionAt(t: number): Vector3 {
    return this.table.positionAt(this.timeToS(t));
  }

  tangentAt(t: number): Vector3 {
    return this.table.tangentAt(this.timeToS(t));
  }

  /** FOV 随时间在相邻关键点间线性插值 */
  fovAt(t: number): number {
    const kps = this.route.keyPoints;
    if (kps.length === 0) return 60;
    if (t <= kps[0].time) return kps[0].fov;
    for (let i = 0; i < kps.length - 1; i++) {
      if (t >= kps[i].time && t <= kps[i + 1].time) {
        const dt = kps[i + 1].time - kps[i].time;
        const u = dt <= 1e-6 ? 1 : (t - kps[i].time) / dt;
        return kps[i].fov + (kps[i + 1].fov - kps[i].fov) * u;
      }
    }
    return kps[kps.length - 1].fov;
  }

  /**
   * 运镜帧采样。
   * @returns 位置、基础视线(含关键点注视点混合)、FOV、雾百分比、当前标识牌事件
   */
  sampleFrame(t: number): {
    position: Vector3;
    forward: Vector3;
    fov: number;
    fogPct: number;
    activeSign: SignGazeEvent | null;
    speedGear: SpeedGear;
    s: number;
  } {
    const s = this.timeToS(t);
    const position = this.table.positionAt(s);
    const tangent = this.table.tangentAt(s);

    // 关键点注视点:寻找时间上包围当前时刻、且设置了注视点的最近关键点
    const kps = this.route.keyPoints;
    let forward = tangent.clone();
    let blend = 0;
    let gazeTarget: Vector3 | null = null;
    if (kps.length > 0) {
      const idx = this.segmentIndex(t);
      const candidates = [idx, idx + 1]
        .filter((i) => i >= 0 && i < kps.length && kps[i].lookAtNodeId)
        .map((i) => ({ kp: kps[i], i }));
      if (candidates.length > 0) {
        // 取距离当前时间最近的关键点注视
        candidates.sort(
          (a, b) => Math.abs(a.kp.time - t) - Math.abs(b.kp.time - t)
        );
        const c = candidates[0];
        gazeTarget = nodePosition(c.kp.lookAtNodeId!);
        const toTarget = gazeTarget.subtract(position);
        if (toTarget.lengthSquared() > 1e-6) {
          const dt = 4; // 注视影响窗口 ±4s 平滑过渡
          blend = 1 - smoothstep(0, dt, Math.abs(t - c.kp.time));
          forward = Vector3.Lerp(tangent, toTarget.normalize(), blend).normalize();
        }
      }
    }

    const activeSign = this.signAt(t);
    if (activeSign) {
      // 标识牌注视:在停留窗口内平滑切到标识牌方向
      const u =
        activeSign.end - activeSign.start <= 1e-6
          ? 1
          : (t - activeSign.start) / (activeSign.end - activeSign.start);
      const enter = smoothstep(0, 0.25, u);
      const exit = 1 - smoothstep(0.75, 1, u);
      const w = Math.min(enter, exit);
      const toSign = activeSign.target.subtract(position);
      if (toSign.lengthSquared() > 1e-6) {
        forward = Vector3.Lerp(forward, toSign.normalize(), w).normalize();
      }
    }

    const fogPct =
      this.totalLength > 0
        ? this.fogEndPct * clamp(s / this.totalLength, 0, 1)
        : 0;

    return {
      position,
      forward,
      fov: this.fovAt(t),
      fogPct,
      activeSign,
      speedGear: this.gearAt(s),
      s,
    };
  }

  private segmentIndex(t: number): number {
    const kps = this.route.keyPoints;
    for (let i = 0; i < kps.length - 1; i++) {
      if (t >= kps[i].time && t <= kps[i + 1].time) return i;
    }
    return t < kps[0]?.time ? -1 : kps.length - 1;
  }

  /** 标识牌注视停留事件:标识牌水平投影落在路径 3m 范围内则触发 */
  private buildSignEvents(dwellSec: number): SignGazeEvent[] {
    const events: SignGazeEvent[] = [];
    const usedSigns = new Set<string>();
    for (const sign of TUNNEL.signs) {
      const world = signWorldPosition(sign);
      const s = this.table.projectPoint(world);
      const closest = this.table.positionAt(s);
      // 标识牌悬挂于巷道顶部,只比较水平距离
      const horiz = Math.hypot(world.x - closest.x, world.z - closest.z);
      if (horiz > 3) continue;
      if (usedSigns.has(sign.id)) continue;
      usedSigns.add(sign.id);

      // 由弧长反推时间(二分)
      const center = this.sToTime(s);
      const half = dwellSec / 2;
      events.push({
        signId: sign.id,
        label: sign.label,
        start: Math.max(0, center - half),
        end: Math.min(this.duration, center + half),
        target: world,
        s,
      });
    }
    events.sort((a, b) => a.start - b.start);
    return events;
  }

  /** 弧长反推时间:按相邻关键点时间线性插值 */
  sToTime(s: number): number {
    if (this.timed.length === 0) return 0;
    const first = this.timed[0];
    const last = this.timed[this.timed.length - 1];
    if (s <= first.s) return first.kp.time;
    if (s >= last.s) return last.kp.time;
    for (let i = 0; i < this.timed.length - 1; i++) {
      const a = this.timed[i];
      const b = this.timed[i + 1];
      if (s >= a.s && s <= b.s) {
        const ds = b.s - a.s;
        if (ds <= 1e-6) return b.kp.time;
        const u = (s - a.s) / ds;
        return a.kp.time + (b.kp.time - a.kp.time) * u;
      }
    }
    return last.kp.time;
  }

  signAt(t: number): SignGazeEvent | null {
    return (
      this.signs.find((e) => t >= e.start && t <= e.end) ?? null
    );
  }
}

/**
 * 根据速度档位自动推算关键点到达时间:
 * 首点为 0,其后每段按弧长 / 档位基准速度累加。
 */
export function autoScheduleTimes(route: Route, filletRadius: number): KeyPoint[] {
  if (route.keyPoints.length === 0) return [];
  const path = new RoutePath(route, filletRadius, 0.5);
  const kps = route.keyPoints;
  const result: KeyPoint[] = [{ ...kps[0], time: 0 }];
  for (let i = 1; i < kps.length; i++) {
    const sPrev = path.table.projectPoint(nodePosition(kps[i - 1].nodeId));
    const sCur = path.table.projectPoint(nodePosition(kps[i].nodeId));
    const gear = ([1, 2, 3] as SpeedGear[]).includes(kps[i].speed) ? kps[i].speed : 2;
    const v = GEAR_SPEED[gear];
    const dt = Math.max(0.5, Vector3.Distance(
      path.table.positionAt(sPrev),
      path.table.positionAt(sCur)
    ) / v);
    result.push({ ...kps[i], time: +(result[i - 1].time + dt).toFixed(2) });
  }
  return result;
}

/** 供编辑器显示的节点名称 */
export function nodeLabel(id: string): string {
  return getNode(id).label;
}
