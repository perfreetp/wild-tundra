import { store } from '../state/store';

interface Props {
  onExport: () => void;
}

export function Toolbar(props: Props) {
  const mode = store.mode;
  const canUndo = store.canUndo;
  const canRedo = store.canRedo;

  return (
    <div class="toolbar">
      <div class="toolbar-group">
        {mode() === 'flat' ? (
          <button class="btn btn-primary" onClick={() => store.standUp()} disabled={store.getTiles().length === 0}>
            🴴 立起来
          </button>
        ) : (
          <button class="btn btn-primary" onClick={() => store.layFlat()}>
            ▦ 平铺
          </button>
        )}
      </div>

      <div class="toolbar-group">
        <button class="btn" onClick={() => store.undo()} disabled={!canUndo()}>
          ↶ 撤销
        </button>
        <button class="btn" onClick={() => store.redo()} disabled={!canRedo()}>
          ↷ 重做
        </button>
      </div>

      <div class="toolbar-group">
        <button class="btn" onClick={() => store.reset()}>
          🗑 清空
        </button>
        <button class="btn btn-accent" onClick={props.onExport} disabled={store.getTiles().length === 0}>
          🖼 搭法卡片
        </button>
      </div>
    </div>
  );
}
