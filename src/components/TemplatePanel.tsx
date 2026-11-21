import { For } from 'solid-js';
import { store } from '../state/store';
import { TileIcon } from './TileIcon';
import { TILE_COLORS } from '../state/colors';

export function TemplatePanel() {
  const active = store.activeTemplate;
  const step = store.templateStep;

  return (
    <div class="template-panel">
      <h3>跟着拼</h3>
      <div class="template-list">
        <For each={store.templates}>
          {(t) => (
            <button
              class="template-card"
              classList={{ active: active()?.id === t.id }}
              onClick={() => store.loadTemplate(t)}
            >
              <span class="template-emoji">{t.emoji}</span>
              <span class="template-meta">
                <strong>{t.name}</strong>
                <small>{t.level}</small>
              </span>
            </button>
          )}
        </For>
      </div>

      {active() && (
        <div class="template-progress">
          <div class="template-steps">
            <For each={active()!.tiles}>
              {(tile, i) => (
                <div class="step-chip" classList={{ done: i() < step(), next: i() === step() }}>
                  <TileIcon kind={tile.kind} color={TILE_COLORS[tile.kind].front} size={34} />
                  <span>{i() < step() ? '✓' : i() + 1}</span>
                </div>
              )}
            </For>
          </div>
          {step() < active()!.tiles.length ? (
            <p class="template-hint">
              下一步:放一个
              <strong>{TILE_COLORS[active()!.tiles[step()].kind].name}</strong>
              (台面上蓝色闪光的地方)
            </p>
          ) : (
            <p class="template-done">模板完成!可以立起来折一折啦 🎉</p>
          )}
          <button class="btn btn-small" onClick={() => store.clearTemplate()}>
            退出引导
          </button>
        </div>
      )}
    </div>
  );
}
