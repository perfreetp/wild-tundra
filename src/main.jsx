import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { primeKernel } from './kernel/bridge.js';
import { useStore } from './state/store.js';
import './styles.css';

// 测试钩子：仅开发环境暴露 store 供 e2e 驱动（生产构建被裁剪）
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__storeGet = () => useStore.getState();
}

function Boot() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    primeKernel()
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e) => { if (!cancelled) setError(String(e?.message ?? e)); });
    return () => { cancelled = true; };
  }, []);

  return <App kernelReady={ready} kernelError={error} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Boot />
  </StrictMode>
);
