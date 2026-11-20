/**
 * 绘制调用预算管理：
 * 三屏同显时一帧内三个相机的 draw call 总和不得超过 200。
 * - 软控制：EWMA 平滑统计，超预算逐级收窄视距，低于下限 85% 时逐级恢复
 * - 硬保证：单帧超限时 clampDown() 立即降档，由渲染循环以更近视距重渲该帧
 */
export class DrawCallBudget {
  readonly hardLimit = 200;
  private readonly levels = [1200, 800, 550, 380, 260];
  private levelIndex = 0;
  private ewma = 0;
  private readonly alpha = 0.15;
  overBudget = false;

  get viewDistance(): number {
    return this.levels[this.levelIndex];
  }

  /** 是否还能继续降档（供帧内重渲判断） */
  get canClampDown(): boolean {
    return this.levelIndex < this.levels.length - 1;
  }

  /** 单帧硬超限时立即降档，返回新的视距 */
  clampDown(): number {
    if (this.canClampDown) this.levelIndex++;
    this.overBudget = true;
    return this.viewDistance;
  }

  /** 每帧记录最终采用的总绘制调用，更新平滑统计 */
  record(totalDrawCalls: number): void {
    this.ewma = this.ewma === 0 ? totalDrawCalls : this.ewma * (1 - this.alpha) + totalDrawCalls * this.alpha;

    if (this.ewma > this.hardLimit && this.levelIndex < this.levels.length - 1) {
      this.levelIndex++;
      this.overBudget = true;
    } else if (this.ewma < this.hardLimit * 0.85 && this.levelIndex > 0) {
      this.levelIndex--;
      this.overBudget = this.ewma > this.hardLimit;
    } else {
      this.overBudget = this.ewma > this.hardLimit;
    }
  }

  get smoothed(): number {
    return Math.round(this.ewma);
  }

  reset(): void {
    this.levelIndex = 0;
    this.ewma = 0;
    this.overBudget = false;
  }
}
