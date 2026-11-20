import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { useStore } from '../state/store.js';
import { manifoldToGeometry, getManifoldSync } from '../kernel/bridge.js';
import { downloadBlob } from '../utils/download.js';

/**
 * 装配页：把多个历史树节点（各自的求值实体）按 XYZ 坐标摆放，
 * 并集合并成一个整体实体，可在装配态预览 / 直接导出。
 */
export default function AssemblyPage() {
  const tree = useStore((s) => s.tree);
  const geometryResults = useStore((s) => s.geometryResults);
  const assembly = useStore((s) => s.assembly);
  const addAssemblyItem = useStore((s) => s.addAssemblyItem);
  const updateAssemblyItem = useStore((s) => s.updateAssemblyItem);
  const removeAssemblyItem = useStore((s) => s.removeAssemblyItem);
  const setToast = useStore((s) => s.showToast);
  const selectRef = useRef(null);
  const [mergedGeometry, setMergedGeometry] = useState(null);
  const [mergedVolume, setMergedVolume] = useState(0);

  const rootNodes = useMemo(
    () => Object.values(tree.nodes).filter((n) => n.parentId == null),
    [tree.nodes]
  );

  const buildMerged = () => {
    const M = getManifoldSync();
    const parts = [];
    for (const item of assembly) {
      const r = geometryResults[item.nodeId];
      if (!r?.manifold || r.manifold.isEmpty()) continue;
      parts.push(r.manifold.translate(item.position));
    }
    if (parts.length === 0) {
      setToast('装配为空：请先添加节点并确保已求值', 'warn');
      return;
    }
    const merged = parts.length === 1 ? parts[0] : M.Manifold.union(parts);
    setMergedGeometry(manifoldToGeometry(merged));
    setMergedVolume(merged.volume());
    setToast(`已合并 ${parts.length} 个节点为整体实体`, 'ok');
  };

  const exportMerged = async (format) => {
    if (!mergedGeometry) {
      setToast('请先合并生成整体实体', 'warn');
      return;
    }
    const mesh = new THREE.Mesh(mergedGeometry, new THREE.MeshStandardMaterial({ color: 0x9fd8ff }));
    mesh.name = 'truss-assembly';
    if (format === 'stl') {
      const exporter = new STLExporter();
      // binary=true 输出二进制 STL
      const buffer = exporter.parse(mesh, { binary: true });
      downloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), 'truss-assembly.stl');
    } else {
      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(mesh, { binary: true });
      downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), 'truss-assembly.glb');
    }
    setToast(`已导出 ${format.toUpperCase()}`, 'ok');
  };

  return (
    <div className="page assembly-page">
      <section className="card">
        <h3>装配清单</h3>
        <div className="asm-add">
          <select ref={selectRef} defaultValue="">
            <option value="" disabled>选择历史树根节点…</option>
            {rootNodes.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          <button onClick={() => {
            const nodeId = selectRef.current?.value;
            if (nodeId) addAssemblyItem(nodeId, [assembly.length * 120, 0, 0]);
          }}>添加到装配</button>
        </div>

        <table className="asm-table">
          <thead>
            <tr><th>节点</th><th>X (mm)</th><th>Y (mm)</th><th>Z (mm)</th><th></th></tr>
          </thead>
          <tbody>
            {assembly.map((item) => {
              const node = tree.nodes[item.nodeId];
              return (
                <tr key={item.id}>
                  <td>{node?.name ?? '（已删除）'}</td>
                  {[0, 1, 2].map((axis) => (
                    <td key={axis}>
                      <input
                        type="number"
                        step={5}
                        value={item.position[axis]}
                        onChange={(e) => {
                          const position = [...item.position];
                          position[axis] = Number(e.target.value) || 0;
                          updateAssemblyItem(item.id, { position });
                        }}
                      />
                    </td>
                  ))}
                  <td><button className="mini danger" onClick={() => removeAssemblyItem(item.id)}>移除</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="asm-actions">
          <button className="primary" onClick={buildMerged}>按 XYZ 摆放并合并为整体实体</button>
          {mergedGeometry && (
            <>
              <button onClick={() => exportMerged('stl')}>导出二进制 STL</button>
              <button onClick={() => exportMerged('glb')}>导出 GLB</button>
              <span className="stat">合并体积 {mergedVolume.toFixed(1)} mm³</span>
            </>
          )}
        </div>
      </section>

      <section className="card preview-card">
        <h3>合并预览</h3>
        {mergedGeometry
          ? <MiniPreview geometry={mergedGeometry} />
          : <p className="tip">合并后在此预览整体实体（自动旋转）。</p>}
      </section>
    </div>
  );
}

/** 轻量自管理预览：独立小场景，自动旋转 */
function MiniPreview({ geometry }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !geometry) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14181f);
    const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 5000);
    camera.position.set(300, 240, 360);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(200, 300, 200);
    scene.add(dir);
    scene.add(new THREE.GridHelper(1000, 50, 0x3a4456, 0x242b38));

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.35, roughness: 0.45 })
    );
    scene.add(mesh);

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      mesh.rotation.y += 0.006;
      renderer.render(scene, camera);
    };
    loop();

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [geometry]);

  return <div className="mini-preview" ref={hostRef} />;
}
