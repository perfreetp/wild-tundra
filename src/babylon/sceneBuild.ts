import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";
import { createStudioMaterial } from "./studioMaterial";
import { TERRAIN_FRAGMENT_WGSL, TERRAIN_VERTEX_WGSL } from "./terrainShader";
import type { TerrainData } from "../core/types";
import type { Corridor } from "../core/corridor";
import type { CorridorRaster } from "../core/raster";
import { sampleTerrain } from "../core/terrain";
import { excavateTerrain, buildGradingGeometry, buildBoundaryRibbon } from "../core/grading";
import { clamp } from "../core/math";

export interface TerrainView {
  mesh: Mesh;
  material: ShaderMaterial;
  grading: Mesh;
  gradingMaterial: ShaderMaterial;
  boundary: Mesh;
  skirt: Mesh;
  update(corridor: Corridor, raster: CorridorRaster, showZones: boolean, skipTerrain?: boolean): void;
  updateGrading(corridor: Corridor, showZones: boolean): void;
  setDisplayMode(mode: "solid" | "wire" | "hidden"): void;
  setShowZones(show: boolean): void;
  dispose(): void;
}

export function buildTerrainMesh(scene: Scene, terrain: TerrainData): TerrainView {
  ShaderStore.ShadersStoreWGSL["terrainVertexShader"] = TERRAIN_VERTEX_WGSL;
  ShaderStore.ShadersStoreWGSL["terrainPixelShader"] = TERRAIN_FRAGMENT_WGSL;

  const { nx, nz, cell, originX, originZ, heights } = terrain;
  const count = nx * nz;
  const basePositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const indices = new Uint32Array((nx - 1) * (nz - 1) * 6);

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;
      basePositions[idx * 3] = originX + i * cell;
      basePositions[idx * 3 + 1] = heights[idx];
      basePositions[idx * 3 + 2] = originZ + j * cell;
      colors[idx * 4 + 3] = 1;
    }
  }

  let k = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = j * nx + i + 1;
      const c = (j + 1) * nx + i;
      const d = (j + 1) * nx + i + 1;
      indices[k++] = a; indices[k++] = b; indices[k++] = c;
      indices[k++] = b; indices[k++] = d; indices[k++] = c;
    }
  }

  const mesh = new Mesh("terrain", scene);
  const vd = new VertexData();
  vd.positions = basePositions;
  vd.normals = new Float32Array(count * 3);
  vd.colors = colors;
  vd.indices = indices;
  vd.applyToMesh(mesh, true);
  mesh.isPickable = true;
  refreshNormals(mesh, nx, nz, cell);
  const skirt = buildTerrainSkirt(scene, terrain);

  const material = new ShaderMaterial("terrainMat", scene, "terrain", {
    attributes: ["position", "normal", "color"],
    uniforms: [
      "world", "worldViewProjection", "sunDir", "cameraPosition",
      "heightRange", "showZones", "boundaryColor", "fillColor", "cutColor",
    ],
    shaderLanguage: ShaderLanguage.WGSL,
  });
  material.setVector3("sunDir", { x: -0.55, y: 0.72, z: 0.42 });
  material.setVector2("heightRange", { x: terrain.minH, y: terrain.maxH });
  material.setFloat("showZones", 1);
  material.setColor4("boundaryColor", { r: 0.97, g: 0.985, b: 0.94, a: 1 });
  material.setColor3("fillColor", new Color3(0.796, 0.596, 0.318));
  material.setColor3("cutColor", new Color3(0.263, 0.6, 0.643));
  mesh.material = material;

  const grading = new Mesh("grading", scene);
  const gradingMaterial = createStudioMaterial(scene, "gradingMat", { rimPower: 0.04, twoSided: true });
  grading.material = gradingMaterial;
  grading.isPickable = false;

  const boundary = new Mesh("boundary", scene);
  const boundaryMaterial = createStudioMaterial(scene, "boundaryMat", { rimPower: 0.3, twoSided: true });
  boundary.material = boundaryMaterial;
  boundary.isPickable = false;

  let currentMode: "solid" | "wire" | "hidden" = "solid";
  let tintBuffer: Float32Array | null = null;
  // 复用颜色缓冲，首帧前清零一次


  const view: TerrainView = {
    mesh,
    material,
    grading,
    gradingMaterial,
    boundary,
    skirt,
    updateGrading(corridor, showZones) {
      const geo = buildGradingGeometry(corridor);
      const gvd = new VertexData();
      gvd.positions = geo.positions;
      gvd.normals = geo.normals;
      gvd.colors = geo.colors;
      gvd.indices = geo.indices;
      gvd.applyToMesh(grading, true);

      const ribbon = buildBoundaryRibbon(corridor);
      const bvd = new VertexData();
      bvd.positions = ribbon.positions;
      bvd.colors = ribbon.colors;
      const bn = new Float32Array(ribbon.positions.length);
      for (let i = 1; i < bn.length; i += 3) bn[i] = 1;
      bvd.normals = bn;
      bvd.indices = ribbon.indices;
      bvd.applyToMesh(boundary, true);
      boundary.setEnabled(currentMode !== "hidden" && showZones);
    },
    update(corridor, raster, showZones, skipTerrain = false) {
      if (skipTerrain) {
        this.updateGrading(corridor, showZones);
        material.setFloat("showZones", showZones ? 1 : 0);
        return;
      }
      const graded = excavateTerrain(terrain, corridor);
      let dirtyRows: [number, number] | null = null;
      {
        let z0 = Infinity, z1 = -Infinity;
        for (const st of corridor.stations) {
          const r = Math.max(st.left.offset, st.right.offset) + cell * 2.5;
          if (st.z - r < z0) z0 = st.z - r;
          if (st.z + r > z1) z1 = st.z + r;
        }
        if (Number.isFinite(z0)) {
          dirtyRows = [
            clamp(Math.floor((z0 - originZ) / cell) - 1, 0, nz - 1),
            clamp(Math.ceil((z1 - originZ) / cell) + 1, 0, nz - 1),
          ];
        }
      }

      const pos = mesh.getVerticesData(VertexBuffer.PositionKind);
      if (pos) {
        // 只更新与走廊相交的行带（minZ..maxZ），其余网格高度不变
        if (dirtyRows) {
          const [j0, j1] = dirtyRows;
          for (let j = j0; j <= j1; j++) {
            const row = j * nx;
            for (let i = 0; i < nx; i++) pos[(row + i) * 3 + 1] = graded.heights[row + i];
          }
          mesh.updateVerticesData(VertexBuffer.PositionKind, pos);
        }
      }
      refreshNormals(mesh, nx, nz, cell);

      // 用解析计算的每顶点填挖覆盖度刷顶点色，边界不受栅格量化影响
      if (!tintBuffer) tintBuffer = new Float32Array(count * 4);
      tintBuffer.fill(0);
      const gfv = graded.fill;
      const gcv = graded.cut;
      for (let v = 0; v < count; v++) {
        const f = gfv[v];
        const c = gcv[v];
        if (f <= 0 && c <= 0) continue;
        tintBuffer[v * 4] = f;
        tintBuffer[v * 4 + 1] = c;
        tintBuffer[v * 4 + 3] = 1;
      }
      mesh.updateVerticesData(VertexBuffer.ColorKind, tintBuffer);

      const geo = buildGradingGeometry(corridor);
      const gvd = new VertexData();
      gvd.positions = geo.positions;
      gvd.normals = geo.normals;
      gvd.colors = geo.colors;
      gvd.indices = geo.indices;
      gvd.applyToMesh(grading, true);

      view.updateGrading(corridor, showZones);
      grading.setEnabled(currentMode !== "hidden");
      material.setFloat("showZones", showZones ? 1 : 0);
    },
    setDisplayMode(mode) {
      currentMode = mode;
      mesh.setEnabled(mode !== "hidden");
      grading.setEnabled(mode !== "hidden");
      boundary.setEnabled(mode !== "hidden");
      skirt.setEnabled(mode !== "hidden");
      if (mesh.material) mesh.material.wireframe = mode === "wire";
      gradingMaterial.wireframe = mode === "wire";
    },
    setShowZones(show) {
      material.setFloat("showZones", show ? 1 : 0);
      // 地形模式下同时显示描边带，保证“只看地形”时也能看到挖填分界
      boundary.setEnabled(show && currentMode !== "hidden");
    },
    dispose() {
      mesh.dispose();
      grading.dispose();
      boundary.dispose();
      skirt.dispose();
    },
  };
  return view;
}

/**
 * 地形四周的裙边：从边缘顶点向下延伸一段，让地形看起来是实体地块，
 * 而不是悬浮的一片布。
 */
function buildTerrainSkirt(scene: Scene, terrain: TerrainData): Mesh {
  const { nx, nz, cell, originX, originZ, heights } = terrain;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const minH = terrain.minH;
  const baseColor: [number, number, number] = [0.29, 0.28, 0.26];
  const topColor: [number, number, number] = [0.4, 0.38, 0.34];

  const pushEdge = (verts: [number, number, number][]) => {
    const base = pos.length / 3;
    for (const v of verts) {
      pos.push(v[0], v[1], v[2]);
      col.push(baseColor[0], baseColor[1], baseColor[2], 1);
    }
    const n = verts.length;
    for (let i = 0; i < n / 2 - 1; i++) {
      idx.push(base + i * 2, base + i * 2 + 2, base + i * 2 + 1);
      idx.push(base + i * 2 + 1, base + i * 2 + 2, base + i * 2 + 3);
    }
    void topColor;
  };

  // 四条边：每条边的上半是边缘线，下半是下沉的裙底
  const edges: [number, number, number][][] = [];
  // 西 / 东
  const west: [number, number, number][] = [];
  const east: [number, number, number][] = [];
  const north: [number, number, number][] = [];
  const south: [number, number, number][] = [];
  for (let j = 0; j < nz; j++) {
    const z = originZ + j * cell;
    west.push([originX, heights[j * nx], z]);
    east.push([originX + (nx - 1) * cell, heights[j * nx + nx - 1], z]);
  }
  for (let i = 0; i < nx; i++) {
    const x = originX + i * cell;
    north.push([x, heights[i], originZ]);
    south.push([x, heights[(nz - 1) * nx + i], originZ + (nz - 1) * cell]);
  }
  edges.push(west, east, north, south);

  const drop = Math.max(18, (terrain.maxH - minH) * 0.9);
  for (const edge of edges) {
    const verts: [number, number, number][] = [];
    for (const [x, y, z] of edge) {
      verts.push([x, y, z]);
      verts.push([x, y - drop, z]);
    }
    pushEdge(verts);
  }

  const mesh = new Mesh("terrainSkirt", scene);
  const vd = new VertexData();
  vd.positions = new Float32Array(pos);
  vd.colors = new Float32Array(col);
  vd.indices = new Uint32Array(idx);
  const nrm = new Float32Array(pos.length);
  // 裙边法线朝外即可，用向上的近似，靠双面材质兜底
  for (let i = 1; i < nrm.length; i += 3) nrm[i] = 0.2;
  vd.normals = nrm;
  vd.applyToMesh(mesh, false);
  mesh.material = createStudioMaterial(scene, "skirtMat", { rimPower: 0.0, twoSided: true });
  mesh.isPickable = false;
  return mesh;
}

let nrmScratch: Float32Array | null = null;

function refreshNormals(mesh: Mesh, nx: number, nz: number, cell: number) {
  const pos = mesh.getVerticesData(VertexBuffer.PositionKind);
  if (!pos) return;
  if (!nrmScratch || nrmScratch.length < nx * nz * 3) {
    nrmScratch = new Float32Array(nx * nz * 3);
  }
  const nrm = nrmScratch;
  nrm.fill(0);
  const h = (i: number) => pos[i * 3 + 1];
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const i0 = j * nx + i;
      const i1 = j * nx + i + 1;
      const i2 = (j + 1) * nx + i;
      const i3 = (j + 1) * nx + i + 1;
      const dx = ((h(i1) - h(i0)) / cell + (h(i3) - h(i2)) / cell) * 0.5;
      const dz = ((h(i2) - h(i0)) / cell + (h(i3) - h(i1)) / cell) * 0.5;
      const l = Math.hypot(dx, 1, dz);
      const nxn = -dx / l;
      const nyn = 1 / l;
      const nzn = -dz / l;
      for (const o of [i0, i1, i2, i3]) {
        nrm[o * 3] += nxn;
        nrm[o * 3 + 1] += nyn;
        nrm[o * 3 + 2] += nzn;
      }
    }
  }
  for (let i = 0; i < nx * nz; i++) {
    const x = nrm[i * 3];
    const y = nrm[i * 3 + 1];
    const z = nrm[i * 3 + 2];
    const l = Math.hypot(x, y, z) || 1;
    nrm[i * 3] = x / l;
    nrm[i * 3 + 1] = y / l;
    nrm[i * 3 + 2] = z / l;
  }
  mesh.updateVerticesData(VertexBuffer.NormalKind, nrm.subarray(0, nx * nz * 3));
}

/** 沿线里程标：小方块 + 竖直杆。 */
export function buildMarkers(scene: Scene, corridor: Corridor, terrain: TerrainData, spacing: number) {
  const root = new Mesh("markersRoot", scene);
  const positions: number[] = [];
  const normals: number[] = [];
  const cols: number[] = [];
  const idx: number[] = [];
  const postColor = new Color3(0.93, 0.95, 0.98);
  const accent = new Color3(0.99, 0.73, 0.3);

  const pushBox = (
    cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, col: Color3
  ) => {
    const faces: [number[], [number, number, number][]][] = [
      [[1, 0, 0], [[hx, -hy, -hz], [hx, -hy, hz], [hx, hy, hz], [hx, hy, -hz]]],
      [[-1, 0, 0], [[-hx, -hy, hz], [-hx, -hy, -hz], [-hx, hy, -hz], [-hx, hy, hz]]],
      [[0, 0, 1], [[hx, -hy, hz], [-hx, -hy, hz], [-hx, hy, hz], [hx, hy, hz]]],
      [[0, 0, -1], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz]]],
      [[0, 1, 0], [[-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]]],
      [[0, -1, 0], [[-hx, -hy, hz], [hx, -hy, hz], [hx, -hy, -hz], [-hx, -hy, -hz]]],
    ];
    for (const [n, quad] of faces) {
      const base = positions.length / 3;
      for (const p of quad) {
        positions.push(cx + p[0], cy + p[1], cz + p[2]);
        normals.push(n[0], n[1], n[2]);
        cols.push(col.r, col.g, col.b, 1);
      }
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  };

  const markers: { s: number; label: string; pos: Vector3 }[] = [];
  const total = corridor.plan.length;
  if (total > 5 && corridor.stations.length > 1) {
    const stations = corridor.stations;
    for (let s = 0; s <= total; s += spacing) {
      let st = stations[0];
      let best = Infinity;
      for (const c of stations) {
        const d = Math.abs(c.s - s);
        if (d < best) { best = d; st = c; }
      }
      if (best > spacing * 0.5) continue;
      const groundY = sampleTerrain(terrain, st.x, st.z);
      const baseY = Math.min(groundY, st.formY) - 0.35;
      const topY = st.formY + 4.6;
      const cx = st.x + st.nx * (st.halfFormation + 2.2);
      const cz = st.z + st.nz * (st.halfFormation + 2.2);
      // 立柱
      pushBox(cx, (baseY + topY) / 2, cz, 0.13, (topY - baseY) / 2, 0.13, postColor);
      // 顶部黄色标牌（朝向线路外侧）
      pushBox(cx, topY + 0.55, cz, 0.86, 0.42, 0.1, accent);
      // 立柱底部加一个基座，视觉上落地更稳
      pushBox(cx, baseY + 0.25, cz, 0.42, 0.25, 0.42, postColor);
      markers.push({ s, label: formatKm(s), pos: new Vector3(cx, topY + 1.9, cz) });
    }
  }
  if (positions.length > 0) {
    const vd = new VertexData();
    vd.positions = new Float32Array(positions);
    vd.normals = new Float32Array(normals);
    vd.colors = new Float32Array(cols);
    vd.indices = new Uint32Array(idx);
    vd.applyToMesh(root, true);
    root.material = createStudioMaterial(scene, "markerMat", { rimPower: 0.12 });
    root.isPickable = false;
  }
  return { root, markers };
}

function formatKm(s: number): string {
  const km = Math.floor(s / 1000);
  const m = Math.round(s % 1000);
  return `K${km}+${String(m).padStart(3, "0")}`;
}
