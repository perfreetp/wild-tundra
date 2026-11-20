import * as THREE from 'three';

/** 火源定义 */
export interface FireSource {
  /** 位置(地面处, y 取 0 附近) */
  position: THREE.Vector3;
  /** 热释放速率量级 kW,影响辐射与对流升温 */
  intensity: number;
  /** 火核半径 m */
  radius: number;
  /** 产烟系数 */
  smoke: number;
}

export interface FireSourceDTO {
  position: [number, number, number];
  intensity: number;
  radius: number;
  smoke: number;
}

const CEILING = 3.0;

/**
 * 热场 / 烟气场解析模型。
 * 温度 = 环境温度 + Σ(火核高斯项 + 辐射/对流衰减项) × 高度修正(热烟气上浮)
 * 烟气浓度 = Σ 产烟系数 × 水平高斯衰减 × 垂直分层(积聚于顶棚)
 */
export class ThermalField {
  ambient = 20;
  fires: FireSource[] = [];

  static defaultFires(): FireSource[] {
    return [
      { position: new THREE.Vector3(-7, 0.2, -3), intensity: 900, radius: 0.9, smoke: 1.0 },
      { position: new THREE.Vector3(7, 0.2, 3.5), intensity: 550, radius: 0.7, smoke: 0.8 },
      { position: new THREE.Vector3(0.5, 0.2, 4), intensity: 260, radius: 0.5, smoke: 0.5 }
    ];
  }

  /** 当前位置温度 °C */
  temperatureAt(p: THREE.Vector3): number {
    let t = this.ambient;
    for (const f of this.fires) {
      const dx = p.x - f.position.x;
      const dz = p.z - f.position.z;
      const dHoriz2 = dx * dx + dz * dz;
      const d = Math.sqrt(dHoriz2 + (p.y - f.position.y) ** 2);
      // 火核:高温高斯核
      const core = 850 * Math.exp(-(d * d) / (f.radius * f.radius));
      // 辐射 + 对流:近似平方衰减
      const rad = (f.intensity * 14) / (d * d + 0.4);
      // 热烟气上浮:越高越热,且水平远离火源后主要由顶棚热烟气层贡献
      const heightBoost = 1 + Math.max(0, p.y - 1.4) * 0.55 * Math.exp(-Math.sqrt(dHoriz2) * 0.25);
      t += (core + rad) * heightBoost;
    }
    return t;
  }

  /** 烟气浓度(相对值, 0 = 无烟) */
  smokeAt(p: THREE.Vector3): number {
    let s = 0;
    for (const f of this.fires) {
      const dx = p.x - f.position.x;
      const dz = p.z - f.position.z;
      const dHoriz2 = dx * dx + dz * dz;
      // 水平扩散
      const spread = Math.exp(-dHoriz2 / 30);
      // 垂直分层:1.2m 以下较清晰,向上烟气快速增浓
      const layer = 0.22 + 0.78 * smoothstep(1.0, CEILING - 0.2, p.y);
      s += f.smoke * spread * layer;
    }
    return s;
  }

  /** 能见度 m(由烟气浓度换算) */
  visibilityAt(p: THREE.Vector3): number {
    const s = this.smokeAt(p);
    return clamp(6 / (s + 0.04), 0.4, 80);
  }

  /** 热辐射通量 kW/m²(点源叠加,按 4πd² 衰减) */
  heatFluxAt(p: THREE.Vector3): number {
    let q = 0;
    for (const f of this.fires) {
      const d = Math.max(0.3, p.distanceTo(f.position));
      q += f.intensity / (4 * Math.PI * d * d);
    }
    return q;
  }

  toJSON(): { ambient: number; fires: FireSourceDTO[] } {
    return {
      ambient: this.ambient,
      fires: this.fires.map((f) => ({
        position: [f.position.x, f.position.y, f.position.z],
        intensity: f.intensity,
        radius: f.radius,
        smoke: f.smoke
      }))
    };
  }

  static fromJSON(data: { ambient?: number; fires?: FireSourceDTO[] }): ThermalField {
    const field = new ThermalField();
    if (typeof data.ambient === 'number') field.ambient = data.ambient;
    if (Array.isArray(data.fires) && data.fires.length > 0) {
      field.fires = data.fires.map((f) => ({
        position: new THREE.Vector3(f.position[0], f.position[1], f.position[2]),
        intensity: f.intensity,
        radius: f.radius,
        smoke: f.smoke
      }));
    } else {
      field.fires = ThermalField.defaultFires();
    }
    return field;
  }
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
