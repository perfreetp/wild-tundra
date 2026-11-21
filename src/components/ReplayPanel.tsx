import { createSignal } from 'solid-js';
import { store } from '../state/store';

export function ReplayPanel() {
  const [playing, setPlaying] = createSignal(false);
  const replayIndex = store.replayIndex;
  const total = store.replayTotal;

  const start = () => {
    store.startReplay();
    setPlaying(true);
  };

  // 自动正向播放
  let timer: number | undefined;
  const autoPlay = () => {
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(() => {
      const ok = store.replayNext();
      if (!ok) {
        window.clearInterval(timer);
        timer = undefined;
        setPlaying(false);
      }
    }, 700);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = undefined;
    }
    // 恢复到最终状态
    while (store.replayNext()) {
      /* 跑完剩余 */
    }
    setPlaying(false);
  };

  const replaying = () => replayIndex() !== null;

  return (
    <div class="replay-panel">
      <h3>回放搭法</h3>
      <div class="replay-buttons">
        {!replaying() ? (
          <button class="btn" onClick={() => { start(); autoPlay(); }} disabled={total() === 0}>
            ▶ 看我怎么拼的
          </button>
        ) : (
          <>
            <button class="btn btn-small" onClick={() => store.replayPrev()}>
              ⏮ 上一步
            </button>
            <button class="btn btn-small" onClick={() => store.replayNext()}>
              下一步 ⏭
            </button>
            <button class="btn btn-small" onClick={stop}>
              ⏹ 结束
            </button>
          </>
        )}
      </div>
      {replaying() && (
        <div class="replay-progress">
          第 {replayIndex()! + 1} / {total()} 步
          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${((replayIndex()! / Math.max(1, total())) * 100)}%` }} />
          </div>
        </div>
      )}
      {playing() && !replaying() && <p class="replay-done">回放完成 🎉</p>}
    </div>
  );
}
