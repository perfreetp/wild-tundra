// 井下巷道网络:节点 + 折线边,以及避灾标识牌
// 真实项目中可由巷道中线数据导入,这里内置一套演示网络

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface TunnelNode {
  id: string;
  position: [number, number, number];
  label: string;
}

export interface TunnelEdge {
  id: string;
  /** 两端节点 id */
  a: string;
  b: string;
}

export interface EscapeSign {
  id: string;
  /** 所在边 */
  edgeId: string;
  /** 0~1,沿边从 a 到 b 的位置比例 */
  t: number;
  label: string;
}

export interface TunnelNetwork {
  nodes: TunnelNode[];
  edges: TunnelEdge[];
  signs: EscapeSign[];
}

export const TUNNEL: TunnelNetwork = {
  // 巷道基本沿水平面延伸,局部有上下起伏(模拟坡度)
  nodes: [
    { id: "N0", position: [0, 0, 0], label: "采煤工作面" },
    { id: "N1", position: [18, 0.5, 0], label: "运输顺槽 A" },
    { id: "N2", position: [36, 1.0, 4], label: "一号联络巷口" },
    { id: "N3", position: [36, 1.0, 22], label: "轨道上山" },
    { id: "N4", position: [36, 1.5, 42], label: "二号联络巷口" },
    { id: "N5", position: [18, 2.0, 42], label: "回风大巷西段" },
    { id: "N6", position: [0, 2.2, 42], label: "避难硐室前" },
    { id: "N7", position: [0, 2.2, 56], label: "永久避难硐室" },
    { id: "N8", position: [54, 1.2, 22], label: "运输大巷东段" },
    { id: "N9", position: [72, 1.6, 22], label: "副井底车场" },
    { id: "N10", position: [72, 1.6, 40], label: "副井入口" },
    { id: "N11", position: [54, 1.5, 42], label: "回风大巷东段" },
    { id: "N12", position: [18, 0.2, 18], label: "临时避灾点" },
    { id: "N13", position: [54, 0.8, 4], label: "皮带顺槽" },
  ],
  edges: [
    { id: "E0", a: "N0", b: "N1" },
    { id: "E1", a: "N1", b: "N2" },
    { id: "E2", a: "N2", b: "N3" },
    { id: "E3", a: "N3", b: "N4" },
    { id: "E4", a: "N4", b: "N5" },
    { id: "E5", a: "N5", b: "N6" },
    { id: "E6", a: "N6", b: "N7" },
    { id: "E7", a: "N3", b: "N8" },
    { id: "E8", a: "N8", b: "N9" },
    { id: "E9", a: "N9", b: "N10" },
    { id: "E10", a: "N4", b: "N11" },
    { id: "E11", a: "N11", b: "N10" },
    { id: "E12", a: "N1", b: "N12" },
    { id: "E13", a: "N12", b: "N3" },
    { id: "E14", a: "N2", b: "N13" },
    { id: "E15", a: "N13", b: "N8" },
  ],
  signs: [
    { id: "S1", edgeId: "E1", t: 0.55, label: "避灾方向 →" },
    { id: "S2", edgeId: "E2", t: 0.5, label: "自救器佩戴点" },
    { id: "S3", edgeId: "E3", t: 0.45, label: "避灾方向 →" },
    { id: "S4", edgeId: "E5", t: 0.5, label: "避难硐室 40m" },
    { id: "S5", edgeId: "E8", t: 0.5, label: "副井提升方向" },
    { id: "S6", edgeId: "E14", t: 0.5, label: "紧急集合点" },
  ],
};

const nodeMap = new Map(TUNNEL.nodes.map((n) => [n.id, n]));

export function getNode(id: string): TunnelNode {
  const n = nodeMap.get(id);
  if (!n) throw new Error(`unknown node ${id}`);
  return n;
}

export function nodePosition(id: string): Vector3 {
  const p = getNode(id).position;
  return new Vector3(p[0], p[1], p[2]);
}

export function edgeEndpoints(edgeId: string): [Vector3, Vector3] {
  const e = TUNNEL.edges.find((x) => x.id === edgeId)!;
  return [nodePosition(e.a), nodePosition(e.b)];
}

/** 标识牌世界坐标(挂在巷道侧壁上方) */
export function signWorldPosition(sign: EscapeSign): Vector3 {
  const [a, b] = edgeEndpoints(sign.edgeId);
  const p = Vector3.Lerp(a, b, sign.t);
  p.y += 2.6; // 悬挂高度
  return p;
}

/** 标识牌朝向:垂直于巷道方向,面向来车方向 */
export function signForward(sign: EscapeSign): Vector3 {
  const [a, b] = edgeEndpoints(sign.edgeId);
  const dir = b.subtract(a);
  dir.y = 0;
  dir.normalize();
  // 牌面法线取巷道横向
  return new Vector3(-dir.z, 0, dir.x).normalize();
}
