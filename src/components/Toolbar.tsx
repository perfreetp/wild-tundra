import { useState } from 'react';
import { getEngine } from './Viewer';
import { useSimStore } from '../store';

export function Toolbar() {
  const [flash, setFlash] = useState(false);
  const params = useSimStore((s) => s.params);

  const download = (href: string, filename: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
  };

  const onScreenshot = () => {
    const engine = getEngine();
    if (!engine) return;
    const url = engine.captureScreenshot();
    const stamp = new Date()
      .toISOString()
      .replace(/[:T]/g, '-')
      .slice(0, 19);
    download(url, `camera-capture-${stamp}.png`);
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  };

  const onExportParams = () => {
    useSimStore.getState().exportPresetFile(null);
  };

  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand-dot" />
        <div>
          <strong>车载摄像头成像仿真</strong>
          <small>Vehicle Camera Imaging Simulator</small>
        </div>
      </div>
      <div className="toolbar-actions">
        <span className="toolbar-mode">
          {params.timeOfDay === 'day'
            ? '白天'
            : params.timeOfDay === 'dusk'
              ? '黄昏'
              : '夜间'}
        </span>
        <button className="btn" onClick={onExportParams}>
          导出参数
        </button>
        <button
          className={`btn primary shutter ${flash ? 'flash' : ''}`}
          onClick={onScreenshot}
        >
          📷 截图导出 PNG
        </button>
      </div>
    </header>
  );
}
