import * as THREE from 'three';
import { MeshBasicNodeMaterial, PostProcessing, WebGPURenderer } from 'three/webgpu';
import {
  Fn, Loop, uniform, uniformArray, float, vec2, vec3, color,
  mix, clamp, smoothstep, exp, positionWorld, uv, time, pass, mx_noise_float
} from 'three/tsl';
import type { FireSource } from './field';

/**
 * 由当前热场构建 TSL 温度节点:在着色器内按片元世界坐标
 * 实时计算温度(与 CPU 端 ThermalField 同一解析模型)。
 */
function buildTemperatureNode(fires: FireSource[], ambient: number) {
  const posArr = uniformArray(fires.map((f) => f.position.clone()));
  const intArr = uniformArray(fires.map((f) => f.intensity));
  const radArr = uniformArray(fires.map((f) => f.radius));
  const count = fires.length;

  return Fn(() => {
    const t = float(ambient).toVar();
    Loop(count, ({ i }: { i: never }) => {
      const fp = posArr.element(i);
      const d = positionWorld.distance(fp);
      const r = radArr.element(i);
      // 火核高斯项
      const core = float(850).mul(exp(d.mul(d).div(r.mul(r)).negate()));
      // 辐射/对流平方衰减项
      const rad = intArr.element(i).mul(14).div(d.mul(d).add(0.4));
      // 高度修正:热烟气上浮
      const hBoost = positionWorld.y.sub(1.4).max(0).mul(0.55)
        .mul(positionWorld.distance(fp).mul(0.25).negate().exp()).add(1);
      t.addAssign(core.add(rad).mul(hBoost));
    });
    return t;
  })();
}

/** 铁红伪彩色映射(黑 → 紫红 → 橙 → 亮黄白) */
function infernoColor(tempNode: ReturnType<typeof buildTemperatureNode>, ambient: number) {
  const x = clamp(tempNode.sub(ambient).div(600), 0, 1).toVar();
  const c = mix(color(0x0a0a16), color(0x7a0a28), smoothstep(0.0, 0.35, x)).toVar();
  c.assign(mix(c, color(0xf98e09), smoothstep(0.3, 0.7, x)));
  c.assign(mix(c, color(0xfcffa4), smoothstep(0.65, 1.0, x)));
  return c;
}

/** 热成像模式材质:所有网格共用,按片元温度上伪彩色 */
export function buildThermalMaterial(fires: FireSource[], ambient: number): MeshBasicNodeMaterial {
  const tempNode = buildTemperatureNode(fires, ambient);
  const mat = new MeshBasicNodeMaterial();
  mat.colorNode = infernoColor(tempNode, ambient);
  mat.fog = true;
  return mat;
}

export interface PostPipeline {
  postProcessing: PostProcessing;
  /** 热浪扭曲强度(0 = 无扭曲),由 App 每帧按相机附近温度更新 */
  hazeStrength: { value: number };
  render: () => Promise<void>;
}

/**
 * 后处理管线:场景 pass → 靠近火源时的热浪 UV 扭曲。
 * 扭曲幅度由 uniform 驱动,噪声随时间滚动模拟热气上升。
 */
export function buildPostPipeline(
  renderer: WebGPURenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): PostPipeline {
  const postProcessing = new PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  const sceneColor = scenePass.getTextureNode() as unknown as {
    sample: (uvNode: unknown) => never;
  };

  const hazeStrength = uniform(0);
  const t = time.mul(2.2);
  // 两路不同频率/相位的噪声,叠加出上升气流的抖动感
  const n1 = mx_noise_float(vec3(uv().mul(vec2(36, 22)), t));
  const n2 = mx_noise_float(vec3(uv().mul(vec2(28, 44)).add(vec2(13.7, 7.1)), t.mul(1.4)));
  const distortedUV = uv().add(vec2(n1, n2).mul(hazeStrength));

  postProcessing.outputNode = sceneColor.sample(distortedUV);

  return {
    postProcessing,
    hazeStrength: hazeStrength as unknown as { value: number },
    render: () => postProcessing.renderAsync()
  };
}
