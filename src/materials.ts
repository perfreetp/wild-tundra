import type { MaterialDef, MaterialId, MaterialParamMap, WeatherDef, WeatherLevel } from './types';

/**
 * 八类材质体定义：反射率默认值参考常见地物近红外/905nm 波段漫反射率量级，
 * 面板可在 0.05–0.9 范围内实时调整。
 */
export const MATERIAL_DEFS: MaterialDef[] = [
  { id: 'asphalt',          label: '沥青路面',   color: 0x3a3d40, defaultReflectance: 0.12, defaultRoughness: 0.85 },
  { id: 'concrete',         label: '混凝土',     color: 0x9a958c, defaultReflectance: 0.35, defaultRoughness: 0.8  },
  { id: 'vehicleMetal',     label: '车身金属',   color: 0x2e6fb5, defaultReflectance: 0.45, defaultRoughness: 0.35 },
  { id: 'signMetal',        label: '路牌/标线',  color: 0xe8e4d8, defaultReflectance: 0.75, defaultRoughness: 0.45 },
  { id: 'glass',            label: '玻璃',       color: 0x8fc7d8, defaultReflectance: 0.1,  defaultRoughness: 0.08 },
  { id: 'plastic',          label: '塑料件',     color: 0xc25a3a, defaultReflectance: 0.25, defaultRoughness: 0.55 },
  { id: 'vegetation',       label: '植被',       color: 0x3f7a3a, defaultReflectance: 0.55, defaultRoughness: 0.9  },
  { id: 'guardrailMetal',   label: '护栏金属',   color: 0xb8bcc2, defaultReflectance: 0.6,  defaultRoughness: 0.25 },
];

export const MATERIAL_DEF_MAP: Record<MaterialId, MaterialDef> = Object.fromEntries(
  MATERIAL_DEFS.map((d) => [d.id, d]),
) as Record<MaterialId, MaterialDef>;

export function createDefaultMaterialParams(): MaterialParamMap {
  return Object.fromEntries(
    MATERIAL_DEFS.map((d) => [d.id, { reflectance: d.defaultReflectance, roughness: d.defaultRoughness }]),
  ) as MaterialParamMap;
}

/**
 * 雨雾档位。雾浓度三档分别对应消光系数 0.02 / 0.08 / 0.2 (1/m)，
 * 按 Beer–Lambert 定律 T = exp(-sigma * R) 衰减并随机丢点。
 */
export const WEATHER_DEFS: WeatherDef[] = [
  { id: 'clear',     label: '晴天',     extinction: 0,    dropout: 0    },
  { id: 'lightFog',  label: '轻雾 (σ=0.02)',  extinction: 0.02, dropout: 0.25 },
  { id: 'mediumFog', label: '中雾 (σ=0.08)',  extinction: 0.08, dropout: 0.5  },
  { id: 'heavyFog',  label: '浓雾 (σ=0.2)',   extinction: 0.2,  dropout: 0.75 },
];

export const WEATHER_MAP: Record<WeatherLevel, WeatherDef> = Object.fromEntries(
  WEATHER_DEFS.map((w) => [w.id, w]),
) as Record<WeatherLevel, WeatherDef>;
