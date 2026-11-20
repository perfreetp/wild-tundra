// 程序化生成"站城一体化"建筑群:站房 + 商业裙楼 + 住宅塔楼
// 每个楼层一个网格,携带 FloorInfo 元数据,用于分层高亮与面积计算
import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
} from "@babylonjs/core";
import type { BuildingCategory, FloorInfo } from "./types";

export interface BuildingSpec {
  buildingId: string;
  buildingName: string;
  category: BuildingCategory;
  center: [number, number]; // XZ
  width: number; // X 向
  depth: number; // Z 向
  floors: number;
  floorHeight: number;
}

export interface BuiltModel {
  floors: FloorInfo[];
  /** floorId -> 实体网格 */
  floorMeshes: Map<string, Mesh>;
  /** 所有需要参与剖切的实体网格(含装饰构件) */
  solidMeshes: Mesh[];
  /** 类别基础材质(选中楼层时做高亮替换用) */
  categoryMaterials: Record<BuildingCategory, StandardMaterial>;
  /** 高亮材质 */
  highlightMaterial: StandardMaterial;
}

export const CATEGORY_COLORS: Record<BuildingCategory, Color3> = {
  station: new Color3(0.35, 0.55, 0.85), // 站房:钢蓝
  commercial: new Color3(0.92, 0.6, 0.25), // 商业:暖橙
  residential: new Color3(0.55, 0.78, 0.55), // 住宅:浅绿
};

/** 站城一体化建筑群布局(单位:米) */
export const BUILDING_SPECS: BuildingSpec[] = [
  // 站房:2 层高大空间
  { buildingId: "STA", buildingName: "枢纽站房", category: "station", center: [0, 0], width: 100, depth: 60, floors: 2, floorHeight: 12 },
  // 商业裙楼:南北两块
  { buildingId: "COM-N", buildingName: "商业裙楼·北", category: "commercial", center: [0, -62], width: 130, depth: 34, floors: 4, floorHeight: 5 },
  { buildingId: "COM-S", buildingName: "商业裙楼·南", category: "commercial", center: [0, 62], width: 130, depth: 34, floors: 4, floorHeight: 5 },
  // 住宅塔楼:四角
  { buildingId: "T1", buildingName: "住宅 T1", category: "residential", center: [-85, -85], width: 26, depth: 26, floors: 30, floorHeight: 3 },
  { buildingId: "T2", buildingName: "住宅 T2", category: "residential", center: [85, -85], width: 26, depth: 26, floors: 36, floorHeight: 3 },
  { buildingId: "T3", buildingName: "住宅 T3", category: "residential", center: [-85, 85], width: 26, depth: 26, floors: 24, floorHeight: 3 },
  { buildingId: "T4", buildingName: "住宅 T4", category: "residential", center: [85, 85], width: 30, depth: 30, floors: 40, floorHeight: 3 },
];

function floorId(spec: BuildingSpec, floor: number): string {
  return `${spec.buildingId}-F${String(floor).padStart(2, "0")}`;
}

export function buildStationCity(scene: Scene): BuiltModel {
  const categoryMaterials = {
    station: makeSolid(scene, "站房", CATEGORY_COLORS.station),
    commercial: makeSolid(scene, "商业", CATEGORY_COLORS.commercial),
    residential: makeSolid(scene, "住宅", CATEGORY_COLORS.residential),
  };
  const highlightMaterial = makeSolid(scene, "高亮", new Color3(1, 0.85, 0.2));
  highlightMaterial.emissiveColor = new Color3(0.9, 0.6, 0.05);

  const floors: FloorInfo[] = [];
  const floorMeshes = new Map<string, Mesh>();
  const solidMeshes: Mesh[] = [];

  for (const spec of BUILDING_SPECS) {
    for (let f = 1; f <= spec.floors; f++) {
      const zMin = (f - 1) * spec.floorHeight;
      const zMax = f * spec.floorHeight;
      // 立面进退:每 3 层略微收分,让楼层分界可读
      const shrink = 1 - 0.015 * (f % 3);
      const w = spec.width * shrink;
      const d = spec.depth * shrink;
      const id = floorId(spec, f);
      const mesh = MeshBuilder.CreateBox(
        id,
        { width: w, depth: d, height: spec.floorHeight - 0.12 },
        scene,
      );
      mesh.position.set(spec.center[0], zMin + spec.floorHeight / 2, spec.center[1]);
      mesh.material = categoryMaterials[spec.category];
      mesh.isPickable = false;

      const info: FloorInfo = {
        id,
        buildingId: spec.buildingId,
        buildingName: spec.buildingName,
        category: spec.category,
        floor: f,
        zMin,
        zMax,
      };
      mesh.metadata = { floor: info };
      floors.push(info);
      floorMeshes.set(id, mesh);
      solidMeshes.push(mesh);
    }
  }

  // 站房屋顶装饰(大跨屋面,参与剖切但不计入楼层)
  const roof = MeshBuilder.CreateBox(
    "STA-ROOF",
    { width: 108, depth: 68, height: 3 },
    scene,
  );
  roof.position.set(0, 2 * 12 + 1.5, 0);
  roof.material = categoryMaterials.station;
  roof.isPickable = false;
  solidMeshes.push(roof);

  return { floors, floorMeshes, solidMeshes, categoryMaterials, highlightMaterial };
}

function makeSolid(scene: Scene, name: string, color: Color3): StandardMaterial {
  const mat = new StandardMaterial(`solid-${name}`, scene);
  mat.diffuseColor = color;
  mat.specularColor = new Color3(0.08, 0.08, 0.08);
  return mat;
}
