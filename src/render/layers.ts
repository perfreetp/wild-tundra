import {
  BufferAttribute,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  Scene,
  SphereGeometry,
} from 'three';
import type { LayerId } from '../core/types';
import { fbm2D, mulberry32 } from '../core/math';
import { LookBinder, type LayerLook } from './look';
import type { Palette } from './palette';
import { buildBandGeometry, sweepProfile, type ProfilePoint } from './geometry';
import { getTextures } from './textures';
import { LayerLights, SURFACE } from './lights';

export interface BuiltLayer {
  id: LayerId;
  scene: Scene;
  lights: LayerLights;
  /** 应用色温 / 夜间环境 / 大气透视 */
  applyLook(look: LayerLook, palette: Palette): void;
  dispose(): void;
}

type Disposable = { dispose(): void };

const RAIL_GAUGE = 1.435;
const TRACK_START = 120;
const TRACK_END = -1500;

interface SurfaceSpec {
  color: Color;
  haze?: number;
  tint?: boolean;
  transparent?: boolean;
  opacity?: number;
  map?: MeshBasicMaterial['map'];
  /** 自发光材质（信号灯、水面反光等），不参与光照 */
  unlit?: boolean;
}

interface LayerBuilder {
  scene: Scene;
  lights: LayerLights;
  binder: LookBinder;
  garbage: Disposable[];
  surface(spec: SurfaceSpec): MeshLambertMaterial | MeshBasicMaterial;
}

function createBuilder(name: string): LayerBuilder {
  const scene = new Scene();
  scene.name = name;
  const lights = new LayerLights(scene);
  const binder = new LookBinder();
  const garbage: Disposable[] = [];

  const surface = (spec: SurfaceSpec): MeshLambertMaterial | MeshBasicMaterial => {
    const material = spec.unlit
      ? new MeshBasicMaterial({ color: spec.color.clone() })
      : new MeshLambertMaterial({ color: spec.color.clone() });
    if (spec.map) material.map = spec.map;
    if (spec.transparent) {
      material.transparent = true;
      material.opacity = spec.opacity ?? 1;
    }
    // 受光材质的色温由灯光承担，反照率只做大气透视，避免色温被叠加两次
    binder.bind(material, spec.color, spec.haze ?? 0.2, spec.unlit || (spec.tint ?? false));
    garbage.push(material);
    return material;
  };

  return { scene, lights, binder, garbage, surface };
}

/* ---------------------------------------------------------------------------
 * 近景：道床、钢轨、轨枕、接触网、信号机、道旁植被
 * ------------------------------------------------------------------------- */

function nearLayer(): BuiltLayer {
  const { scene, lights, binder, garbage, surface } = createBuilder('NearLayer');
  const textures = getTextures();
  const rand = mulberry32(8811);
  const dummy = new Object3D();

  // 道床
  const ballastProfile: ProfilePoint[] = [
    { x: -4.9, y: 0 },
    { x: 4.9, y: 0 },
    { x: 3.0, y: 0.62 },
    { x: -3.0, y: 0.62 },
  ];
  const ballastGeo = sweepProfile(ballastProfile, TRACK_START, TRACK_END, 4.2);
  const ballastTex = textures.ballast.clone();
  ballastTex.needsUpdate = true;
  ballastTex.repeat.set(1, 1);
  garbage.push(ballastGeo, ballastTex);
  scene.add(new Mesh(ballastGeo, surface({ color: SURFACE.ballast.clone(), map: ballastTex, haze: 0.16 })));

  // 轨枕
  const sleeperCount = 640;
  const sleeperGeo = new BoxGeometry(2.65, 0.17, 0.26);
  garbage.push(sleeperGeo);
  const sleepers = new InstancedMesh(sleeperGeo, surface({ color: SURFACE.sleeper.clone(), haze: 0.14 }), sleeperCount);
  const span = TRACK_START - TRACK_END;
  for (let i = 0; i < sleeperCount; i++) {
    const t = i / sleeperCount;
    const z = TRACK_START - span * Math.pow(t, 1.3);
    dummy.position.set(0, 0.705, z);
    dummy.rotation.set(0, (rand() - 0.5) * 0.004, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    sleepers.setMatrixAt(i, dummy.matrix);
  }
  sleepers.instanceMatrix.needsUpdate = true;
  scene.add(sleepers);

  // 钢轨
  const railProfile: ProfilePoint[] = [
    { x: -0.07, y: 0 },
    { x: 0.07, y: 0 },
    { x: 0.07, y: 0.03 },
    { x: 0.026, y: 0.055 },
    { x: 0.026, y: 0.135 },
    { x: 0.07, y: 0.152 },
    { x: 0.07, y: 0.176 },
    { x: -0.07, y: 0.176 },
    { x: -0.07, y: 0.152 },
    { x: -0.026, y: 0.135 },
    { x: -0.026, y: 0.055 },
    { x: -0.07, y: 0.03 },
  ];
  const railGeo = sweepProfile(railProfile, TRACK_START, TRACK_END, 2.0);
  garbage.push(railGeo);
  const railMat = surface({ color: SURFACE.rail.clone(), haze: 0.06 });
  // 钢轨侧面是垂直面，几乎收不到顶光；用一点点自发光补出可见的金属感
  (railMat as MeshLambertMaterial).emissive = new Color(0.14, 0.15, 0.16);
  for (const side of [-1, 1] as const) {
    const rail = new Mesh(railGeo, railMat);
    rail.position.set((side * RAIL_GAUGE) / 2, 0.79, 0);
    scene.add(rail);
  }
  // 轨面高光条（模拟磨光的轨顶反光）
  const sheenGeo = new PlaneGeometry(0.045, TRACK_START - TRACK_END);
  sheenGeo.rotateX(-Math.PI / 2);
  garbage.push(sheenGeo);
  const sheenMat = surface({
    color: new Color(0.5, 0.53, 0.56),
    haze: 0,
    unlit: true,
    transparent: true,
    opacity: 0.42,
  });
  for (const side of [-1, 1] as const) {
    const sheen = new Mesh(sheenGeo, sheenMat);
    sheen.position.set((side * RAIL_GAUGE) / 2, 0.792 + 0.176 + 0.002, (TRACK_START + TRACK_END) / 2);
    scene.add(sheen);
  }

  // 接触网
  const mastGeo = new BoxGeometry(0.22, 8.6, 0.22);
  const armGeo = new BoxGeometry(3.4, 0.1, 0.1);
  garbage.push(mastGeo, armGeo);
  const mastMat = surface({ color: SURFACE.mast.clone(), haze: 0.12 });
  const mastCount = 35;
  const masts = new InstancedMesh(mastGeo, mastMat, mastCount);
  const arms = new InstancedMesh(armGeo, mastMat, mastCount);
  for (let i = 0; i < mastCount; i++) {
    const z = 30 - i * 44;
    dummy.position.set(4.35, 4.92, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    masts.setMatrixAt(i, dummy.matrix);
    dummy.position.set(2.7, 8.55, z);
    dummy.updateMatrix();
    arms.setMatrixAt(i, dummy.matrix);
  }
  masts.instanceMatrix.needsUpdate = true;
  arms.instanceMatrix.needsUpdate = true;
  scene.add(masts, arms);

  // 接触线 + 吊弦
  const wirePositions: number[] = [];
  for (const h of [6.5, 7.45]) {
    for (let z = 30; z > TRACK_END; z -= 8) {
      const sag = Math.cos((z / 44) * Math.PI) * 0.12;
      wirePositions.push(-0.02, h + sag, z, 0.02, h + sag, z);
    }
  }
  for (let z = 30; z > TRACK_END; z -= 16) {
    wirePositions.push(0, 7.45, z, 0, 6.5, z);
  }
  const wireGeo = new BufferGeometry();
  wireGeo.setAttribute('position', new Float32BufferAttribute(wirePositions, 3));
  garbage.push(wireGeo);
  const wireMaterial = new LineBasicMaterial({ color: SURFACE.wire.clone(), transparent: true, opacity: 0.9 });
  binder.bind(wireMaterial, SURFACE.wire, 0.08);
  garbage.push(wireMaterial);
  scene.add(new LineSegments(wireGeo, wireMaterial));

  // 信号机
  const boxGeo = new BoxGeometry(0.4, 0.9, 0.26);
  garbage.push(boxGeo);
  const boxMat = surface({ color: SURFACE.signalBox.clone(), haze: 0.08 });
  const lampCount = 5;
  const lampBodies = new InstancedMesh(boxGeo, boxMat, lampCount * 2);
  const lensGeo = new BoxGeometry(0.26, 0.18, 0.06);
  garbage.push(lensGeo);
  const lensMat = new MeshBasicMaterial({ color: new Color(0.24, 0.95, 0.42), toneMapped: false });
  garbage.push(lensMat);
  const lenses = new InstancedMesh(lensGeo, lensMat, lampCount);
  for (let i = 0; i < lampCount; i++) {
    const z = -95 - i * 170;
    dummy.position.set(5.0, 3.2, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    lampBodies.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(5.0, 5.1, z);
    dummy.updateMatrix();
    lampBodies.setMatrixAt(i * 2 + 1, dummy.matrix);
    dummy.position.set(4.86, 5.12, z);
    dummy.updateMatrix();
    lenses.setMatrixAt(i, dummy.matrix);
  }
  lampBodies.instanceMatrix.needsUpdate = true;
  lenses.instanceMatrix.needsUpdate = true;
  scene.add(lampBodies, lenses);

  // 道旁灌木（闭合低面数球体，双面受光）
  const shrubGeo = new SphereGeometry(1, 6, 4);
  garbage.push(shrubGeo);
  const shrubMat = surface({ color: SURFACE.shrub.clone(), haze: 0.16 });
  const shrubCount = 300;
  const shrubs = new InstancedMesh(shrubGeo, shrubMat, shrubCount);
  for (let i = 0; i < shrubCount; i++) {
    const side = rand() > 0.5 ? 1 : -1;
    const z = 40 - rand() * 620;
    dummy.position.set(side * (7.4 + rand() * 6), 0.32, z);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    const s = 0.55 + rand() * 0.75;
    dummy.scale.set(s * 1.15, s * 0.72, s * 1.15);
    dummy.updateMatrix();
    shrubs.setMatrixAt(i, dummy.matrix);
  }
  shrubs.instanceMatrix.needsUpdate = true;
  scene.add(shrubs);

  return {
    id: 'near',
    scene,
    lights,
    applyLook: (look, palette) => {
      binder.apply(look);
      lights.apply(palette, look.night);
    },
    dispose: () => {
      for (const d of garbage) d.dispose();
      lights.dispose();
      binder.dispose();
    },
  };
}

/* ---------------------------------------------------------------------------
 * 中景：丘陵、林带、村庄、水面、电杆
 * ------------------------------------------------------------------------- */

function midLayer(): BuiltLayer {
  const { scene, lights, binder, garbage, surface } = createBuilder('MidLayer');
  const rand = mulberry32(2207);
  const textures = getTextures();
  const dummy = new Object3D();

  // 中景地面：足够大且带轻微起伏，避免出现一条生硬的水平线
  const GROUND_SIZE = 13000;
  const groundGeo = new PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 96, 96);
  groundGeo.rotateX(-Math.PI / 2);
  {
    const pos = groundGeo.attributes.position as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      // 近轨区域保持平整，远处逐渐起伏
      const falloff = Math.min(1, Math.max(0, (r - 220) / 900));
      const h = (fbm2D(x * 0.0016, z * 0.0016, 4, 5) - 0.5) * 130 * falloff;
      pos.setY(i, h);
    }
    pos.needsUpdate = true;
    groundGeo.computeVertexNormals();
  }
  const groundTex = textures.ground.clone();
  groundTex.repeat.set(420, 420);
  groundTex.needsUpdate = true;
  garbage.push(groundGeo, groundTex);
  const ground = new Mesh(groundGeo, surface({ color: SURFACE.ground.clone(), map: groundTex, haze: 0.28 }));
  ground.position.set(0, -1.2, 0);
  scene.add(ground);

  // 丘陵
  const hillGeo = new SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  garbage.push(hillGeo);
  const hillCount = 54;
  const hills = new InstancedMesh(hillGeo, surface({ color: SURFACE.hill.clone(), haze: 0.44 }), hillCount);
  for (let i = 0; i < hillCount; i++) {
    // 分三档半径，远近叠置形成景深
    const ring = i % 3;
    const angle = (rand() * 2 - 1) * 1.42;
    const radius = ring === 0 ? 700 + rand() * 700 : ring === 1 ? 1500 + rand() * 900 : 2500 + rand() * 1200;
    dummy.position.set(Math.sin(angle) * radius, -8, -Math.cos(angle) * radius);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    // 扁而宽的低丘陵，避免形成「一堵绿墙」
    const k = 1 + ring * 0.55;
    dummy.scale.set((200 + rand() * 320) * k, (24 + rand() * 46) * k, (180 + rand() * 260) * k);
    dummy.updateMatrix();
    hills.setMatrixAt(i, dummy.matrix);
  }
  hills.instanceMatrix.needsUpdate = true;
  scene.add(hills);

  // 林带
  const canopyGeo = new CylinderGeometry(0, 1, 1, 7, 1);
  canopyGeo.translate(0, 0.5, 0);
  const trunkGeo = new CylinderGeometry(0.12, 0.16, 1, 5);
  garbage.push(canopyGeo, trunkGeo);
  const treeMat = surface({ color: SURFACE.canopy.clone(), haze: 0.4 });
  const trunkMat = surface({ color: SURFACE.trunk.clone(), haze: 0.4 });
  const treeCount = 360;
  const canopies = new InstancedMesh(canopyGeo, treeMat, treeCount);
  const trunks = new InstancedMesh(trunkGeo, trunkMat, treeCount);
  for (let i = 0; i < treeCount; i++) {
    const angle = (rand() * 2 - 1) * 1.2;
    const radius = 190 + rand() * 950;
    const x = Math.sin(angle) * radius;
    const z = -Math.cos(angle) * radius;
    const s = 4 + rand() * 7.5;
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    dummy.scale.set(s * 0.32, s, s * 0.32);
    dummy.updateMatrix();
    canopies.setMatrixAt(i, dummy.matrix);
    dummy.scale.set(1, s * 0.5, 1);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
  }
  canopies.instanceMatrix.needsUpdate = true;
  trunks.instanceMatrix.needsUpdate = true;
  scene.add(canopies, trunks);

  // 村庄
  const wallGeo = new BoxGeometry(1, 1, 1);
  const roofGeo = new CylinderGeometry(0.72, 0.72, 1, 3, 1);
  roofGeo.rotateY(Math.PI / 6);
  garbage.push(wallGeo, roofGeo);
  const wallMat = surface({ color: SURFACE.wall.clone(), haze: 0.38 });
  const roofMat = surface({ color: SURFACE.roof.clone(), haze: 0.38 });
  const clusterCount = 8;
  const perCluster = 9;
  const totalHouses = clusterCount * perCluster;
  const walls = new InstancedMesh(wallGeo, wallMat, totalHouses);
  const roofs = new InstancedMesh(roofGeo, roofMat, totalHouses);
  let hi = 0;
  for (let c = 0; c < clusterCount; c++) {
    const angle = (rand() * 2 - 1) * 0.95;
    const radius = 190 + rand() * 460;
    const cx = Math.sin(angle) * radius;
    const cz = -Math.cos(angle) * radius;
    for (let i = 0; i < perCluster; i++) {
      const w = 6 + rand() * 9;
      const d = 5 + rand() * 7;
      const h = 4 + rand() * 4.5;
      const x = cx + (rand() * 2 - 1) * 40;
      const z = cz + (rand() * 2 - 1) * 40;
      dummy.position.set(x, h / 2, z);
      dummy.rotation.set(0, rand() * Math.PI, 0);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      walls.setMatrixAt(hi, dummy.matrix);
      dummy.position.set(x, h + 0.1, z);
      dummy.scale.set(w * 0.82, h * 0.52, d * 0.82);
      dummy.updateMatrix();
      roofs.setMatrixAt(hi, dummy.matrix);
      hi++;
    }
  }
  walls.instanceMatrix.needsUpdate = true;
  roofs.instanceMatrix.needsUpdate = true;
  scene.add(walls, roofs);

  // 远处水面：只保留一条细窄的反光带，避免遮挡地形
  const waterGeo = new PlaneGeometry(900, 260);
  waterGeo.rotateX(-Math.PI / 2);
  garbage.push(waterGeo);
  const waterMat = surface({
    color: new Color(0.42, 0.56, 0.68),
    haze: 0.4,
    unlit: true,
    transparent: true,
    opacity: 0.5,
    tint: true,
  });
  const water = new Mesh(waterGeo, waterMat);
  water.position.set(-260, 0.05, -1450);
  water.rotation.y = 0.06;
  scene.add(water);

  // 电线杆
  const poleGeo = new CylinderGeometry(0.16, 0.24, 7.4, 5);
  garbage.push(poleGeo);
  const poleCount = 26;
  const poles = new InstancedMesh(poleGeo, surface({ color: SURFACE.pole.clone(), haze: 0.36 }), poleCount);
  for (let i = 0; i < poleCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    dummy.position.set(side * (17 + rand() * 5), 3.7, -120 - i * 46);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    poles.setMatrixAt(i, dummy.matrix);
  }
  poles.instanceMatrix.needsUpdate = true;
  scene.add(poles);

  return {
    id: 'mid',
    scene,
    lights,
    applyLook: (look, palette) => {
      binder.apply(look);
      lights.apply(palette, look.night);
    },
    dispose: () => {
      for (const d of garbage) d.dispose();
      lights.dispose();
      binder.dispose();
    },
  };
}

/* ---------------------------------------------------------------------------
 * 远景：多层山脊、云海、地平线
 * ------------------------------------------------------------------------- */

function farLayer(): BuiltLayer {
  const { scene, lights, binder, garbage } = createBuilder('FarLayer');
  // 远景是剪影式画面，不需要额外补光
  lights.sun.intensity = 1.0;
  const textures = getTextures();

  const specs = [
    { radius: 8600, height: 1900, arc: 1.55, seed: 3, freq: 3.4, jitter: 320, haze: 0.3, snow: 0.75 },
    { radius: 5800, height: 1250, arc: 1.46, seed: 9, freq: 4.2, jitter: 230, haze: 0.2, snow: 0.56 },
    { radius: 3700, height: 780, arc: 1.36, seed: 17, freq: 5.0, jitter: 170, haze: 0.12, snow: 0.38 },
  ];

  const rebuildBands: Array<(look: LayerLook) => void> = [];
  for (const spec of specs) {
    const makeGeometry = (look: LayerLook): BufferGeometry => {
      const apply = (base: Color, haze: number): Color => {
        const c = base.clone().lerp(look.nightColor, look.night);
        c.setRGB(c.r * look.tint[0], c.g * look.tint[1], c.b * look.tint[2]);
        return c.lerp(look.fogColor, Math.min(0.45, haze * 0.4));
      };
      return buildBandGeometry({
        radius: spec.radius,
        baseY: -60,
        height: spec.height,
        arc: spec.arc,
        segments: 200,
        seed: spec.seed,
        frequency: spec.freq,
        contrast: 0.74,
        jitter: spec.jitter,
        colorBottom: apply(new Color(0.16, 0.2, 0.26), spec.haze),
        colorTop: apply(new Color(0.3, 0.35, 0.42), spec.haze * 1.05),
        snow: spec.snow,
        colorSnow: apply(new Color(0.86, 0.9, 0.96), spec.haze * 0.8),
      });
    };

    let geometry = makeGeometry({
      night: 0,
      nightColor: new Color(0, 0, 0),
      tint: [1, 1, 1],
      haze: 0,
      fogColor: new Color(0, 0, 0),
    });
    const material = new MeshBasicMaterial({ vertexColors: true });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    garbage.push(material);

    rebuildBands.push((look) => {
      const next = makeGeometry(look);
      geometry.dispose();
      geometry = next;
      mesh.geometry = next;
    });
  }

  // 山脊之间的低平云层：水平环形薄片（不是竖直墙），只贴在山脚高度
  for (const band of [
    { y: 230, inner: 2400, outer: 14000, opacity: 0.4 },
    { y: 120, inner: 1400, outer: 9000, opacity: 0.28 },
  ]) {
    const ringGeo = new RingGeometry(band.inner, band.outer, 64, 1);
    ringGeo.rotateX(-Math.PI / 2);
    const ringTex = textures.clouds.clone();
    ringTex.repeat.set(9, 9);
    ringTex.needsUpdate = true;
    const ringMat = new MeshBasicMaterial({
      map: ringTex,
      color: new Color(0.93, 0.96, 0.99),
      transparent: true,
      opacity: band.opacity,
      depthWrite: false,
      side: 2,
    });
    binder.bind(ringMat, new Color(0.93, 0.96, 0.99), 0.14, false);
    garbage.push(ringGeo, ringTex, ringMat);
    const ring = new Mesh(ringGeo, ringMat);
    ring.position.set(0, band.y, 0);
    ring.renderOrder = -5;
    scene.add(ring);
  }

  return {
    id: 'far',
    scene,
    lights,
    applyLook: (look, palette) => {
      binder.apply(look);
      for (const fn of rebuildBands) fn(look);
      lights.apply(palette, look.night);
    },
    dispose: () => {
      for (const d of garbage) d.dispose();
      lights.dispose();
      binder.dispose();
    },
  };
}

export function buildLayer(id: LayerId): BuiltLayer {
  switch (id) {
    case 'near':
      return nearLayer();
    case 'mid':
      return midLayer();
    case 'far':
      return farLayer();
  }
}
