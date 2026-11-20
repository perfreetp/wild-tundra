import { useAppStore } from '../store/appStore';
import { engineBridge } from './Viewport';
import { Slider, Section } from './controls';
import { VIEW_IDS, VIEW_LABELS, type ViewId } from '../engine/types';

/** 三个视点的相机参数：FOV 30–90°、近裁面 0.5–5m，各自独立可调 */
export function ViewPanel() {
  const tab = useAppStore((s) => s.tab);
  const activeView = useAppStore((s) => s.activeView);
  const views = useAppStore((s) => s.views);
  const patchView = useAppStore((s) => s.patchView);
  const pushToast = useAppStore((s) => s.pushToast);

  const editableIds: ViewId[] =
    tab === 'triple' ? [...VIEW_IDS] : [tab as ViewId];
  const highlight = (id: ViewId) =>
    tab === 'triple' && id === activeView ? ' (当前操控)' : '';

  const resetRig = (id: ViewId | 'all') => {
    const engine = engineBridge.engineRef.current;
    if (!engine) return;
    engine.resetRig(id);
    const configs = engine.getAllViewConfigs();
    const target = id === 'all' ? VIEW_IDS : [id];
    for (const vid of target) patchView(vid, configs[vid]);
    pushToast(id === 'all' ? '全部视点已吸附回中心线自动机位' : `${VIEW_LABELS[id]}视点已复位`, 'success');
  };

  return (
    <Section
      title="视点相机"
      extra={
        <button className="btn tiny" onClick={() => resetRig('all')}>
          全部复位
        </button>
      }
    >
      {editableIds.map((id) => {
        const cfg = views[id];
        return (
          <div className="view-block" key={id}>
            <div className="view-block-head">
              <strong>
                {VIEW_LABELS[id]}
                {highlight(id)}
              </strong>
              <div className="view-head-actions">
                <span className={`badge ${cfg.rigMode ? 'rig' : 'manual'}`}>
                  {cfg.rigMode ? '自动机位' : '手动'}
                </span>
                <button className="btn tiny" onClick={() => resetRig(id)}>
                  复位
                </button>
              </div>
            </div>

            <Slider
              label="视场角 FOV"
              value={cfg.fov}
              min={30}
              max={90}
              step={1}
              unit="°"
              onChange={(v) => patchView(id, { fov: v })}
            />
            <Slider
              label="近裁面 Near"
              value={cfg.near}
              min={0.5}
              max={5}
              step={0.1}
              unit=" m"
              onChange={(v) => patchView(id, { near: v })}
            />
            <Slider
              label="远裁面 Far"
              value={cfg.far}
              min={200}
              max={3000}
              step={50}
              unit=" m"
              onChange={(v) => patchView(id, { far: v })}
            />
            <div className="pose-readout">
              <span>位置</span>
              <code>{cfg.pose.position.map((n) => n.toFixed(1)).join(', ')}</code>
            </div>
          </div>
        );
      })}
      <p className="hint">单视点模式下鼠标拖拽/滚轮可调整朝向与距离，拖拽后自动切换为手动机位。</p>
    </Section>
  );
}
