import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  UnsignedByteType,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';

export const METER_BINS = 16;
/** 直方图覆盖的亮度范围：2^-8 ~ 2^6（14 档曝光） */
const METER_MIN_LOG = -8;
const METER_RANGE = 14;

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // 对数编码到 0..1，便于用 8bit RT 回读
  float enc = clamp((log2(max(l, 1e-6)) - (${METER_MIN_LOG}.0)) / ${METER_RANGE}.0, 0.0, 1.0);
  gl_FragColor = vec4(enc, enc, enc, 1.0);
}
`;

/**
 * 测光模块：把 HDR 画面缩到 64x36 的亮度纹理回读，
 * 按画面中心加权（高斯权）统计 16 档亮度直方图与加权平均亮度。
 */
export class Metering {
  readonly width = 64;
  readonly height = 36;
  readonly histogram = new Float32Array(METER_BINS);
  meanLuminance = 0.18;
  meanBin = 0;

  private readonly rt: WebGLRenderTarget;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly material: ShaderMaterial;
  private readonly pixels = new Uint8Array(this.width * this.height * 4);
  private readonly weights = new Float32Array(this.width * this.height);
  private readonly weightSum: number;

  constructor(private readonly renderer: WebGLRenderer) {
    this.rt = new WebGLRenderTarget(this.width, this.height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
    });
    this.material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { tDiffuse: { value: null as Texture | null } },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);

    // 中心加权：高斯权，中心权重约为边缘的 6 倍
    let sum = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const u = ((x + 0.5) / this.width) * 2 - 1;
        const v = ((y + 0.5) / this.height) * 2 - 1;
        const w = Math.exp(-(u * u + v * v) * 1.8);
        this.weights[y * this.width + x] = w;
        sum += w;
      }
    }
    this.weightSum = sum;
  }

  /** 从 HDR 纹理采样并更新直方图与平均亮度 */
  measure(source: Texture): void {
    this.material.uniforms.tDiffuse.value = source;
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(this.rt, 0, 0, this.width, this.height, this.pixels);
    this.renderer.setRenderTarget(null);

    this.histogram.fill(0);
    let sum = 0;
    for (let i = 0; i < this.width * this.height; i++) {
      const enc = this.pixels[i * 4] / 255;
      const logL = enc * METER_RANGE + METER_MIN_LOG;
      const lum = Math.pow(2, logL);
      const w = this.weights[i];
      sum += lum * w;
      const bin = Math.min(
        METER_BINS - 1,
        Math.max(0, Math.floor(((logL - METER_MIN_LOG) / METER_RANGE) * METER_BINS)),
      );
      this.histogram[bin] += w;
    }
    this.meanLuminance = Math.max(sum / this.weightSum, 1e-4);
    const ml = Math.log2(this.meanLuminance);
    this.meanBin = Math.min(
      METER_BINS - 1,
      Math.max(0, Math.floor(((ml - METER_MIN_LOG) / METER_RANGE) * METER_BINS)),
    );
  }
}
