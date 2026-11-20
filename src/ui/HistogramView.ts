/** 16 档亮度直方图显示 */
export class HistogramView {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  draw(bins: Float32Array, meanBin: number): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#14181d';
    ctx.fillRect(0, 0, w, h);

    let max = 1e-6;
    for (const b of bins) max = Math.max(max, b);

    const bw = w / bins.length;
    for (let i = 0; i < bins.length; i++) {
      const bh = (bins[i] / max) * (h - 14);
      ctx.fillStyle = i === meanBin ? '#4fc3f7' : '#5b6672';
      ctx.fillRect(i * bw + 1, h - 12 - bh, bw - 2, bh);
    }

    ctx.fillStyle = '#6b7684';
    ctx.font = '9px monospace';
    ctx.fillText('-8EV', 2, h - 2);
    ctx.fillText('+6EV', w - 26, h - 2);
  }
}
