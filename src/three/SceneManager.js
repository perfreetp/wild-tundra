// three.js 场景管理：渲染循环、实体同步、选择、TransformControls、拖拽布尔
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { manifoldToGeometry } from '../kernel/bridge.js';
import { useStore } from '../state/store.js';

const COLORS = {
  ball: 0x4f8cff,
  tube: 0x37c8a0,
  block: 0xffa845,
  operation: 0xb07bff,
  muted: 0x5a6270,
  selected: 0xffe45c,
  hover: 0x9fd8ff,
  interference: 0xff3b6b,
};

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.meshMap = new Map(); // nodeId -> THREE.Mesh
    this.interferenceMesh = null;
    this.dragState = null;
    this.pendingPick = null;
    this.unsub = null;
    this.init();
  }

  init() {
    const el = this.container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x14181f);

    const w = el.clientWidth || 800;
    const h = el.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 5000);
    this.camera.position.set(260, 220, 320);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    el.appendChild(this.renderer.domElement);

    // 光照
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(300, 400, 200);
    key.castShadow = true;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.5);
    fill.position.set(-200, -100, -200);
    this.scene.add(fill);

    // 地面网格（10mm 一格，每 10 格一条主线）
    const grid = new THREE.GridHelper(1000, 100, 0x3a4456, 0x242b38);
    grid.material.transparent = true;
    grid.material.opacity = 0.6;
    this.scene.add(grid);
    this.grid = grid;

    // 坐标轴
    this.scene.add(new THREE.AxesHelper(120));

    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.12;

    this.transform = new TransformControls(this.camera, this.renderer.domElement);
    this.transform.addEventListener('dragging-changed', (e) => {
      this.orbit.enabled = !e.value;
      if (!e.value) this.commitTransform();
    });
    this.transform.addEventListener('objectChange', () => {
      // 拖动过程中实时更新坐标读数（不触发重算，松手才重算）
      const id = this.transform.object?.userData.nodeId;
      if (id) this.onTransformPreview?.(id, this.readObjectTransform(this.transform.object));
    });
    this.scene.add(this.transform.getHelper ? this.transform.getHelper() : this.transform);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.bindPointer();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(el);

    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  // ---------- 实体同步 ----------
  syncFromState(state) {
    const { tree, geometryResults, selectedIds } = state;
    const liveIds = new Set();

    for (const [id, node] of Object.entries(tree.nodes)) {
      liveIds.add(id);
      const result = geometryResults[id];
      let mesh = this.meshMap.get(id);
      if (!result || !result.manifold || result.manifold.isEmpty()) {
        if (mesh) {
          this.scene.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
          this.meshMap.delete(id);
        }
        continue;
      }
      if (!mesh) {
        mesh = new THREE.Mesh();
        mesh.userData.nodeId = id;
        this.scene.add(mesh);
        this.meshMap.set(id, mesh);
      }
      // 版本变化或首次：重建几何
      if (mesh.userData.version !== result.version) {
        const old = mesh.geometry;
        mesh.geometry = manifoldToGeometry(result.manifold);
        old?.dispose();
        mesh.userData.version = result.version;
      }
      // 材质/外观
      const color = node.kind === 'operation' ? COLORS.operation : COLORS[node.type] ?? 0x88aadd;
      const isSelected = selectedIds.includes(id);
      if (!mesh.material || mesh.material.color.getHex() !== (isSelected ? COLORS.selected : node.muted ? COLORS.muted : color)) {
        mesh.material?.dispose();
        mesh.material = new THREE.MeshStandardMaterial({
          color: isSelected ? COLORS.selected : node.muted ? COLORS.muted : color,
          metalness: 0.35,
          roughness: 0.45,
          transparent: node.muted,
          opacity: node.muted ? 0.35 : 1,
          flatShading: false,
        });
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    // 移除已删除节点
    for (const [id, mesh] of this.meshMap) {
      if (!liveIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.meshMap.delete(id);
      }
    }

    this.syncTransformGizmo(selectedIds);
  }

  syncTransformGizmo(selectedIds) {
    const store = useStore.getState();
    if (store.dragBooleanMode || selectedIds.length !== 1) {
      this.transform.detach();
      return;
    }
    const mesh = this.meshMap.get(selectedIds[0]);
    if (mesh && this.transform.object !== mesh) {
      this.transform.attach(mesh);
      const node = store.tree.nodes[selectedIds[0]];
      this.writeObjectTransform(mesh, node.transform);
    }
  }

  readObjectTransform(obj) {
    return {
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [
        THREE.MathUtils.radToDeg(obj.rotation.x),
        THREE.MathUtils.radToDeg(obj.rotation.y),
        THREE.MathUtils.radToDeg(obj.rotation.z),
      ],
    };
  }

  writeObjectTransform(obj, transform) {
    obj.position.set(...transform.position);
    obj.rotation.set(
      THREE.MathUtils.degToRad(transform.rotation[0] || 0),
      THREE.MathUtils.degToRad(transform.rotation[1] || 0),
      THREE.MathUtils.degToRad(transform.rotation[2] || 0)
    );
  }

  commitTransform() {
    const obj = this.transform.object;
    if (!obj) return;
    const id = obj.userData.nodeId;
    if (!id) return;
    useStore.getState().updateTransform(id, this.readObjectTransform(obj));
  }

  setTransformMode(mode) {
    this.transform.setMode(mode); // translate | rotate
  }

  // ---------- 指针交互：点击选择 + 拖拽布尔 ----------
  bindPointer() {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.pointerDown = { x: e.clientX, y: e.clientY, active: true };
    });
    dom.addEventListener('pointermove', (e) => {
      const pd = this.pointerDown;
      const store = useStore.getState();
      if (pd?.active && store.dragBooleanMode) {
        const dx = e.clientX - pd.x;
        const dy = e.clientY - pd.y;
        if (!this.dragState && Math.hypot(dx, dy) > 8) {
          const hit = this.pickAt(pd.x, pd.y);
          if (hit) {
            this.dragState = { sourceId: hit.object.userData.nodeId, x: e.clientX, y: e.clientY };
            this.orbit.enabled = false;
            this.onDragBooleanStart?.(this.dragState);
          }
        }
        if (this.dragState) {
          this.dragState.x = e.clientX;
          this.dragState.y = e.clientY;
          this.dragState.targetId = this.pickAt(e.clientX, e.clientY)?.object.userData.nodeId ?? null;
          this.onDragBooleanMove?.(this.dragState);
        }
      } else if (!pd?.active) {
        const hit = this.pickAt(e.clientX, e.clientY);
        dom.style.cursor = hit ? 'pointer' : 'default';
      }
    });
    dom.addEventListener('pointerup', (e) => {
      const pd = this.pointerDown;
      const store = useStore.getState();
      if (this.dragState) {
        const targetId = this.pickAt(e.clientX, e.clientY)?.object.userData.nodeId ?? null;
        const sourceId = this.dragState.sourceId;
        this.dragState = null;
        this.orbit.enabled = true;
        this.onDragBooleanEnd?.();
        if (targetId && targetId !== sourceId) {
          this.onDropBoolean?.(sourceId, targetId, e.clientX, e.clientY);
        }
      } else if (pd?.active) {
        const moved = Math.hypot(e.clientX - pd.x, e.clientY - pd.y);
        if (moved < 6) this.handleClick(e);
      }
      this.pointerDown = null;
      void store;
    });
  }

  pickAt(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.meshMap.values()], false);
    return hits[0] ?? null;
  }

  handleClick(e) {
    const hit = this.pickAt(e.clientX, e.clientY);
    const store = useStore.getState();
    if (!hit) {
      store.setSelected([]);
      return;
    }
    const id = hit.object.userData.nodeId;
    if (e.shiftKey) {
      const cur = store.selectedIds;
      store.setSelected(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-2));
    } else {
      store.setSelected([id]);
    }
  }

  // ---------- 干涉高亮 ----------
  showInterference(geometry) {
    this.clearInterference();
    if (!geometry) return;
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.interference,
      emissive: COLORS.interference,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.85,
    });
    this.interferenceMesh = new THREE.Mesh(geometry, mat);
    this.scene.add(this.interferenceMesh);
  }

  clearInterference() {
    if (this.interferenceMesh) {
      this.scene.remove(this.interferenceMesh);
      this.interferenceMesh.geometry.dispose();
      this.interferenceMesh.material.dispose();
      this.interferenceMesh = null;
    }
  }

  resize() {
    const el = this.container;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  loop() {
    this.rafId = requestAnimationFrame(this.loop);
    this.orbit.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.unsub?.();
    this.transform.dispose();
    this.orbit.dispose();
    for (const [, mesh] of this.meshMap) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.clearInterference();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
