import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { useStore } from '../state/store.js';
import { manifoldToGeometry, getManifoldSync } from '../kernel/bridge.js';
import { downloadBlob } from '../utils/download.js';

export default function ExportPage() {
  const tree = useStore((s) => s.tree);
  const geometryResults = useStore((s) => s.geometryResults);
  const assembly = useStore((s) => s.assembly);
  const saveProject = useStore((s) => s.saveProject);
  const loadProject = useStore((s) => s.loadProject);
  const listProjects = useStore((s) => s.listProjects);
  const deleteProject = useStore((s) => s.deleteProject);
  const showToast = useStore((s) => s.showToast);
  const [source, setSource] = useState('roots'); // roots | assembly
  const [projects, setProjects] = useState([]);

  const refreshList = () => listProjects().then(setProjects);
  useEffect(() => { refreshList(); }, [tree, assembly]);

  const rootNodes = useMemo(
    () => Object.values(tree.nodes).filter((n) => n.parentId == null),
    [tree.nodes]
  );

  /** 构造待导出的 THREE.Mesh 列表 */
  const buildExportMeshes = () => {
    const meshes = [];
    const mat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.35, roughness: 0.45 });
    if (source === 'roots') {
      for (const n of rootNodes) {
        const r = geometryResults[n.id];
        if (!r?.manifold || r.manifold.isEmpty()) continue;
        const mesh = new THREE.Mesh(manifoldToGeometry(r.manifold), mat.clone());
        mesh.name = n.name;
        meshes.push(mesh);
      }
    } else {
      const M = getManifoldSync();
      const parts = assembly
        .map((item) => {
          const r = geometryResults[item.nodeId];
          if (!r?.manifold || r.manifold.isEmpty()) return null;
          return r.manifold.translate(item.position);
        })
        .filter(Boolean);
      if (parts.length) {
        const merged = parts.length === 1 ? parts[0] : M.Manifold.union(parts);
        const mesh = new THREE.Mesh(manifoldToGeometry(merged), mat);
        mesh.name = 'truss-assembly';
        meshes.push(mesh);
      }
    }
    return meshes;
  };

  const exportSTL = () => {
    const meshes = buildExportMeshes();
    if (!meshes.length) {
      showToast('没有可导出的实体', 'warn');
      return;
    }
    const exporter = new STLExporter();
    // STLExporter.parse 接受 Mesh 或带 updateMatrixWorld 的场景对象
    const group = new THREE.Group();
    group.add(...meshes);
    group.updateMatrixWorld(true);
    const buffer = exporter.parse(group, { binary: true });
    downloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), 'truss-node.stl');
    showToast('二进制 STL 已导出', 'ok');
  };

  const exportGLB = async () => {
    const meshes = buildExportMeshes();
    if (!meshes.length) {
      showToast('没有可导出的实体', 'warn');
      return;
    }
    const exporter = new GLTFExporter();
    const group = new THREE.Group();
    group.add(...meshes);
    const result = await exporter.parseAsync(group, { binary: true });
    downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), 'truss-node.glb');
    showToast('GLB 已导出', 'ok');
  };

  const onSave = async () => {
    await saveProject();
    refreshList();
  };
  const onLoad = async () => {
    const ok = await loadProject();
    if (ok) refreshList();
  };

  return (
    <div className="page export-page">
      <section className="card">
        <h3>几何导出</h3>
        <div className="export-source">
          <label className={`radio-card ${source === 'roots' ? 'on' : ''}`}>
            <input type="radio" name="src" checked={source === 'roots'} onChange={() => setSource('roots')} />
            <div>
              <strong>历史树根实体</strong>
              <span className="tip">{rootNodes.length} 个根节点，各自独立网格</span>
            </div>
          </label>
          <label className={`radio-card ${source === 'assembly' ? 'on' : ''}`}>
            <input type="radio" name="src" checked={source === 'assembly'} onChange={() => setSource('assembly')} />
            <div>
              <strong>装配合并体</strong>
              <span className="tip">{assembly.length} 个装配项，并集为单一整体网格</span>
            </div>
          </label>
        </div>
        <div className="export-actions">
          <button className="primary" onClick={exportSTL}>导出二进制 STL（STLExporter）</button>
          <button className="primary" onClick={exportGLB}>导出 GLB</button>
        </div>
      </section>

      <section className="card">
        <h3>历史树序列化（IndexedDB）</h3>
        <p className="tip">
          完整节点树（参数、变换、父子关系、静音/折叠状态、版本）与装配清单一起序列化，
          下次打开可直接读回并重建几何。
        </p>
        <div className="export-actions">
          <button className="primary" onClick={onSave}>保存工程到 IndexedDB</button>
          <button onClick={onLoad}>从 IndexedDB 读回工程</button>
        </div>
        <table className="asm-table">
          <thead>
            <tr><th>工程</th><th>更新时间</th><th></th></tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr><td colSpan={3} className="tip">暂无已保存工程</td></tr>
            )}
            {projects.map((p) => (
              <tr key={p.id}>
                <td>{p.name ?? p.id}</td>
                <td>{new Date(p.updatedAt).toLocaleString()}</td>
                <td>
                  <button className="mini" onClick={() => loadProject(p.id)}>读回</button>
                  <button className="mini danger" onClick={async () => { await deleteProject(p.id); refreshList(); }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
