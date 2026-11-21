import { For, createMemo } from 'solid-js';
import { store } from '../state/store';
import { MAX_FOLD } from '../geometry/math';
import type { BabylonScene } from '../babylon/scene';

interface Props {
  scene: () => BabylonScene | null;
}

const rad2deg = (r: number) => Math.round((r * 180) / Math.PI);

export function FoldPanel(props: Props) {
  const getConns = store.getConns;
  const mode = store.mode;

  const foldRows = createMemo(() =>
    getConns().map((c, i) => {
      const [aTile] = c.a.split(':').map(Number);
      const [bTile] = c.b.split(':').map(Number);
      const atMax = c.fold >= MAX_FOLD - 1e-6;
      // foldOnce / animateFold 都以连接任一端的 "tileId:edge" 作为 key
      return { key: c.a, index: i, fold: c.fold, aTile, bTile, atMax, conn: c };
    }),
  );

  const stepFold = async (key: string, delta: 1 | -1) => {
    const next = store.foldOnce(key, delta);
    if (next === null) return;
    await props.scene()?.animateFold(key, next);
  };

  return (
    <div class="fold-panel" classList={{ hidden: mode() !== 'folded' }}>
      <h3>折一折</h3>
      <p class="fold-tip">沿公共边每次折 15°,最多 120°</p>
      <For each={foldRows()}>
        {(row) => (
          <div class="fold-row">
            <span class="fold-label">
              片 {row.aTile} ↔ 片 {row.bTile}
            </span>
            <div class="fold-controls">
              <button class="btn btn-small" onClick={() => stepFold(row.key, -1)} disabled={row.fold <= 1e-6}>
                −
              </button>
              <span
                class="fold-angle"
                classList={{ 'fold-max': row.atMax }}
                title={row.atMax ? '已到 120° 上限' : ''}
              >
                {rad2deg(row.fold)}°
              </span>
              <button
                class="btn btn-small"
                onClick={() => stepFold(row.key, 1)}
                disabled={row.atMax}
              >
                +
              </button>
            </div>
          </div>
        )}
      </For>
      {getConns().length === 0 && <p class="fold-empty">先把磁力片吸在一起,才能折哦</p>}
    </div>
  );
}
