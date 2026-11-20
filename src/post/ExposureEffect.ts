import { Effect } from 'postprocessing';
import { Uniform } from 'three';

const fragment = /* glsl */ `
uniform float exposure;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(inputColor.rgb * exposure, inputColor.a);
}
`;

/** 曝光倍率 Pass（HDR 空间，色调映射之前） */
export class ExposureEffect extends Effect {
  constructor() {
    super('ExposureEffect', fragment, {
      uniforms: new Map<string, Uniform>([['exposure', new Uniform(1.0)]]),
    });
  }

  get exposure(): number {
    return this.uniforms.get('exposure')!.value as number;
  }

  set exposure(v: number) {
    this.uniforms.get('exposure')!.value = v;
  }
}
