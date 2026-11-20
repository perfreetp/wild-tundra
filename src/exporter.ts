// 导出:route.json(全量工程数据)与轨迹文件(逐帧 CSV)

import { AppState } from "./store";
import { RoutePath } from "./routePath";
import { TUNNEL, getNode } from "./tunnel";

export interface RouteJson {
  format: "mine-escape-camera-route";
  version: 1;
  exportedAt: string;
  settings: AppState["settings"];
  tunnel: {
    nodeCount: number;
    edgeCount: number;
    signCount: number;
  };
  routes: {
    id: string;
    name: string;
    color: [number, number, number];
    durationSec: number;
    totalLengthM: number;
    keyPoints: {
      index: number;
      nodeId: string;
      nodeLabel: string;
      arriveTimeSec: number;
      lookAtNodeId: string | null;
      lookAtLabel: string | null;
      fovDeg: number;
      speedGear: number;
    }[];
    signGazeEvents: {
      signId: string;
      label: string;
      startSec: number;
      endSec: number;
      dwellSec: number;
    }[];
  }[];
}

export function buildRouteJson(
  state: AppState,
  paths: Map<string, RoutePath>,
  exportedAt: string
): RouteJson {
  return {
    format: "mine-escape-camera-route",
    version: 1,
    exportedAt,
    settings: { ...state.settings },
    tunnel: {
      nodeCount: TUNNEL.nodes.length,
      edgeCount: TUNNEL.edges.length,
      signCount: TUNNEL.signs.length,
    },
    routes: state.routes.map((r) => {
      const path = paths.get(r.id)!;
      return {
        id: r.id,
        name: r.name,
        color: r.color,
        durationSec: +path.duration.toFixed(2),
        totalLengthM: +path.totalLength.toFixed(2),
        keyPoints: r.keyPoints.map((kp, i) => ({
          index: i,
          nodeId: kp.nodeId,
          nodeLabel: getNode(kp.nodeId).label,
          arriveTimeSec: kp.time,
          lookAtNodeId: kp.lookAtNodeId,
          lookAtLabel: kp.lookAtNodeId ? getNode(kp.lookAtNodeId).label : null,
          fovDeg: kp.fov,
          speedGear: kp.speed,
        })),
        signGazeEvents: path.signEvents.map((e) => ({
          signId: e.signId,
          label: e.label,
          startSec: +e.start.toFixed(2),
          endSec: +e.end.toFixed(2),
          dwellSec: +(e.end - e.start).toFixed(2),
        })),
      };
    }),
  };
}

/**
 * 轨迹文件:10 Hz 逐帧采样的第一人称轨迹 CSV
 * 列:route,time_sec,arc_len_m,x,y,z,dir_x,dir_y,dir_z,fov_deg,fog_pct,speed_gear,active_sign
 */
export function buildTrajectoryCsv(paths: Map<string, RoutePath>): string {
  const header = [
    "route",
    "time_sec",
    "arc_len_m",
    "x",
    "y",
    "z",
    "dir_x",
    "dir_y",
    "dir_z",
    "fov_deg",
    "fog_pct",
    "speed_gear",
    "active_sign",
  ].join(",");
  const lines: string[] = [header];
  const f = (v: number) => v.toFixed(3);

  for (const path of paths.values()) {
    if (path.keyPointCount < 2) continue;
    const step = 0.1; // 10 Hz
    const n = Math.max(1, Math.ceil(path.duration / step));
    for (let i = 0; i <= n; i++) {
      const t = Math.min(path.duration, i * step);
      const fr = path.sampleFrame(t);
      lines.push(
        [
          path.route.name,
          f(t),
          f(fr.s),
          f(fr.position.x),
          f(fr.position.y),
          f(fr.position.z),
          f(fr.forward.x),
          f(fr.forward.y),
          f(fr.forward.z),
          f(fr.fov),
          f(fr.fogPct),
          fr.speedGear,
          fr.activeSign ? fr.activeSign.label : "",
        ].join(",")
      );
    }
  }
  return lines.join("\n");
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
