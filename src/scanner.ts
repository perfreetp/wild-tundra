import * as THREE from 'three';
import type { CityScene } from './scene';
import { WEATHER_MAP } from './materials';
import {
  HIGHLIGHT_COS_THRESHOLD,
  HIGHLIGHT_INTENSITY_THRESHOLD,
  type MaterialId,
  type MaterialParamMap,
  type PointRecord,
  type ScanConfig,
  type WeatherLevel,
} from './types';

/** 强度归一化参考距离（m）：该距离处距离衰减项为 1 */
const RANGE_REF = 20;
/** 距离平方衰减软拐点，避免极近距离发散 */
const RANGE_KNEE = 2;

/** 确定性哈希随机数：同一条射线在任意参数下丢点结果稳定，避免闪烁 */
function hash01(a: number): number {
  let h = (a * 374761393 + 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

export interface ScanStats {
  rayCount: number;
  hitCount: number;
  fogDropped: number;
  outOfRange: number;
  elapsedMs: number;
}

export interface ScanResult {
  points: PointRecord[];
  stats: ScanStats;
}

/** 依据线束数与水平角分辨率生成的射线方向表（单位向量，世界系） */
export function buildRayDirections(config: ScanConfig): THREE.Vector3[] {
  const dirs: THREE.Vector3[] = [];
  const azCount = Math.max(1, Math.round(360 / config.horizontalResolutionDeg));
  const top = THREE.MathUtils.degToRad(config.vfovTopDeg);
  const bottom = THREE.MathUtils.degToRad(config.vfovBottomDeg);

  for (let c = 0; c < config.channels; c++) {
    const v = config.channels === 1 ? 0.5 : c / (config.channels - 1);
    const elev = top + (bottom - top) * v;
    const cosE = Math.cos(elev);
    const sinE = Math.sin(elev);
    for (let a = 0; a < azCount; a++) {
      const az = (a / azCount) * Math.PI * 2;
      dirs.push(new THREE.Vector3(
        Math.cos(az) * cosE,
        sinE,
        Math.sin(az) * cosE,
      ));
    }
  }
  return dirs;
}

/**
 * 回波强度合成：
 *   I_raw = rho * ( cosθ·漫反射项 + 近镜面项 + 掠射 Fresnel 补偿 ) * 距离平方衰减
 *   I     = I_raw * Beer–Lambert 雾衰减
 * 粗糙度越小，近镜面回波越尖锐。
 */
function computeRawIntensity(
  cosI: number,
  params: { reflectance: number; roughness: number },
  range: number,
): number {
  const diffuse = cosI;
  const sharpness = 4 + 28 * (1 - params.roughness);
  const specular = (1 - params.roughness) * 0.6 * Math.pow(cosI, sharpness);
  const fresnel = 0.15 * Math.pow(1 - cosI, 2);

  const surface = params.reflectance * (diffuse + specular + fresnel);
  const rangeAttenuation = (RANGE_REF * RANGE_REF) / (Math.max(range, RANGE_KNEE) ** 2);
  return surface * rangeAttenuation;
}

const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;

const hitPoint = new THREE.Vector3();
const worldNormal = new THREE.Vector3();
const localNormal = new THREE.Vector3();
const tmpNormalMatrix = new THREE.Matrix3();

/**
 * 对场景执行一次完整扫描（分块 await，避免阻塞 UI）。
 * 材质参数变化时只需重跑本函数，BVH 与射线方向可复用。
 */
export async function runScan(
  city: CityScene,
  dirs: THREE.Vector3[],
  config: ScanConfig,
  materials: MaterialParamMap,
  weather: WeatherLevel,
  onProgress?: (fraction: number) => void,
): Promise<ScanResult> {
  const t0 = performance.now();
  const weatherDef = WEATHER_MAP[weather];
  const origin = city.sensorPosition;
  const points: PointRecord[] = [];
  let fogDropped = 0;
  let outOfRange = 0;

  const CHUNK = 3000;
  for (let start = 0; start < dirs.length; start += CHUNK) {
    const end = Math.min(start + CHUNK, dirs.length);
    for (let i = start; i < end; i++) {
      const dir = dirs[i];
      raycaster.set(origin, dir);
      raycaster.far = config.maxRange;
      const hits = raycaster.intersectObjects(city.raycastTargets, false);

      if (hits.length === 0) {
        // 无命中：可能超量程，也可能射向天空，统一计入未命中统计
        if (hash01(i) > 0.5) outOfRange++;
        continue;
      }
      const hit = hits[0];
      const mesh = hit.object as THREE.Mesh;
      const materialId = mesh.userData.materialId as MaterialId;
      const range = hit.distance;

      if (range > config.maxRange) {
        outOfRange++;
        continue;
      }

      // 世界系法线：面法线与顶点法线各取一半，兼顾硬边与曲面
      const face = hit.face;
      if (!face) {
        worldNormal.set(0, 1, 0);
      } else {
        worldNormal.copy(face.normal).transformDirection(mesh.matrixWorld).normalize();
        const normalAttr = mesh.geometry.getAttribute('normal');
        if (normalAttr) {
          localNormal.fromBufferAttribute(normalAttr, face.a);
          localNormal
            .applyNormalMatrix(tmpNormalMatrix.getNormalMatrix(mesh.matrixWorld))
            .normalize();
          worldNormal.lerp(localNormal, 0.5).normalize();
        }
      }

      // 入射角余弦：射线方向与法线反向的夹角
      const cosI = THREE.MathUtils.clamp(-dir.dot(worldNormal), 0, 1);
      const params = materials[materialId];
      let intensity = computeRawIntensity(cosI, params, range);

      // 雨雾：Beer–Lambert 衰减 + 随机丢点（点云变稀）
      if (weatherDef.extinction > 0) {
        const transmission = Math.exp(-weatherDef.extinction * range);
        intensity *= transmission;
        if (hash01(i ^ 0x9e3779b9) < weatherDef.dropout * (1 - transmission)) {
          fogDropped++;
          continue;
        }
      }
      intensity = THREE.MathUtils.clamp(intensity, 0, 1);

      hitPoint.copy(hit.point);

      const highlight =
        cosI >= HIGHLIGHT_COS_THRESHOLD && intensity >= HIGHLIGHT_INTENSITY_THRESHOLD;

      points.push({
        x: hitPoint.x,
        y: hitPoint.y,
        z: hitPoint.z,
        intensity,
        material: materialId,
        range,
        cosIncidence: cosI,
        highlight,
      });
    }
    onProgress?.(end / dirs.length);
    // 让出主线程，面板动画不卡死
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return {
    points,
    stats: {
      rayCount: dirs.length,
      hitCount: points.length,
      fogDropped,
      outOfRange,
      elapsedMs: performance.now() - t0,
    },
  };
}
