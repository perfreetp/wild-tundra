<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { store, totalLength } from '../store';
import { excavatedPart, type MeshData } from '../lib/manifold';

const container = ref<HTMLDivElement>();

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let rockMesh: THREE.Mesh;
let ghostMesh: THREE.Mesh;
let cutPlane: THREE.Mesh;
let profileLine: THREE.LineLoop;
let rafId = 0;
let resizeObserver: ResizeObserver | null = null;

function meshDataToGeometry(data: MeshData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  geo.dispose();
  return flat;
}

function profileBBox(): { w: number; h: number; cx: number; cy: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of store.profile) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/** 剖切平面姿态:法向 = Rz(cutAngle)·Ry(tilt)·ẑ,过点 (0,0,d) */
function planeQuaternion(): THREE.Quaternion {
  const q = new THREE.Quaternion();
  const ry = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    THREE.MathUtils.degToRad(store.tiltAngle),
  );
  const rz = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    THREE.MathUtils.degToRad(store.cutAngle),
  );
  q.copy(rz).multiply(ry);
  return q;
}

function rebuildProfileLine(): void {
  const pts = store.profile.map(([x, y]) => new THREE.Vector3(x, y, 0));
  profileLine.geometry.dispose();
  profileLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
}

function updateScene(): void {
  const step = store.steps[store.currentStep];
  if (!step) return;

  // 剩余岩体
  const oldGeo = rockMesh.geometry;
  rockMesh.geometry = meshDataToGeometry(step.mesh);
  oldGeo.dispose();

  // 已开挖部分(幽灵)
  if (store.showGhost && store.currentStep > 0) {
    const ghost = excavatedPart(
      store.profile.map((p) => [...p] as [number, number]),
      totalLength(),
      store.currentStep,
      store.stepLength,
      store.cutAngle,
      store.tiltAngle,
    );
    if (ghost) {
      const g = ghostMesh.geometry;
      ghostMesh.geometry = meshDataToGeometry(ghost);
      g.dispose();
      ghostMesh.visible = true;
    }
  } else {
    ghostMesh.visible = false;
  }

  // 剖切平面
  const d = store.currentStep * store.stepLength;
  const { w, h, cx, cy } = profileBBox();
  const size = Math.max(w, h) * 1.6;
  cutPlane.geometry.dispose();
  cutPlane.geometry = new THREE.PlaneGeometry(size, size);
  cutPlane.position.set(cx, cy, d);
  cutPlane.quaternion.copy(planeQuaternion());
  cutPlane.visible = store.currentStep > 0 && store.currentStep <= store.totalSteps;

  // 断面高亮线框(位于当前掌子面里程处)
  profileLine.position.set(0, 0, d);
}

function frameCamera(): void {
  const L = totalLength();
  const { w, h, cy } = profileBBox();
  const r = Math.max(w, h, L) * 0.9;
  camera.position.set(r * 0.9, cy + r * 0.6, L / 2 + r);
  controls.target.set(0, cy, L / 2);
  controls.update();
}

onMounted(() => {
  const el = container.value!;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14181f);
  scene.fog = new THREE.Fog(0x14181f, 120, 400);

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);

  // 轨道环绕 + 自由旋转
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const dir = new THREE.DirectionalLight(0xffffff, 1.4);
  dir.position.set(40, 80, 30);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0x88aaff, 0.5);
  dir2.position.set(-30, 20, -40);
  scene.add(dir2);

  // 剩余岩体
  rockMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshStandardMaterial({
      color: 0x9a7b4f,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  scene.add(rockMesh);

  // 已开挖幽灵
  ghostMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshStandardMaterial({
      color: 0x4da3ff,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  scene.add(ghostMesh);

  // 剖切平面(半透明)
  cutPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: 0xf5a623,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  scene.add(cutPlane);

  // 断面高亮线框
  profileLine = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffe14d }),
  );
  scene.add(profileLine);

  // 中心线
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -5),
    new THREE.Vector3(0, 0, 200),
  ]);
  scene.add(
    new THREE.Line(
      axisGeo,
      new THREE.LineDashedMaterial({ color: 0x4da3ff, dashSize: 1, gapSize: 0.8 }),
    ),
  );

  const grid = new THREE.GridHelper(200, 40, 0x2c3542, 0x222a36);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.5;
  scene.add(grid);

  rebuildProfileLine();
  frameCamera();
  updateScene();

  resizeObserver = new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: hh } = el;
    renderer.setSize(w, hh);
    camera.aspect = w / hh;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(el);

  const loop = () => {
    rafId = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  };
  loop();
});

watch(
  () => [store.steps, store.currentStep, store.showGhost, store.cutAngle, store.tiltAngle],
  () => updateScene(),
  { deep: true },
);
watch(
  () => [store.profile, store.stepLength, store.totalSteps],
  () => {
    rebuildProfileLine();
    frameCamera();
    updateScene();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  controls.dispose();
  renderer.dispose();
  renderer.domElement.remove();
});
</script>

<template>
  <div ref="container" class="viewport-wrap">
    <div class="hud">
      <div>步序 <b>{{ store.currentStep }}</b> / {{ store.totalSteps }}</div>
      <div>剩余体积 <b>{{ (store.steps[store.currentStep]?.volume ?? 0).toFixed(1) }}</b> m³</div>
      <div>剩余比例 <b>{{ store.initialVolume ? ((store.steps[store.currentStep]?.volume ?? 0) / store.initialVolume * 100).toFixed(1) : 0 }}</b> %</div>
      <div v-if="!store.manifoldReady">正在加载 manifold-3d…</div>
    </div>
  </div>
</template>
