import { TopBar } from './components/TopBar';
import { Viewport } from './components/Viewport';
import { ConfigPanel } from './components/ConfigPanel';
import { Hud } from './components/Hud';
import { WeatherOverlay } from './components/WeatherOverlay';
import { Toasts } from './components/Toasts';
import { useAppStore } from './store/appStore';
import { VIEW_IDS, VIEW_LABELS } from './engine/types';

export default function App() {
  const tab = useAppStore((s) => s.tab);
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const panelOpen = useAppStore((s) => s.panelOpen);

  return (
    <div className={`app ${panelOpen ? 'panel-open' : ''}`}>
      <TopBar />
      <main className="workspace">
        <div className="stage">
          <Viewport />
          <WeatherOverlay />
          {tab === 'triple' && (
            <div className="viewport-labels">
              {VIEW_IDS.map((id, i) => (
                <button
                  key={id}
                  className={`vp-label ${activeView === id ? 'active' : ''}`}
                  style={{ left: `${(i * 100) / 3}%`, width: `${100 / 3}%` }}
                  onClick={() => setActiveView(id)}
                >
                  {VIEW_LABELS[id]}
                  {activeView === id ? ' · 操控中' : ''}
                </button>
              ))}
            </div>
          )}
          <Hud />
        </div>
        <ConfigPanel />
      </main>
      <Toasts />
    </div>
  );
}
