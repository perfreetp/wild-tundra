import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Viewer } from './components/Viewer';
import { CameraPanel } from './components/CameraPanel';
import { ScenePanel } from './components/ScenePanel';
import { PresetPanel } from './components/PresetPanel';

type Tab = 'camera' | 'scene' | 'preset';

const TABS: { id: Tab; label: string }[] = [
  { id: 'camera', label: '成像参数' },
  { id: 'scene', label: '场景编辑' },
  { id: 'preset', label: '配置管理' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('camera');

  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <Viewer />
        <aside className="sidebar">
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? 'tab active' : 'tab'}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-scroll">
            {tab === 'camera' && <CameraPanel />}
            {tab === 'scene' && <ScenePanel />}
            {tab === 'preset' && <PresetPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
