/**
 * 自适应曝光：按目标亮度调整曝光倍率。
 * 时间常数不对称 —— 进洞（曝光上调）快速抬升，出洞（曝光下调）缓慢回落。
 */
export class AutoExposure {
  /** 目标亮度（线性，0.05–0.6） */
  targetBrightness = 0.18;
  /** 过渡时长基准（秒，0.2–3） */
  transitionDuration = 1.0;
  /** 当前曝光倍率 */
  exposure = 1.0;

  readonly minExposure = 0.05;
  readonly maxExposure = 40;
  /** 上调（进洞）时间常数系数：快速 */
  riseFactor = 0.35;
  /** 下调（出洞）时间常数系数：缓慢 */
  fallFactor = 1.6;

  update(dt: number, measuredLuminance: number): void {
    const m = Math.max(measuredLuminance, 1e-4);
    const desired = Math.min(
      this.maxExposure,
      Math.max(this.minExposure, this.targetBrightness / m),
    );
    const rising = desired > this.exposure;
    const tau = Math.max(
      this.transitionDuration * (rising ? this.riseFactor : this.fallFactor),
      1e-3,
    );
    const k = 1 - Math.exp(-dt / tau);
    this.exposure += (desired - this.exposure) * k;
  }

  /** 曝光值（档，log2 曝光倍率） */
  get ev(): number {
    return Math.log2(this.exposure);
  }
}
