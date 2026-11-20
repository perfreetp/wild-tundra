// Babylon.js 渲染引擎:分块距离 LOD、射线拾取雕刻、等高线着色、环形指示圈
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Mesh,
  VertexData,
  VertexBuffer,
  ShaderMaterial,
  Effect,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  PointerEventTypes
} from '@babylonjs/core';
import { store } from '../store.js';
import {
  HeightField,
  N,
  WORLD_SIZE,
  CELL,
  CHUNKS_PER_SIDE
} from './heightfield.js';
import { generateCanyon } from './noise.js';
import { encodeHeightmapPNG, decodePNG } from './png16.js';

const CHUNK_CELLS = 64;
const SKIRT_DEPTH = 3;               // 裙摆深度(米),遮蔽相邻块不同 LOD 的接缝
const LOD_DIST = [180, 380, 650];    // 距离阈值,之外依次降档
const WATER_LEVEL = 4.0;
const RING_SEGMENTS = 64;

let currentApp = null;
export function getApp() {
  return currentApp;
}

/* ---------------- 等高线着色器(每 5 米一条,随顶点移动自动重绘) ---------------- */

Effect.ShadersStore['contourVertexShader'] = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vWorldPos = (world * vec4(position, 1.0)).xyz;
  vNormal = normalize(mat3(world) * normal);
  gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

Effect.ShadersStore['contourFragmentShader'] = /* glsl */ `
precision highp float;
varying vec3 vWorldPos;
varying vec3 vNormal;
uniform vec3 lightDir;

void main() {
  float h = vWorldPos.y;
  // 溯溪峡谷配色:溪床 -> 草甸 -> 岩壁 -> 高岭
  vec3 waterC = vec3(0.18, 0.36, 0.42);
  vec3 grassC = vec3(0.28, 0.46, 0.22);
  vec3 rockC  = vec3(0.46, 0.41, 0.35);
  vec3 highC  = vec3(0.82, 0.84, 0.87);
  vec3 col = mix(waterC, grassC, smoothstep(1.0, 9.0, h));
  col = mix(col, rockC, smoothstep(22.0, 46.0, h));
  col = mix(col, highC, smoothstep(62.0, 84.0, h));
  // 陡坡染岩色
  float slope = 1.0 - clamp(vNormal.y, 0.0, 1.0);
  col = mix(col, rockC * 0.85, smoothstep(0.30, 0.62, slope));
  // 简单朗伯光照
  float ndl = max(dot(normalize(vNormal), normalize(lightDir)), 0.0);
  vec3 lit = col * (0.38 + 0.62 * ndl);
  // 等高线:每 5 米一条细线,每 25 米一条主线(抗锯齿用屏幕空间导数)
  float g = h / 5.0;
  float f = abs(fract(g + 0.5) - 0.5);
  float minor = 1.0 - smoothstep(0.0, 1.2 * fwidth(g), f);
  float g5 = h / 25.0;
  float f5 = abs(fract(g5 + 0.5) - 0.5);
  float major = 1.0 - smoothstep(0.0, 1.6 * fwidth(g5), f5);
  lit = mix(lit, vec3(0.10, 0.08, 0.05), minor * 0.35);
  lit = mix(lit, vec3(0.04, 0.03, 0.02), major * 0.55);
  gl_FragColor = vec4(lit, 1.0);
}
`;

/* ---------------- 地形分块 ---------------- */

class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.x0 = cx * CHUNK_CELLS;
    this.z0 = cz * CHUNK_CELLS;
    this.x1 = Math.min(this.x0 + CHUNK_CELLS, N - 1);
    this.z1 = Math.min(this.z0 + CHUNK_CELLS, N - 1);
    this.cellsX = this.x1 - this.x0;
    this.cellsZ = this.z1 - this.z0;
    this.lod = -1;
    this.mesh = null;
    this.centerX = (this.x0 + this.cellsX / 2) * CELL;
    this.centerZ = (this.z0 + this.cellsZ / 2) * CELL;
  }

  /** 各 LOD 档的采样步长(须整除块格数) */
  steps() {
    return this.cellsX === CHUNK_CELLS ? [1, 2, 4, 8] : [1, 3, 7, 21];
  }

  build(scene, heights, material, lod) {
    const steps = this.steps();
    const step = steps[Math.min(lod, steps.length - 1)];
    this.step = step;
    this.lod = lod;
    const nx = (this.cellsX / step) | 0;
    const nz = (this.cellsZ / step) | 0;
    this.nx = nx + 1;
    this.nz = nz + 1;
    const gridCount = this.nx * this.nz;

    // 边界环(用于裙摆):上→右→下→左
    const loop = [];
    for (let i = 0; i < this.nx; i++) loop.push(i);
    for (let j = 1; j < this.nz; j++) loop.push(j * this.nx + this.nx - 1);
    for (let i = this.nx - 2; i >= 0; i--) loop.push((this.nz - 1) * this.nx + i);
    for (let j = this.nz - 2; j >= 1; j--) loop.push(j * this.nx);
    this.loop = loop;
    this.gridCount = gridCount;

    const total = gridCount + loop.length;
    this.positions = new Float32Array(total * 3);
    this.normals = new Float32Array(total * 3);
    fillVertices(this.positions, this.normals, heights, this);

    const indices = [];
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const v00 = j * this.nx + i;
        const v10 = v00 + 1;
        const v01 = v00 + this.nx;
        const v11 = v01 + 1;
        indices.push(v00, v01, v10, v10, v01, v11);
      }
    }
    for (let k = 0; k < loop.length; k++) {
      const a = loop[k];
      const b = loop[(k + 1) % loop.length];
      const sa = gridCount + k;
      const sb = gridCount + ((k + 1) % loop.length);
      indices.push(a, b, sb, a, sb, sa);
    }

    if (this.mesh) this.mesh.dispose();
    const mesh = new Mesh(`chunk_${this.cx}_${this.cz}`, scene);
    const vd = new VertexData();
    vd.positions = this.positions;
    vd.normals = this.normals;
    vd.indices = indices;
    vd.applyToMesh(mesh, true); // updatable
    mesh.material = material;
    mesh.isPickable = false;
    this.mesh = mesh;
  }

  /** 高度变化后原地刷新顶点与法线(不重建索引) */
  updateHeights(heights) {
    fillVertices(this.positions, this.normals, heights, this);
    this.mesh.updateVerticesData(VertexBuffer.PositionKind, this.positions);
    this.mesh.updateVerticesData(VertexBuffer.NormalKind, this.normals);
    this.mesh.refreshBoundingInfo();
  }
}

function fillVertices(positions, normals, heights, chunk) {
  const { x0, z0, step, nx, nz, loop, gridCount } = chunk;
  for (let j = 0; j < nz; j++) {
    const gz = z0 + j * step;
    for (let i = 0; i < nx; i++) {
      const gx = x0 + i * step;
      const k = (j * nx + i) * 3;
      positions[k] = gx * CELL;
      positions[k + 1] = heights[gz * N + gx];
      positions[k + 2] = gz * CELL;
      writeNormal(heights, gx, gz, normals, k);
    }
  }
  for (let s = 0; s < loop.length; s++) {
    const src = loop[s] * 3;
    const dst = (gridCount + s) * 3;
    positions[dst] = positions[src];
    positions[dst + 1] = positions[src + 1] - SKIRT_DEPTH;
    positions[dst + 2] = positions[src + 2];
    normals[dst] = normals[src];
    normals[dst + 1] = normals[src + 1];
    normals[dst + 2] = normals[src + 2];
  }
}

function writeNormal(heights, gx, gz, normals, k) {
  const xl = gx > 0 ? gx - 1 : gx;
  const xr = gx < N - 1 ? gx + 1 : gx;
  const zu = gz > 0 ? gz - 1 : gz;
  const zd = gz < N - 1 ? gz + 1 : gz;
  const nx = heights[gz * N + xl] - heights[gz * N + xr];
  const nz = heights[zu * N + gx] - heights[zd * N + gx];
  const ny = 2 * CELL;
  const inv = 1 / Math.hypot(nx, ny, nz);
  normals[k] = nx * inv;
  normals[k + 1] = ny * inv;
  normals[k + 2] = nz * inv;
}

/* ---------------- 射线行进拾取(直接对高度场求交,与渲染 LOD 无关) ---------------- */

function pickTerrain(hf, ray) {
  const o = ray.origin;
  const d = ray.direction;
  let t = 0;
  let prevT = 0;
  const maxT = 5000;
  while (t < maxT) {
    t += 1.0;
    const px = o.x + d.x * t;
    const py = o.y + d.y * t;
    const pz = o.z + d.z * t;
    if (px < 0 || px > WORLD_SIZE || pz < 0 || pz > WORLD_SIZE) {
      if (py > 300 && d.y >= 0) return null;
      prevT = t;
      continue;
    }
    if (py - hf.sampleWorld(px, pz) <= 0) {
      // 二分细化
      let lo = prevT;
      let hi = t;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const mx = o.x + d.x * mid;
        const my = o.y + d.y * mid;
        const mz = o.z + d.z * mid;
        if (mx < 0 || mx > WORLD_SIZE || mz < 0 || mz > WORLD_SIZE || my - hf.sampleWorld(mx, mz) > 0) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const ft = (lo + hi) / 2;
      return new Vector3(o.x + d.x * ft, o.y + d.y * ft, o.z + d.z * ft);
    }
    prevT = t;
  }
  return null;
}

/* ---------------- 主应用 ---------------- */

export function createTerrainApp(canvas) {
  const hf = new HeightField();
  generateCanyon(hf.heights);

  const engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.60, 0.73, 0.85, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0005;
  scene.fogColor = new Color3(0.60, 0.73, 0.85);

  // 轨道相机:右键环绕,滚轮缩放,Ctrl+右键平移(左键留给雕刻)
  const camera = new ArcRotateCamera(
    'cam', -Math.PI / 2, 1.08, 1000,
    new Vector3(WORLD_SIZE / 2, 0, WORLD_SIZE / 2), scene
  );
  camera.attachControl(canvas, true);
  camera.inputs.attached.pointers.buttons = [1, 2];
  camera.wheelDeltaPercentage = 0.01;
  camera.minZ = 1;
  camera.maxZ = 6000;
  camera.lowerRadiusLimit = 30;
  camera.upperRadiusLimit = 2600;
  camera.upperBetaLimit = 1.5;
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const hemi = new HemisphericLight('hemi', new Vector3(0.3, 1, 0.2), scene);
  hemi.intensity = 0.9;
  const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), scene);
  sun.intensity = 0.7;

  const terrainMat = new ShaderMaterial(
    'contour', scene,
    { vertex: 'contour', fragment: 'contour' },
    {
      attributes: ['position', 'normal'],
      uniforms: ['world', 'worldViewProjection', 'lightDir']
    }
  );
  terrainMat.setVector3('lightDir', new Vector3(0.45, 0.8, 0.35).normalize());

  // 分块
  const chunks = [];
  for (let cz = 0; cz < CHUNKS_PER_SIDE; cz++) {
    for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
      chunks.push(new Chunk(cx, cz));
    }
  }
  const lodFor = (chunk) => {
    const dx = camera.position.x - chunk.centerX;
    const dz = camera.position.z - chunk.centerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    for (let i = 0; i < LOD_DIST.length; i++) {
      if (dist < LOD_DIST[i]) return i;
    }
    return LOD_DIST.length;
  };
  for (const c of chunks) c.build(scene, hf.heights, terrainMat, lodFor(c));

  // 溪流水面
  const water = MeshBuilder.CreateGround('water', { width: WORLD_SIZE + 600, height: WORLD_SIZE + 600 }, scene);
  water.position.set(WORLD_SIZE / 2, WATER_LEVEL, WORLD_SIZE / 2);
  const waterMat = new StandardMaterial('waterMat', scene);
  waterMat.diffuseColor = new Color3(0.10, 0.30, 0.42);
  waterMat.specularColor = new Color3(0.25, 0.25, 0.25);
  waterMat.alpha = 0.55;
  water.material = waterMat;
  water.isPickable = false;

  // 笔刷环形指示圈(贴合地表,随半径缩放)
  const ringPositions = new Float32Array((RING_SEGMENTS + 1) * 3);
  const ring = MeshBuilder.CreateLines('ring', {
    points: Array.from({ length: RING_SEGMENTS + 1 }, () => Vector3.Zero()),
    updatable: true
  }, scene);
  ring.color = new Color3(1, 0.55, 0.1);
  ring.alpha = 0.9;
  ring.isVisible = false;
  ring.isPickable = false;

  const updateRing = (center) => {
    const r = store.radius * CELL;
    for (let k = 0; k <= RING_SEGMENTS; k++) {
      const a = (k / RING_SEGMENTS) * Math.PI * 2;
      const wx = center.x + Math.cos(a) * r;
      const wz = center.z + Math.sin(a) * r;
      ringPositions[k * 3] = wx;
      ringPositions[k * 3 + 1] = hf.sampleWorld(wx, wz) + 0.5;
      ringPositions[k * 3 + 2] = wz;
    }
    ring.updateVerticesData(VertexBuffer.PositionKind, ringPositions);
  };

  /* -------- 统计与撤销标志 -------- */

  const updateStats = () => {
    const { min, max } = hf.minMax();
    store.minAlt = min;
    store.maxAlt = max;
  };
  const syncUndoFlags = () => {
    store.canUndo = hf.undoStack.length > 0;
    store.canRedo = hf.redoStack.length > 0;
  };
  updateStats();

  /* -------- 指针交互:左键雕刻 -------- */

  let sculpting = false;
  let hover = null;
  let flattenTarget = 0;

  const raycast = () => {
    const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, null, camera);
    return pickTerrain(hf, ray);
  };

  const endStroke = () => {
    if (!sculpting) return;
    sculpting = false;
    hf.commitStroke();
    syncUndoFlags();
    updateStats();
  };

  scene.onPointerObservable.add((pi) => {
    if (pi.type === PointerEventTypes.POINTERMOVE) {
      hover = raycast();
      ring.isVisible = !!hover;
      if (hover) {
        updateRing(hover);
        store.affectedCells = Math.round(Math.PI * store.radius * store.radius);
      }
    } else if (pi.type === PointerEventTypes.POINTERDOWN) {
      if (pi.event.button === 0) {
        const hit = raycast();
        if (hit) {
          sculpting = true;
          hover = hit;
          hf.beginStroke();
          if (store.brush === 'flatten') {
            flattenTarget = hf.sample(hit.x / CELL, hit.z / CELL); // 首次采样高度
          }
        }
      }
    } else if (pi.type === PointerEventTypes.POINTERUP) {
      endStroke();
    }
  });
  const onWindowUp = () => endStroke();
  window.addEventListener('pointerup', onWindowUp);

  /* -------- 主循环:逐帧雕刻 + 脏块刷新 + LOD 调度 -------- */

  let frame = 0;
  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
    if (sculpting && hover) {
      const hit = raycast(); // 相机可能已移动,重新拾取
      if (hit) hover = hit;
      store.affectedCells = hf.applyBrush(hover.x / CELL, hover.z / CELL, {
        type: store.brush,
        strength: store.strength,
        radius: store.radius,
        dt,
        flattenTarget
      });
      updateRing(hover);
    }
    if (hf.dirtyChunks.size) {
      for (const ci of hf.dirtyChunks) chunks[ci].updateHeights(hf.heights);
      hf.dirtyChunks.clear();
    }
    frame++;
    if (frame % 20 === 0) {
      for (const c of chunks) {
        const lod = lodFor(c);
        if (lod !== c.lod) c.build(scene, hf.heights, terrainMat, lod);
      }
    }
    if (frame % 15 === 0) {
      store.fps = Math.round(engine.getFps());
      if (sculpting) updateStats();
    }
  });
  engine.runRenderLoop(() => scene.render());

  /* -------- 快捷键 -------- */

  const doUndo = () => {
    if (hf.undo()) {
      syncUndoFlags();
      updateStats();
    }
  };
  const doRedo = () => {
    if (hf.redo()) {
      syncUndoFlags();
      updateStats();
    }
  };
  const onKey = (e) => {
    const k = e.key.toLowerCase();
    if (e.ctrlKey && !e.shiftKey && k === 'z') {
      e.preventDefault();
      doUndo();
    } else if ((e.ctrlKey && k === 'y') || (e.ctrlKey && e.shiftKey && k === 'z')) {
      e.preventDefault();
      doRedo();
    } else if (k === '1') store.brush = 'raise';
    else if (k === '2') store.brush = 'smooth';
    else if (k === '3') store.brush = 'flatten';
  };
  window.addEventListener('keydown', onKey);

  const onResize = () => engine.resize();
  window.addEventListener('resize', onResize);

  /* -------- 导入导出 -------- */

  const download = (name, blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const exportHeightmap = () => {
    const { min, max } = hf.minMax();
    const range = Math.max(max - min, 1e-6);
    const u16 = new Uint16Array(N * N);
    for (let i = 0; i < N * N; i++) {
      u16[i] = Math.round(((hf.heights[i] - min) / range) * 65535);
    }
    const png = encodeHeightmapPNG(N, N, u16);
    download('heightmap.png', new Blob([png], { type: 'image/png' }));
    const meta = {
      format: 'canyon-heightmap',
      version: 1,
      width: N,
      height: N,
      bitDepth: 16,
      colorType: 'grayscale',
      minHeight: min,
      maxHeight: max,
      cellSize: CELL,
      worldSize: WORLD_SIZE,
      exportedAt: new Date().toISOString()
    };
    download('heightmap.json', new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' }));
    store.message = `已导出 heightmap.png 与 heightmap.json(海拔 ${min.toFixed(1)} ~ ${max.toFixed(1)} m)`;
  };

  const importFiles = async (fileList) => {
    const files = Array.from(fileList);
    const pngFile = files.find((f) => /\.png$/i.test(f.name));
    const jsonFile = files.find((f) => /\.json$/i.test(f.name));
    if (!pngFile) {
      store.message = '请选择 16 位灰度 heightmap.png(可连同 heightmap.json 一起选择)';
      return;
    }
    let meta = null;
    if (jsonFile) {
      try {
        meta = JSON.parse(await jsonFile.text());
      } catch {
        store.message = 'JSON 元数据解析失败,已忽略';
      }
    }
    let decoded;
    try {
      decoded = decodePNG(new Uint8Array(await pngFile.arrayBuffer()));
    } catch (err) {
      store.message = 'PNG 解码失败:' + err.message;
      return;
    }
    const { width, height, bitDepth, data } = decoded;
    const minH = meta && typeof meta.minHeight === 'number' ? meta.minHeight : 0;
    const maxH = meta && typeof meta.maxHeight === 'number' ? meta.maxHeight : 100;
    const maxVal = bitDepth === 16 ? 65535 : 255;
    const scale = (maxH - minH) / maxVal;

    const before = new Float32Array(hf.heights);
    for (let z = 0; z < N; z++) {
      const sz = (z / (N - 1)) * (height - 1);
      const z0 = Math.floor(sz);
      const z1 = Math.min(z0 + 1, height - 1);
      const fz = sz - z0;
      for (let x = 0; x < N; x++) {
        const sx = (x / (N - 1)) * (width - 1);
        const x0 = Math.floor(sx);
        const x1 = Math.min(x0 + 1, width - 1);
        const fx = sx - x0;
        const a = data[z0 * width + x0];
        const b = data[z0 * width + x1];
        const c = data[z1 * width + x0];
        const d = data[z1 * width + x1];
        const v = a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
        hf.heights[z * N + x] = minH + v * scale;
      }
    }
    hf.pushExternalChange(before);
    for (let i = 0; i < chunks.length; i++) hf.dirtyChunks.add(i);
    syncUndoFlags();
    updateStats();
    store.message = `已导入高度图 ${width}×${height}(${bitDepth} 位),海拔 ${minH.toFixed(1)} ~ ${maxH.toFixed(1)} m`;
  };

  const resetTerrain = () => {
    const before = new Float32Array(hf.heights);
    generateCanyon(hf.heights);
    hf.pushExternalChange(before);
    for (let i = 0; i < chunks.length; i++) hf.dirtyChunks.add(i);
    syncUndoFlags();
    updateStats();
    store.message = '已重新生成峡谷地形';
  };

  const app = {
    undo: doUndo,
    redo: doRedo,
    exportHeightmap,
    importFiles,
    resetTerrain,
    dispose() {
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
      if (currentApp === app) currentApp = null;
    }
  };
  currentApp = app;
  return app;
}
