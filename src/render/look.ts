import { Color, Vector3 } from 'three';

/**
 * 图层观感：所有图层都用 MeshBasicMaterial 直出「美术化」画面，
 * 通过夜间压暗、色温白平衡、大气透视三件事统一调色。
 */
export interface LayerLook {
  night: number;
  nightColor: Color;
  tint: readonly [number, number, number];
  haze: number;
  fogColor: Color;
}

export function computeLookColor(base: Color, look: LayerLook, hazeBoost = 1, out = new Color()): Color {
  out.copy(base).lerp(look.nightColor, look.night);
  out.setRGB(out.r * look.tint[0], out.g * look.tint[1], out.b * look.tint[2]);
  // 静态大气透视：只轻微向雾色靠拢，动态距离雾由合成通道负责
  if (look.haze > 0) out.lerp(look.fogColor, Math.min(0.5, look.haze * hazeBoost * 0.34));
  return out;
}

/** 便捷构造线性空间颜色 */
export function rgb(r: number, g: number, b: number): Color {
  return new Color(r, g, b);
}

interface Binding {
  material: { color: Color };
  base: Color;
  hazeBoost: number;
  /** 是否随色温变化（自发光物体不跟随） */
  tint: boolean;
}

/** 收集图层内需要调色的材质，调色板变化时统一重算，避免重建几何体 */
export class LookBinder {
  private bindings: Binding[] = [];

  bind<M extends { color: Color }>(material: M, base: Color, hazeBoost = 1, tint = true): M {
    this.bindings.push({ material, base: base.clone(), hazeBoost, tint });
    return material;
  }

  /**
   * 应用观感。图层使用 Lambert 材质时，昼夜由灯光负责（night 传 0），
   * 这里只做色温白平衡与静态大气透视。
   */
  apply(look: LayerLook): void {
    for (const b of this.bindings) {
      const effective: LayerLook = {
        night: 0,
        nightColor: look.nightColor,
        tint: b.tint ? look.tint : [1, 1, 1],
        haze: look.haze,
        fogColor: look.fogColor,
      };
      computeLookColor(b.base, effective, b.hazeBoost, b.material.color);
    }
  }

  dispose(): void {
    this.bindings = [];
  }
}

export type SunDir = Vector3;
