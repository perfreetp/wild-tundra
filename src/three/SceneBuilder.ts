import * as THREE from 'three';
import type { SceneObject } from '../types';
import {
  LIGHTING_PRESETS,
  ROAD_LENGTH,
  ROAD_WIDTH,
  TUNNEL_ENTRY_Z,
  TUNNEL_EXIT_Z,
  type LightingPreset,
} from '../presets';

/** 场景资源集合，引擎每帧/切换预设时访问 */
export interface SceneRefs {
  scene: THREE.Scene;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  /** 隧道内灯条与路灯的点光源（强度随预设变化） */
  artificialLights: THREE.PointLight[];
  /** 自发光材质（车灯/路灯/隧道灯条），bloom 由其亮度触发 */
  emissiveMaterials: THREE.MeshStandardMaterial[];
  /** 动态对象根节点，按 id 索引 */
  objectRoots: Map<string, THREE.Group>;
  /** 车辆的前照灯（夜间可见光束） */
  vehicleHeadlights: Map<string, THREE.SpotLight[]>;
  tunnelGroup: THREE.Group;
  dispose: () => void;
}

const disposables: { dispose: () => void }[] = [];
function track<T extends { dispose: () => void }>(res: T): T {
  disposables.push(res);
  return res;
}

function makeAsphaltTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  // 基色取中灰，整体明暗交给灯光控制，避免夜间低照度下死黑
  ctx.fillStyle = '#8a8d90';
  ctx.fillRect(0, 0, 256, 256);
  // 颗粒噪点
  for (let i = 0; i < 9000; i++) {
    const g = 90 + Math.random() * 90;
    ctx.fillStyle = `rgba(${g},${g},${g},${0.2 + Math.random() * 0.25})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 80);
  tex.colorSpace = THREE.SRGBColorSpace;
  return track(tex);
}

export function buildScene(initialObjects: SceneObject[]): SceneRefs {
  const scene = new THREE.Scene();
  const preset = LIGHTING_PRESETS.day;

  // ---------- 灯光 ----------
  const hemi = new THREE.HemisphereLight(
    preset.skyColor,
    preset.groundColor,
    preset.hemiIntensity,
  );
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(preset.sunColor, preset.sunIntensity);
  sun.position.set(...preset.sunPosition);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 320;
  const s = 90;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  const artificialLights: THREE.PointLight[] = [];
  const emissiveMaterials: THREE.MeshStandardMaterial[] = [];
  const vehicleHeadlights = new Map<string, THREE.SpotLight[]>();

  // ---------- 地面与道路 ----------
  const groundMat = track(
    new THREE.MeshStandardMaterial({ color: 0x4d5b3e, roughness: 1 }),
  );
  const ground = new THREE.Mesh(
    track(new THREE.PlaneGeometry(900, 900)),
    groundMat,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMat = track(
    new THREE.MeshStandardMaterial({
      map: makeAsphaltTexture(),
      color: 0xbfc4c8, // 提亮基色，保证夜间低照度下仍有路面层次
      roughness: 0.92,
      metalness: 0.0,
    }),
  );
  const road = new THREE.Mesh(
    track(new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH)),
    roadMat,
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, -ROAD_LENGTH / 2 + 20);
  road.receiveShadow = true;
  scene.add(road);

  // 道路边缘实线
  const edgeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xe8e8e0,
      roughness: 0.6,
      emissive: 0x222222,
    }),
  );
  for (const x of [-ROAD_WIDTH / 2 + 0.4, ROAD_WIDTH / 2 - 0.4]) {
    const edge = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.18, ROAD_LENGTH)),
      edgeMat,
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0.015, -ROAD_LENGTH / 2 + 20);
    scene.add(edge);
  }

  // ---------- 隧道 ----------
  const tunnelGroup = buildTunnel(artificialLights, emissiveMaterials);
  scene.add(tunnelGroup);

  // ---------- 路灯 ----------
  buildStreetLights(artificialLights, emissiveMaterials, scene);

  // ---------- 动态对象 ----------
  const objectRoots = new Map<string, THREE.Group>();
  for (const obj of initialObjects) {
    const root = createObjectRoot(obj, vehicleHeadlights, emissiveMaterials);
    objectRoots.set(obj.id, root);
    scene.add(root);
  }

  const refs: SceneRefs = {
    scene,
    hemi,
    sun,
    artificialLights,
    emissiveMaterials,
    objectRoots,
    vehicleHeadlights,
    tunnelGroup,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      disposables.length = 0;
    },
  };
  applyLightingPreset(refs, LIGHTING_PRESETS.day);
  return refs;
}

function buildTunnel(
  lights: THREE.PointLight[],
  emissiveMats: THREE.MeshStandardMaterial[],
): THREE.Group {
  const group = new THREE.Group();
  const length = TUNNEL_ENTRY_Z - TUNNEL_EXIT_Z;
  const centerZ = (TUNNEL_ENTRY_Z + TUNNEL_EXIT_Z) / 2;
  const halfW = ROAD_WIDTH / 2 + 1.2;
  const height = 6.2;

  const concrete = track(
    new THREE.MeshStandardMaterial({
      color: 0x9aa0a6,
      roughness: 0.95,
    }),
  );

  // 顶板（遮住阳光，形成隧道内暗区）
  const ceiling = new THREE.Mesh(
    track(new THREE.BoxGeometry(halfW * 2 + 0.6, 0.5, length)),
    concrete,
  );
  ceiling.position.set(0, height, centerZ);
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // 两侧墙
  for (const x of [-halfW, halfW]) {
    const wall = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.5, height, length)),
      concrete,
    );
    wall.position.set(x, height / 2, centerZ);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  }

  // 出入口门架（视觉提示）
  for (const z of [TUNNEL_ENTRY_Z, TUNNEL_EXIT_Z]) {
    const portal = new THREE.Mesh(
      track(new THREE.BoxGeometry(halfW * 2 + 1.2, 0.8, 1.2)),
      concrete,
    );
    portal.position.set(0, height + 0.3, z);
    group.add(portal);
  }

  // 顶部灯条（自发光 + 点光源）
  const lampMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff2d8,
      emissiveIntensity: 2.2,
      roughness: 0.4,
    }),
  );
  emissiveMats.push(lampMat);
  const lampCount = 6;
  for (let i = 0; i < lampCount; i++) {
    const z = TUNNEL_ENTRY_Z - (length / (lampCount + 1)) * (i + 1);
    const strip = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.6, 0.12, 2.4)),
      lampMat,
    );
    strip.position.set(0, height - 0.35, z);
    group.add(strip);

    const pl = new THREE.PointLight(0xfff2d8, 14, 26, 1.8);
    pl.position.set(0, height - 0.8, z);
    lights.push(pl);
    group.add(pl);
  }
  return group;
}

function buildStreetLights(
  lights: THREE.PointLight[],
  emissiveMats: THREE.MeshStandardMaterial[],
  scene: THREE.Scene,
) {
  const poleMat = track(
    new THREE.MeshStandardMaterial({ color: 0x555a5f, roughness: 0.7 }),
  );
  const bulbMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff0c8,
      emissive: 0xffe6a8,
      emissiveIntensity: 6.0,
    }),
  );
  emissiveMats.push(bulbMat);

  const zs = [10, -20, -50, -150, -180, -210, -240, -270, -300, -330];
  for (const z of zs) {
    for (const side of [-1, 1]) {
      const x = side * (ROAD_WIDTH / 2 + 1.4);
      const pole = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.09, 0.12, 6, 8)),
        poleMat,
      );
      pole.position.set(x, 3, z);
      pole.castShadow = true;
      scene.add(pole);

      const arm = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8)),
        poleMat,
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(x - side * 0.65, 5.95, z);
      scene.add(arm);

      const bulb = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.18, 12, 8)),
        bulbMat,
      );
      bulb.position.set(x - side * 1.25, 5.85, z);
      scene.add(bulb);

      // 每盏路灯都配点光源（数量经预算：约 10 盏 + 隧道灯 + 车灯）
      const pl = new THREE.PointLight(0xffe6a8, 12, 26, 1.9);
      pl.position.copy(bulb.position);
      lights.push(pl);
      scene.add(pl);
    }
  }
}

/** 根据场景数据创建/更新对象根节点 */
export function createObjectRoot(
  obj: SceneObject,
  vehicleHeadlights: Map<string, THREE.SpotLight[]>,
  emissiveMats: THREE.MeshStandardMaterial[],
): THREE.Group {
  const root = new THREE.Group();
  root.name = obj.id;
  if (obj.type === 'vehicle') {
    buildVehicle(obj, root, vehicleHeadlights, emissiveMats);
  } else {
    buildLaneMarking(obj, root);
  }
  root.position.set(...obj.position);
  root.rotation.y = obj.rotationY;
  return root;
}

function buildVehicle(
  obj: SceneObject,
  root: THREE.Group,
  vehicleHeadlights: Map<string, THREE.SpotLight[]>,
  emissiveMats: THREE.MeshStandardMaterial[],
) {
  const bodyMat = track(
    new THREE.MeshStandardMaterial({
      color: obj.color ?? 0xcccccc,
      roughness: 0.35,
      metalness: 0.55,
    }),
  );
  const glassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x16202b,
      roughness: 0.15,
      metalness: 0.3,
    }),
  );

  // 车身（车头朝 -Z）
  const body = new THREE.Mesh(track(new THREE.BoxGeometry(1.8, 0.55, 4.2)), bodyMat);
  body.position.y = 0.62;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  const cabin = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.6, 0.55, 2.0)),
    glassMat,
  );
  cabin.position.set(0, 1.12, 0.25);
  cabin.castShadow = true;
  root.add(cabin);

  // 车轮
  const wheelMat = track(
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }),
  );
  const wheelGeo = track(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 14));
  for (const [wx, wz] of [
    [-0.85, -1.35],
    [0.85, -1.35],
    [-0.85, 1.35],
    [0.85, 1.35],
  ]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.34, wz);
    root.add(wheel);
  }

  // 前大灯（自发光 + 聚光）
  const headMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff8e0,
      emissiveIntensity: 6.5,
    }),
  );
  emissiveMats.push(headMat);
  const spots: THREE.SpotLight[] = [];
  for (const hx of [-0.55, 0.55]) {
    const head = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.36, 0.16, 0.08)),
      headMat,
    );
    head.position.set(hx, 0.7, -2.12);
    root.add(head);

    const spot = new THREE.SpotLight(
      0xfff3d0,
      60,
      55,
      Math.PI / 8,
      0.5,
      1.4,
    );
    spot.position.set(hx, 0.75, -2.1);
    // target 作为车辆子节点，旋转车辆时光束正确跟随车头方向
    const target = new THREE.Object3D();
    target.position.set(hx, 0.1, -18);
    spot.target = target;
    root.add(spot);
    root.add(target);
    spots.push(spot);

    // 可见光束锥体（半透明加色混合，夜间呈现大灯光柱）
    const beamMat = track(
      new THREE.MeshBasicMaterial({
        color: 0xfff2cc,
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const beam = new THREE.Mesh(
      track(new THREE.ConeGeometry(2.6, 14, 16, 1, true)),
      beamMat,
    );
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(hx, 0.6, -9);
    root.add(beam);
  }
  vehicleHeadlights.set(obj.id, spots);

  // 尾灯
  const tailMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x550000,
      emissive: 0xff1a1a,
      emissiveIntensity: 2.6,
    }),
  );
  emissiveMats.push(tailMat);
  for (const tx of [-0.6, 0.6]) {
    const tail = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.34, 0.14, 0.08)),
      tailMat,
    );
    tail.position.set(tx, 0.72, 2.12);
    root.add(tail);
  }
}

function buildLaneMarking(obj: SceneObject, root: THREE.Group) {
  const len = obj.length ?? 60;
  const width = obj.width ?? 0.15;
  const mat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf2f2ea,
      roughness: 0.55,
      emissive: 0x1a1a1a,
    }),
  );
  // 虚线：每 4m 一段，间隔 2m
  const dash = 2.4;
  const gap = 1.8;
  const count = Math.max(1, Math.floor(len / (dash + gap)));
  const geo = track(new THREE.PlaneGeometry(width, dash));
  for (let i = 0; i < count; i++) {
    const seg = new THREE.Mesh(geo, mat);
    seg.rotation.x = -Math.PI / 2;
    const offset = -len / 2 + dash / 2 + i * (dash + gap);
    seg.position.set(0, 0.02, offset);
    root.add(seg);
  }
}

/** 切换白天/黄昏/夜间光照预设 */
export function applyLightingPreset(refs: SceneRefs, p: LightingPreset) {
  const { scene, hemi, sun } = refs;
  // three 的 ColorManagement 默认开启：THREE.Color(hex) 已将 sRGB 转线性存储，
  // 渲染输出时由 renderer 统一转回 sRGB，这里不能再手动 convertSRGBToLinear
  scene.background = p.skyColor.clone();
  if (scene.fog instanceof THREE.FogExp2) {
    scene.fog.color.copy(p.fogColor);
    scene.fog.density = p.fogDensity;
  } else {
    scene.fog = new THREE.FogExp2(p.fogColor.clone(), p.fogDensity);
  }

  hemi.color.copy(p.skyColor);
  hemi.groundColor.copy(p.groundColor);
  hemi.intensity = p.hemiIntensity;

  sun.color.copy(p.sunColor);
  sun.intensity = p.sunIntensity;
  sun.position.set(...p.sunPosition);

  // 人工光源：白天几乎不可见，夜间全开（强度变化即 bloom 触发依据）
  for (const light of refs.artificialLights) {
    light.intensity = light.userData.base ?? light.intensity;
    if (!light.userData.base) light.userData.base = light.intensity;
    light.intensity = light.userData.base * p.artificialLightScale;
  }
  for (const mat of refs.emissiveMaterials) {
    const base = mat.userData.baseEmissive ?? mat.emissiveIntensity;
    if (!mat.userData.baseEmissive) mat.userData.baseEmissive = base;
    mat.emissiveIntensity = base * (0.25 + p.artificialLightScale);
  }
  for (const spots of refs.vehicleHeadlights.values()) {
    for (const sp of spots) {
      const base = sp.userData.base ?? sp.intensity;
      if (!sp.userData.base) sp.userData.base = base;
      sp.intensity = base * p.artificialLightScale;
    }
  }
}
