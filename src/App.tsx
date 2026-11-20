import Toolbar from './components/Toolbar';
import NodeTree from './components/NodeTree';
import Viewport from './components/Viewport';
import SchemePanel from './components/SchemePanel';
import LeakPanel from './components/LeakPanel';
import PipeInfoPanel from './components/PipeInfoPanel';
import { useStore } from './store';

export default function App() {
  const toast = useStore((s) => s.toast);
  return (
    <div className="app">
      <Toolbar />
      <div className="workspace">
        <NodeTree />
        <main className="stage">
          <Viewport />
          <PipeInfoPanel />
        </main>
        <div className="right-rail">
          <SchemePanel />
          <LeakPanel />
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
