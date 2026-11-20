import ParamPanel from './ParamPanel.jsx';
import Viewport from './Viewport.jsx';
import HistoryTree from './HistoryTree.jsx';

export default function ModelPage() {
  return (
    <div className="model-layout">
      <ParamPanel />
      <Viewport />
      <HistoryTree />
    </div>
  );
}
