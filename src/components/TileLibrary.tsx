import { ALL_KINDS } from '../geometry/math';
import { TILE_COLORS } from '../state/colors';
import { TileIcon } from './TileIcon';

interface Props {
  /** 把片库拖拽落到台面时,由父组件把屏幕坐标转成台面坐标 */
  onDropToTable: (kind: AllKind, clientX: number, clientY: number) => void;
}

type AllKind = (typeof ALL_KINDS)[number];

export function TileLibrary(props: Props) {
  const handleDragStart = (kind: AllKind, e: DragEvent) => {
    e.dataTransfer?.setData('tile-kind', kind);
    e.dataTransfer!.effectAllowed = 'copy';
  };

  // 平板没有原生 drag 事件,用指针事件实现"从片库拖出"
  const pointerDown = (kind: AllKind, e: PointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      ghost(kind, ev.clientX, ev.clientY);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      removeGhost();
      // 落在画布区域才添加
      const canvas = document.getElementById('babylon-canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (
          ev.clientX >= rect.left &&
          ev.clientX <= rect.right &&
          ev.clientY >= rect.top &&
          ev.clientY <= rect.bottom
        ) {
          props.onDropToTable(kind, ev.clientX, ev.clientY);
        }
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <aside class="library">
      <h2 class="library-title">磁力片</h2>
      <div class="tile-grid">
        {ALL_KINDS.map((kind) => (
          <button
            class="tile-card"
            draggable="true"
            onDragStart={(e) => handleDragStart(kind, e)}
            onPointerDown={(e) => pointerDown(kind, e)}
            aria-label={`添加${TILE_COLORS[kind].name}`}
          >
            <TileIcon kind={kind} color={TILE_COLORS[kind].front} />
            <span class="tile-name">{TILE_COLORS[kind].name}</span>
          </button>
        ))}
      </div>
      <p class="library-hint">拖到台面就会“咔哒”吸住哦</p>
    </aside>
  );
}

let ghostEl: HTMLDivElement | null = null;
function ghost(kind: AllKind, x: number, y: number) {
  if (!ghostEl) {
    ghostEl = document.createElement('div');
    ghostEl.className = 'drag-ghost';
    document.body.appendChild(ghostEl);
  }
  ghostEl.style.transform = `translate(${x - 36}px, ${y - 36}px)`;
  ghostEl.innerHTML = '';
  // 简单色块提示
  ghostEl.style.background = TILE_COLORS[kind].front;
}
function removeGhost() {
  ghostEl?.remove();
  ghostEl = null;
}
