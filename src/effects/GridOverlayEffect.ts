import { Uniform, Vector2, Vector3 } from 'three';
import { BlendFunction, Effect } from 'postprocessing';

/**
 * 标定网格叠加效果
 * 在成像画面上叠加等间距网格与中心十字，用于相机标定与畸变观察。
 * 注意：
 * 1. uniform 不能命名为 step（GLSL 内建函数保留字）；
 * 2. 不能用 fwidth(uv/step) 判定线宽——后处理全屏三角形上该导数跨图元
 *    变化剧烈，会导致网格颜色在整个画面泄漏。改用 resolution 计算
 *    固定像素线宽的局部距离判定。
 */
export class GridOverlayEffect extends Effect {
  constructor(
    gridStep = 0.1,
    color = new Vector3(0.2, 1.0, 0.55),
    opacity = 0.55,
  ) {
    super('GridOverlayEffect', FRAGMENT, {
      blendFunction: BlendFunction.SET,
      uniforms: new Map<string, Uniform>([
        ['gridStep', new Uniform(gridStep)],
        ['color', new Uniform(color)],
        ['opacity', new Uniform(opacity)],
        ['resolution', new Uniform(new Vector2(1, 1))],
      ]),
    });
  }

  setStep(v: number) {
    this.uniforms.get('gridStep')!.value = v;
  }

  setOpacity(v: number) {
    this.uniforms.get('opacity')!.value = v;
  }

  setSize(width: number, height: number) {
    const r = this.uniforms.get('resolution')!.value as Vector2;
    r.set(width, height);
  }
}

const FRAGMENT = /* glsl */ `
uniform float gridStep;
uniform vec3 color;
uniform float opacity;
uniform vec2 resolution;

/** 固定像素宽度的网格线：返回 0~1 的线覆盖系数 */
float lineMask(float coord, float stepSize, float pixelSize) {
  float q = coord / stepSize;
  float f = abs(fract(q - 0.5) - 0.5); // 到格线的归一化距离 [0,0.5]
  float d = f * stepSize; // 转回 UV 距离
  float halfWidth = pixelSize * 0.75; // 约 1.5px 线宽
  return 1.0 - smoothstep(halfWidth * 0.4, halfWidth, d);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float px = 1.0 / resolution.x;
  float py = 1.0 / resolution.y;

  // 网格线（x/y 各方向独立计算，取最大）
  float gx = lineMask(uv.x, gridStep, px);
  float gy = lineMask(uv.y, gridStep, py);
  float grid = max(gx, gy);

  // 中心十字：宽度约 2px，长度为画面的 12%
  float cx = 1.0 - smoothstep(px, px * 2.0, abs(uv.x - 0.5));
  float cy = 1.0 - smoothstep(py, py * 2.0, abs(uv.y - 0.5));
  float inXRange = step(abs(uv.y - 0.5), 0.06);
  float inYRange = step(abs(uv.x - 0.5), 0.06);
  float center = max(cx * inXRange, cy * inYRange);

  float mask = max(grid * opacity, center * min(opacity + 0.3, 1.0));
  vec3 rgb = inputColor.rgb + color * mask;
  outputColor = vec4(rgb, inputColor.a);
}
`;
