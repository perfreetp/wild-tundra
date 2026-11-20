// 时间轴模块:刻度标尺、标识牌停留事件带、关键点标记、播放头与拖拽定位

import { AppState } from "../store";
import { RoutePath } from "../routePath";

export class TimelineView {
  private root: HTMLElement;
  private track: HTMLElement;
  private onSeek: (t: number) => void;
  private onSelectKP: (id: string) => void;

  constructor(
    root: HTMLElement,
    deps: { onSeek: (t: number) => void; onSelectKP: (id: string) => void }
  ) {
    this.root = root;
    this.onSeek = deps.onSeek;
    this.onSelectKP = deps.onSelectKP;
    this.track = document.createElement("div");
    this.track.className = "tl-track";
    this.root.appendChild(this.track);

    let dragging = false;
    const seekFromEvent = (clientX: number) => {
      const rect = this.track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return ratio;
    };
    this.track.addEventListener("pointerdown", (e) => {
      dragging = true;
      this.track.setPointerCapture(e.pointerId);
      const ratio = seekFromEvent(e.clientX);
      this.lastRatio = ratio;
    });
    this.track.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      this.lastRatio = seekFromEvent(e.clientX);
    });
    this.track.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      this.emitSeek();
    });
  }

  private lastRatio = 0;
  private duration = 0;

  private emitSeek(): void {
    this.onSeek(this.lastRatio * this.duration);
  }

  render(state: AppState, path: RoutePath | null): void {
    const track = this.track;
    track.innerHTML = "";
    const duration = path?.duration ?? 0;
    this.duration = duration;

    if (!path || path.keyPointCount < 2 || duration <= 0) {
      const hint = document.createElement("div");
      hint.className = "tl-empty";
      hint.textContent = "当前路线至少需要 2 个关键点才会生成时间轴";
      track.appendChild(hint);
      this.renderPlayhead(state, 0);
      return;
    }

    // —— 刻度层 ——
    const ruler = document.createElement("div");
    ruler.className = "tl-layer tl-ruler";
    const tickStep = duration > 30 ? 5 : duration > 12 ? 2 : 1;
    for (let t = 0; t <= duration + 1e-6; t += tickStep) {
      const tick = document.createElement("div");
      tick.className = "tl-tick";
      tick.style.left = `${(t / duration) * 100}%`;
      const label = document.createElement("span");
      label.textContent = `${t}s`;
      tick.appendChild(label);
      ruler.appendChild(tick);
    }
    track.appendChild(ruler);

    // —— 标识牌事件带 ——
    const signRow = document.createElement("div");
    signRow.className = "tl-layer tl-signs";
    for (const ev of path.signEvents) {
      const band = document.createElement("div");
      band.className = "tl-sign-band";
      band.style.left = `${(ev.start / duration) * 100}%`;
      band.style.width = `${Math.max(1.2, ((ev.end - ev.start) / duration) * 100)}%`;
      band.title = `${ev.label} 停留 ${(ev.end - ev.start).toFixed(2)}s`;
      signRow.appendChild(band);
    }
    track.appendChild(signRow);

    // —— 关键点标记层 ——
    const kpRow = document.createElement("div");
    kpRow.className = "tl-layer tl-kps";
    path.route.keyPoints.forEach((kp, i) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "tl-kp" + (kp.id === state.selectedKPId ? " selected" : "");
      marker.style.left = `${(kp.time / duration) * 100}%`;
      marker.title = `关键点 ${i + 1} · ${kp.time.toFixed(1)}s · FOV ${kp.fov}° · ${kp.speed} 档`;
      marker.addEventListener("pointerdown", (e) => e.stopPropagation());
      marker.addEventListener("click", () => this.onSelectKP(kp.id));
      const dot = document.createElement("span");
      dot.className = "tl-kp-dot";
      dot.textContent = String(i + 1);
      marker.appendChild(dot);
      kpRow.appendChild(marker);
    });
    track.appendChild(kpRow);

    this.renderPlayhead(state, duration);
  }

  private renderPlayhead(state: AppState, duration: number): void {
    const head = document.createElement("div");
    head.className = "tl-playhead";
    head.dataset.role = "playhead";
    const pct = duration > 0 ? Math.min(1, state.playTime / duration) * 100 : 0;
    head.style.left = `${pct}%`;
    this.track.appendChild(head);
  }

  /** 播放中高频调用:只移动播放头,不重建 DOM */
  updatePlayhead(time: number): void {
    const head = this.track.querySelector<HTMLElement>('[data-role="playhead"]');
    if (!head) return;
    const pct = this.duration > 0 ? Math.min(1, time / this.duration) * 100 : 0;
    head.style.left = `${pct}%`;
  }
}
