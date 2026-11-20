import * as THREE from 'three';
import { BAND_COUNT } from '../lib/scheme';

/**
 * 管网自定义着色：
 * 压力/温度 -> 8 级色带档位（逐顶点），泄漏半径场红色扩散梯度，
 * 超阈值管段脉冲高亮，简易 Lambert + Fresnel 边缘光。
 */
export const PIPE_VERT = /* glsl */ `
attribute float aPressure;
attribute float aTemp;
attribute float aPipeId;
attribute float aNodeId;
attribute float aLeakD;
attribute float aLeakC;
attribute float aOver;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vPressure;
varying float vTemp;
varying float vLeakD;
varying float vLeakC;
varying float vOver;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  vPressure = aPressure;
  vTemp = aTemp;
  vLeakD = aLeakD;
  vLeakC = aLeakC;
  vOver = aOver;
  gl_Position = projectionMatrix * mv;
}
`;

export const PIPE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uBands[${BAND_COUNT}];
uniform float uBounds[${BAND_COUNT}];
uniform int uMode; // 0 压力 1 温度
uniform float uTime;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vPressure;
varying float vTemp;
varying float vLeakD;
varying float vLeakC;
varying float vOver;

int bandIndex(float value) {
  int idx = 0;
  for (int i = 0; i < ${BAND_COUNT}; i++) {
    if (value >= uBounds[i]) idx = i;
  }
  return idx;
}

void main() {
  float value = uMode == 0 ? vPressure : vTemp;
  int bi = bandIndex(value);
  vec3 base = uBands[0];
  for (int i = 0; i < ${BAND_COUNT}; i++) {
    if (i == bi) base = uBands[i];
  }

  // 泄漏半径场：距离越近覆盖越强，边缘梯度衰减
  float leakGlow = vLeakC * exp(-vLeakD * vLeakD * 0.012);

  // 超阈值脉冲
  float pulse = 0.5 + 0.5 * sin(uTime * 4.0);
  float overMix = vOver * (0.35 + 0.35 * pulse);

  // 简易 Lambert + Fresnel
  vec3 lightDir = normalize(vec3(0.45, 0.8, 0.6));
  float lambert = max(dot(normalize(vNormal), lightDir), 0.0);
  float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.5);
  vec3 shaded = base * (0.45 + 0.65 * lambert) + vec3(0.12) * fres;

  shaded = mix(shaded, vec3(1.0, 0.25, 0.18), overMix);
  shaded = mix(shaded, vec3(1.0, 0.05, 0.02), clamp(leakGlow, 0.0, 0.85));

  gl_FragColor = vec4(shaded, uOpacity);
}
`;

export interface PipeMaterialUniforms {
  uBands: { value: THREE.Vector3[] };
  uBounds: { value: number[] };
  uMode: { value: number };
  uTime: { value: number };
  uOpacity: { value: number };
}

export function createPipeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: PIPE_VERT,
    fragmentShader: PIPE_FRAG,
    uniforms: {
      uBands: {
        value: Array.from({ length: BAND_COUNT }, () => new THREE.Vector3()),
      },
      uBounds: { value: new Array(BAND_COUNT).fill(0) },
      uMode: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    },
    side: THREE.FrontSide,
  });
}

const _color = new THREE.Color();
export function applySchemeToMaterial(
  mat: THREE.ShaderMaterial,
  bands: { min: number; color: string }[],
  mode: 'pressure' | 'temperature',
) {
  const u = mat.uniforms as unknown as PipeMaterialUniforms;
  // 档位按阈值升序排列，避免手工编辑后乱序导致着色错误
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  for (let i = 0; i < BAND_COUNT; i++) {
    const b = sorted[Math.min(i, sorted.length - 1)];
    _color.set(b.color);
    u.uBands.value[i].set(_color.r, _color.g, _color.b);
    u.uBounds.value[i] = b.min;
  }
  u.uMode.value = mode === 'pressure' ? 0 : 1;
}
