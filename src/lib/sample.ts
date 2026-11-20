import type { NetworkData, NetworkNode, Pipe } from '../types';

/**
 * 示例管网：1 座热源 + 12 个楼栋挂点，支状拓扑。
 * 供水管沿 y=0 走廊敷设并折线入户；回水管平行外移 4m。
 * 坐标单位 m，z 为高程。
 */
export function createSampleNetwork(): NetworkData {
  const nodes: NetworkNode[] = [
    { id: 'N0', name: '热源首站', type: 'source', x: 0, y: 0, z: 2, diameter: 400, demand: 0 },
    { id: 'N1', name: '节点 N1', type: 'junction', x: 60, y: 0, z: 2, diameter: 350 },
    { id: 'N2', name: '节点 N2', type: 'junction', x: 130, y: 0, z: 2, diameter: 300 },
    { id: 'N3', name: '节点 N3', type: 'junction', x: 200, y: 0, z: 2, diameter: 250 },
    { id: 'N4', name: '节点 N4', type: 'junction', x: 270, y: 0, z: 2, diameter: 200 },
    { id: 'N5', name: '节点 N5', type: 'junction', x: 340, y: 0, z: 2, diameter: 150 },
    { id: 'N6', name: '节点 N6', type: 'junction', x: 130, y: -55, z: 2, diameter: 200 },
    { id: 'N7', name: '节点 N7', type: 'junction', x: 200, y: -55, z: 2, diameter: 150 },
    { id: 'N8', name: '节点 N8', type: 'junction', x: 270, y: 50, z: 2, diameter: 150 },
    { id: 'B1', name: '1# 换热站', type: 'building', x: 60, y: 22, z: 8, diameter: 100, demand: 45 },
    { id: 'B2', name: '2# 住宅楼', type: 'building', x: 95, y: 22, z: 8, diameter: 80, demand: 30 },
    { id: 'B3', name: '3# 住宅楼', type: 'building', x: 130, y: -78, z: 8, diameter: 100, demand: 55 },
    { id: 'B4', name: '4# 商业楼', type: 'building', x: 165, y: -78, z: 8, diameter: 80, demand: 36 },
    { id: 'B5', name: '5# 住宅楼', type: 'building', x: 200, y: -78, z: 8, diameter: 80, demand: 32 },
    { id: 'B6', name: '6# 住宅楼', type: 'building', x: 235, y: -32, z: 8, diameter: 80, demand: 28 },
    { id: 'B7', name: '7# 办公楼', type: 'building', x: 270, y: 72, z: 8, diameter: 100, demand: 60 },
    { id: 'B8', name: '8# 住宅楼', type: 'building', x: 305, y: 50, z: 8, diameter: 80, demand: 34 },
    { id: 'B9', name: '9# 住宅楼', type: 'building', x: 340, y: 26, z: 8, diameter: 80, demand: 30 },
    { id: 'B10', name: '10# 住宅楼', type: 'building', x: 380, y: 0, z: 8, diameter: 80, demand: 26 },
    { id: 'B11', name: '11# 住宅楼', type: 'building', x: 340, y: -30, z: 8, diameter: 80, demand: 24 },
    { id: 'B12', name: '12# 末端楼', type: 'building', x: 410, y: 0, z: 8, diameter: 80, demand: 22 },
  ];

  const supplyPipes: Pipe[] = [
    { id: 'P0', name: '主干 P0', from: 'N0', to: 'N1', diameter: 400,
      polyline: [[30, 0, 2], [30, 8, 2]] },
    { id: 'P1', name: '主干 P1', from: 'N1', to: 'N2', diameter: 350 },
    { id: 'P2', name: '主干 P2', from: 'N2', to: 'N3', diameter: 300 },
    { id: 'P3', name: '主干 P3', from: 'N3', to: 'N4', diameter: 250 },
    { id: 'P4', name: '主干 P4', from: 'N4', to: 'N5', diameter: 200 },
    { id: 'P5', name: '末端 P5', from: 'N5', to: 'B12', diameter: 150,
      polyline: [[380, 0, 2], [380, 4, 2], [410, 4, 2], [410, 0, 4]] },
    { id: 'P6', name: '南支 P6', from: 'N2', to: 'N6', diameter: 200 },
    { id: 'P7', name: '南支 P7', from: 'N6', to: 'N7', diameter: 200 },
    { id: 'P8', name: '北支 P8', from: 'N4', to: 'N8', diameter: 150,
      polyline: [[270, 25, 2]] },
    // 楼栋挂点立管
    { id: 'PB1', name: 'B1 挂管', from: 'N1', to: 'B1', diameter: 100 },
    { id: 'PB2', name: 'B2 挂管', from: 'N1', to: 'B2', diameter: 80,
      polyline: [[60, 22, 2], [95, 22, 2]] },
    { id: 'PB3', name: 'B3 挂管', from: 'N6', to: 'B3', diameter: 100 },
    { id: 'PB4', name: 'B4 挂管', from: 'N6', to: 'B4', diameter: 80,
      polyline: [[130, -78, 2], [165, -78, 2]] },
    { id: 'PB5', name: 'B5 挂管', from: 'N7', to: 'B5', diameter: 80 },
    { id: 'PB6', name: 'B6 挂管', from: 'N7', to: 'B6', diameter: 80,
      polyline: [[235, -55, 2], [235, -32, 2]] },
    { id: 'PB7', name: 'B7 挂管', from: 'N8', to: 'B7', diameter: 100 },
    { id: 'PB8', name: 'B8 挂管', from: 'N8', to: 'B8', diameter: 80,
      polyline: [[305, 72, 2], [305, 50, 2]] },
    { id: 'PB9', name: 'B9 挂管', from: 'N5', to: 'B9', diameter: 80,
      polyline: [[340, 26, 2]] },
    { id: 'PB10', name: 'B10 挂管', from: 'N5', to: 'B10', diameter: 80,
      polyline: [[380, 0, 2], [380, 8, 2]] },
    { id: 'PB11', name: 'B11 挂管', from: 'N5', to: 'B11', diameter: 80,
      polyline: [[340, -30, 2]] },
  ];

  // 回水管平行外移（y 方向 -4m），保持完全相同的拓扑
  const returnPipes: Pipe[] = supplyPipes.map((p) => ({
    ...p,
    id: `R${p.id}`,
    name: `回水 ${p.name}`,
    polyline: p.polyline?.map(
      ([x, y, z]) => [x, y - 4, z] as [number, number, number],
    ),
  }));

  return {
    version: 1,
    name: '示范片区热网',
    nodes,
    supplyPipes,
    returnPipes,
  };
}
