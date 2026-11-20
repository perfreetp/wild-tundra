import { useEffect } from 'react';
import { useStore } from './state/store.js';
import ModelPage from './components/ModelPage.jsx';
import AssemblyPage from './components/AssemblyPage.jsx';
import ExportPage from './components/ExportPage.jsx';

const TABS = [
  { key: 'model', label: '建模' },
  { key: 'assembly', label: '装配' },
  { key: 'export', label: '导出' },
];

export default function App({ kernelReady, kernelError }) {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const toast = useStore((s) => s.toast);
  const nodeCount = useStore((s) => Object.keys(s.tree.nodes).length);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => useStore.setState({ toast: null }), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  if (kernelError) {
    return (
      <div className="boot-error">
        <h2>Manifold 内核加载失败</h2>
        <pre>{kernelError}</pre>
      </div>
    );
  }
  if (!kernelReady) {
    return <div className="boot-loading"><div className="spinner" /><div>正在加载 manifold WASM 内核…</div></div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">🏗 舞台桁架节点实体建模工作台</div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="header-stat">节点数 {nodeCount} · 单位 mm</div>
      </header>

      <main className="app-main">
        {tab === 'model' && <ModelPage />}
        {tab === 'assembly' && <AssemblyPage />}
        {tab === 'export' && <ExportPage />}
      </main>

      {toast && (
        <div className={`toast ${toast.kind}`}>
          {toast.kind === 'error' ? '⛔ ' : toast.kind === 'warn' ? '⚠️ ' : toast.kind === 'ok' ? '✅ ' : 'ℹ️ '}
          {toast.message}
        </div>
      )}
    </div>
  );
}
