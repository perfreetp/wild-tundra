import {
  Color,
  type Texture,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedIntType,
  WebGLRenderTarget,
  type Camera,
  type PerspectiveCamera,
  type WebGLRenderer,
} from 'three';
import { Pass } from 'postprocessing';
import type { IUniform } from 'three';

const compositeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const compositeFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D inputBuffer;
  uniform sampler2D layerBuffer;
  uniform sampler2D layerDepth;
  uniform float opacity;
  uniform int blendMode;
  uniform float fogDistance;
  uniform float fogPower;
  uniform float fogAmount;
  uniform vec3 fogColor;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform float nightHaze;

  varying vec2 vUv;

  float sceneDistance(vec2 uv) {
    float depth = texture2D(layerDepth, uv).r;
    if (depth >= 0.99999) return 1e7;
    float viewZ = (cameraNear * cameraFar) / ((cameraFar - cameraNear) * depth - cameraFar);
    return max(-viewZ, 0.0);
  }

  vec3 overlayBlend(vec3 base, vec3 top) {
    vec3 a = 2.0 * top * base;
    vec3 b = 1.0 - 2.0 * (1.0 - top) * (1.0 - base);
    return mix(a, b, step(0.5, base));
  }

  void main() {
    vec4 base = texture2D(inputBuffer, vUv);
    vec4 layer = texture2D(layerBuffer, vUv);

    float dist = sceneDistance(vUv);
    // 距离雾：先算该距离上的「雾化比例」，再乘以滑条强度；
    // fogAmount=0 时完全没有雾，=1 时远景几乎全被雾吞没。
    float depthFog = 1.0 - exp(-pow(dist / max(fogDistance, 1.0), fogPower));
    float fog = clamp(depthFog, 0.0, 1.0) * fogAmount * nightHaze;

    vec3 src = mix(layer.rgb, fogColor, fog);
    float alpha = clamp(layer.a * opacity, 0.0, 1.0);

    vec3 result;
    if (blendMode == 2) {
      result = mix(base.rgb, base.rgb + src - base.rgb * src, alpha);
    } else if (blendMode == 1) {
      result = mix(base.rgb, overlayBlend(base.rgb, src), alpha);
    } else {
      result = mix(base.rgb, src, alpha);
    }

    gl_FragColor = vec4(max(result, vec3(0.0)), 1.0);
  }
`;

interface CompositeUniforms {
  inputBuffer: IUniform<Texture | null>;
  layerBuffer: IUniform<Texture | null>;
  layerDepth: IUniform<Texture | null>;
  opacity: IUniform<number>;
  blendMode: IUniform<number>;
  fogDistance: IUniform<number>;
  fogPower: IUniform<number>;
  fogAmount: IUniform<number>;
  fogColor: IUniform<Color>;
  cameraNear: IUniform<number>;
  cameraFar: IUniform<number>;
  nightHaze: IUniform<number>;
}

export interface LayerPassOptions {
  scene: Scene;
  order: number;
  scale: number;
}

/**
 * 单个视景图层的合成通道：
 *  1. 将该图层场景渲染到独立颜色/深度目标（透明背景）
 *  2. 以全屏通道读取上一通道结果 + 本层颜色/深度，按透明度与混合模式叠加
 *
 * 这个类正是「用 postprocessing 合成通道串联图层」的载体：
 * EffectComposer 依次执行 far → mid → near 三个 LayerPass，即可得到合成画面。
 */
export class LayerPass extends Pass {
  readonly id: string;
  opacity = 1;
  blendMode: 0 | 1 | 2 = 0;
  fogDistance = 6000;
  fogPower = 1.35;
  fogAmount = 0;
  nightHaze = 1;
  readonly fogColor = new Color(0.7, 0.76, 0.82);

  private readonly layerScene: Scene;
  private readonly viewCamera: PerspectiveCamera;
  private readonly target: WebGLRenderTarget;
  private readonly depthTexture: DepthTexture;
  private readonly quad: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly uniforms: CompositeUniforms;
  private readonly quadScene = new Scene();
  private readonly quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private scale: number;

  constructor(id: string, layerScene: Scene, camera: PerspectiveCamera, scale = 1) {
    super(`LayerPass:${id}`);
    this.id = id;
    this.layerScene = layerScene;
    this.viewCamera = camera;
    this.scale = scale;
    this.needsSwap = true;

    this.depthTexture = new DepthTexture(1, 1, UnsignedIntType);
    this.depthTexture.minFilter = NearestFilter;
    this.depthTexture.magFilter = NearestFilter;
    this.depthTexture.name = `LayerDepth:${id}`;
    this.target = new WebGLRenderTarget(1, 1, {
      depthBuffer: true,
      depthTexture: this.depthTexture,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: HalfFloatType,
    });
    this.target.texture.name = `LayerColor:${id}`;

    this.uniforms = {
      inputBuffer: { value: null },
      layerBuffer: { value: this.target.texture },
      layerDepth: { value: this.depthTexture },
      opacity: { value: 1 },
      blendMode: { value: 0 },
      fogDistance: { value: 6000 },
      fogPower: { value: 1.35 },
      fogAmount: { value: 0 },
      fogColor: { value: new Color(0.7, 0.76, 0.82) },
      cameraNear: { value: 0.5 },
      cameraFar: { value: 26000 },
      nightHaze: { value: 1 },
    };

    const material = new ShaderMaterial({
      uniforms: this.uniforms as unknown as { [uniform: string]: IUniform },
      vertexShader: compositeVertex,
      fragmentShader: compositeFragment,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    this.quad = new Mesh(new PlaneGeometry(2, 2), material);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  get sceneRef(): Scene {
    return this.layerScene;
  }

  override setSize(width: number, height: number): void {
    const w = Math.max(1, Math.round(width * this.scale));
    const h = Math.max(1, Math.round(height * this.scale));
    this.target.setSize(w, h);
    this.depthTexture.image.width = w;
    this.depthTexture.image.height = h;
    this.depthTexture.needsUpdate = true;
    this.uniforms.cameraNear.value = this.viewCamera.near;
    this.uniforms.cameraFar.value = this.viewCamera.far;
  }

  setScale(scale: number, width: number, height: number): void {
    this.scale = scale;
    this.setSize(width, height);
  }

  syncUniforms(): void {
    const u = this.uniforms;
    u.opacity.value = this.opacity;
    u.blendMode.value = this.blendMode;
    u.fogDistance.value = this.fogDistance;
    u.fogPower.value = this.fogPower;
    u.fogAmount.value = this.fogAmount;
    u.fogColor.value.copy(this.fogColor);
    u.nightHaze.value = this.nightHaze;
    u.cameraNear.value = this.viewCamera.near;
    u.cameraFar.value = this.viewCamera.far;
  }

  override render(
    renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget | null,
    outputBuffer: WebGLRenderTarget | null,
  ): void {
    // 1. 把本图层渲染到独立目标
    const prevColor = renderer.getClearColor(new Color());
    const prevAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(this.target);
    renderer.clear(true, true, false);
    renderer.render(this.layerScene, this.viewCamera);
    renderer.setClearColor(prevColor, prevAlpha);

    // 2. 合成到通道输出
    this.syncUniforms();
    const u = this.uniforms;
    u.inputBuffer.value = inputBuffer ? inputBuffer.texture : null;
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
    renderer.render(this.quadScene, this.quadCamera);
  }

  override dispose(): void {
    this.target.dispose();
    this.depthTexture.dispose();
    this.quad.geometry.dispose();
    this.quad.material.dispose();
  }

  /** 供外部调试 */
  get depth(): DepthTexture {
    return this.depthTexture;
  }

  get cameraForDepth(): Camera {
    return this.viewCamera;
  }
}
