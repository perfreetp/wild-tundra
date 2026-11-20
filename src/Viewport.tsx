import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ReconResult } from './types';

export interface ClipAxis {
  enabled: boolean;
  /** 0..1，沿轴归一化位置 */
  pos: number;
}

export interface ClipState {
  x: ClipAxis;
  y: ClipAxis;
  z: ClipAxis;
}

interface ViewportProps {
  result: ReconResult | null;
  dims: [number, number, number];
  spacing: [number, number, number];
  colors: Float32Array | null;
  opacity: number;
  clip: ClipState;
  /** 暴露当前网格给导出功能 */
  meshRef: React.MutableRefObject<THREE.Mesh | null>;
}

export function Viewport({ result, dims, spacing, colors, opacity, clip, meshRef }: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const planesRef = useRef<THREE.Plane[]>([new THREE.Plane(), new THREE.Plane(), new THREE.Plane()]);

  // 初始化场景（一次）
  useEffect(() => {
    const container = containerRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x11151c);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    camera.position.set(120, 120, 180);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(1, 2, 1.5).multiplyScalar(200);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-1, -0.5, -1).multiplyScalar(200);
    scene.add(dir2);
    scene.add(new THREE.AxesHelper(40));

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    sceneRef.current = scene;
    rendererRef.current = renderer;

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  // 网格更新
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 移除旧网格
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }
    if (!result || result.triCount === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
    geo.setIndex(new THREE.BufferAttribute(result.indices, 1));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      clippingPlanes: planesRef.current.filter((_, i) =>
        [clip.x.enabled, clip.y.enabled, clip.z.enabled][i],
      ),
      clipShadows: false,
      roughness: 0.55,
      metalness: 0.05,
    });
    materialRef.current = mat;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(...spacing);
    // 居中到原点
    mesh.position.set(
      (-(dims[0] - 1) / 2) * spacing[0],
      (-(dims[1] - 1) / 2) * spacing[1],
      (-(dims[2] - 1) / 2) * spacing[2],
    );
    scene.add(mesh);
    meshRef.current = mesh;
  }, [result, dims, spacing]);

  // 顶点色更新
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !colors) return;
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mesh.geometry.attributes.color.needsUpdate = true;
  }, [colors]);

  // 不透明度更新
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.opacity = opacity;
      materialRef.current.needsUpdate = true;
    }
  }, [opacity]);

  // 剖切平面更新（世界坐标，网格已居中）
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const half: [number, number, number] = [
      ((dims[0] - 1) / 2) * spacing[0],
      ((dims[1] - 1) / 2) * spacing[1],
      ((dims[2] - 1) / 2) * spacing[2],
    ];
    const axes: Array<{ axis: 'x' | 'y' | 'z'; state: ClipAxis; normal: THREE.Vector3 }> = [
      { axis: 'x', state: clip.x, normal: new THREE.Vector3(-1, 0, 0) },
      { axis: 'y', state: clip.y, normal: new THREE.Vector3(0, -1, 0) },
      { axis: 'z', state: clip.z, normal: new THREE.Vector3(0, 0, -1) },
    ];
    const active: THREE.Plane[] = [];
    axes.forEach(({ axis, state, normal }, i) => {
      if (!state.enabled) return;
      const h = half[i];
      const c = -h + state.pos * 2 * h; // 世界坐标切面位置
      const plane = planesRef.current[i];
      plane.normal.copy(normal);
      plane.constant = c;
      active.push(plane);
    });
    mat.clippingPlanes = active;
    mat.needsUpdate = true;
  }, [clip, dims, spacing, result]);

  return <div ref={containerRef} className="viewport" />;
}
