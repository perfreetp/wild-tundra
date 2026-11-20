interface Sample {
  t: number;
  ev: number;
  /** log2 实际亮度（测光亮度 × 曝光倍率） */
  lb: number;
}

/**
 * 曲线模块：滚动显示曝光值 EV 与实际亮度随时间的变化折线，
 * 绿色基准线表示目标亮度，可拖动调整。
 */
export class CurveChart {
  target = 0.18;
  onTargetChange: ((v: number) => void) | null = null;

  private readonly samples: Sample[] = [];
  private readonly windowSec = 30;
  private readonly yMin = -5;
  private readonly yMax = 6;
  private dragging = false;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', () => {
      this.dragging = false;
    });
  }

  push(t: number, ev: number, achievedBrightness: number): void {
    this.samples.push({ t, ev, lb: Math.log2(Math.max(achievedBrightness, 1e-4)) });
    const cutoff = t - this.windowSec;
    while (this.samples.length > 0 && this.samples[0].t < cutoff) this.samples.shift();
  }

  draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#14181d';
    ctx.fillRect(0, 0, w, h);

    // 网格
    ctx.strokeStyle = '#2a3138';
    ctx.fillStyle = '#6b7684';
    ctx.font = '9px monospace';
    ctx.lineWidth = 1;
    for (let v = Math.ceil(this.yMin); v <= this.yMax; v++) {
      const y = this.logToY(v);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillText(`${v}`, 2, y - 1);
    }

    // 折线
    if (this.samples.length > 1) {
      const t1 = this.samples[this.samples.length - 1].t;
      const t0 = t1 - this.windowSec;
      const xOf = (t: number) => ((t - t0) / this.windowSec) * w;
      this.plot(xOf, (s) => s.lb, '#ffb74d');
      this.plot(xOf, (s) => s.ev, '#4fc3f7');
    }

    // 目标亮度基准线（可拖动）
    const ty = this.logToY(Math.log2(this.target));
    ctx.strokeStyle = '#66bb6a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(w, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#66bb6a';
    ctx.font = '10px sans-serif';
    ctx.fillText(`目标 ${this.target.toFixed(2)}`, w - 62, ty - 4);

    // 图例
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('— EV', 6, 12);
    ctx.fillStyle = '#ffb74d';
    ctx.fillText('— 亮度', 48, 12);
  }

  private plot(xOf: (t: number) => number, val: (s: Sample) => number, color: string): void {
    const { ctx } = this;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (const s of this.samples) {
      const x = xOf(s.t);
      const y = Math.max(-4, Math.min(this.canvas.height + 4, this.logToY(val(s))));
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  private logToY(l: number): number {
    return ((this.yMax - l) / (this.yMax - this.yMin)) * this.canvas.height;
  }

  private yToLog(y: number): number {
    return this.yMax - (y / this.canvas.height) * (this.yMax - this.yMin);
  }

  private targetY(): number {
    return this.logToY(Math.log2(this.target));
  }

  private readonly onDown = (e: PointerEvent): void => {
    const r = this.canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) * (this.canvas.height / r.height);
    if (Math.abs(y - this.targetY()) < 8) {
      this.dragging = true;
      this.applyDrag(e);
    }
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (this.dragging) this.applyDrag(e);
  };

  private applyDrag(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) * (this.canvas.height / r.height);
    const v = Math.pow(2, this.yToLog(y));
    this.target = Math.min(0.6, Math.max(0.05, v));
    this.onTargetChange?.(this.target);
  }
}
