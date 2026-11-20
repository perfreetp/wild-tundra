import { Color, Vector3 } from 'three';
import { temperatureTint, type RGB } from '../core/color';
import { clamp, lerp } from '../core/math';

export interface Palette {
  zenith: Color;
  horizon: Color;
  ground: Color;
  sun: Color;
  fog: Color;
  hemiSky: Color;
  hemiGround: Color;
  sunDir: Vector3;
  sunIntensity: number;
  hemiIntensity: number;
  cloudCover: number;
  exposure: number;
  night: number;
  tint: RGB;
}

const DAY = {
  zenith: '#1d4e92',
  horizon: '#b9d1e6',
  ground: '#b9c7cf',
  sun: '#fff2d8',
  fog: '#c3d2dd',
  hemiSky: '#cfdcea',
  hemiGround: '#6f6a54',
};

const NIGHT = {
  zenith: '#0a1630',
  horizon: '#22304d',
  ground: '#141c2c',
  sun: '#c3d2ff',
  fog: '#1b2740',
  hemiSky: '#2a3c61',
  hemiGround: '#0d1220',
};

const dayCache = {
  zenith: new Color(DAY.zenith),
  horizon: new Color(DAY.horizon),
  ground: new Color(DAY.ground),
  sun: new Color(DAY.sun),
  fog: new Color(DAY.fog),
  hemiSky: new Color(DAY.hemiSky),
  hemiGround: new Color(DAY.hemiGround),
};

const nightCache = {
  zenith: new Color(NIGHT.zenith),
  horizon: new Color(NIGHT.horizon),
  ground: new Color(NIGHT.ground),
  sun: new Color(NIGHT.sun),
  fog: new Color(NIGHT.fog),
  hemiSky: new Color(NIGHT.hemiSky),
  hemiGround: new Color(NIGHT.hemiGround),
};

const tmpTint = new Color();
const tmpSkyMix = new Color(1, 1, 1);

export function buildPalette(colorTemp: number, night: number, out?: Palette): Palette {
  const n = clamp(night, 0, 1);
  const tint = temperatureTint(colorTemp);
  const palette: Palette = out ?? {
    zenith: new Color(),
    horizon: new Color(),
    ground: new Color(),
    sun: new Color(),
    fog: new Color(),
    hemiSky: new Color(),
    hemiGround: new Color(),
    sunDir: new Vector3(),
    sunIntensity: 0,
    hemiIntensity: 0,
    cloudCover: 0,
    exposure: 1,
    night: 0,
    tint,
  };

  palette.zenith.copy(dayCache.zenith).lerp(nightCache.zenith, n);
  palette.horizon.copy(dayCache.horizon).lerp(nightCache.horizon, n);
  palette.ground.copy(dayCache.ground).lerp(nightCache.ground, n);
  palette.sun.copy(dayCache.sun).lerp(nightCache.sun, n);
  palette.fog.copy(dayCache.fog).lerp(nightCache.fog, n);
  palette.hemiSky.copy(dayCache.hemiSky).lerp(nightCache.hemiSky, n);
  palette.hemiGround.copy(dayCache.hemiGround).lerp(nightCache.hemiGround, n);

  // 色温：天顶保持「天空蓝」，地平线/雾/光照明显偏色
  tmpTint.setRGB(tint[0], tint[1], tint[2]);
  tmpSkyMix.setRGB(lerp(1, tint[0], 0.1), lerp(1, tint[1], 0.1), lerp(1, tint[2], 0.1));
  palette.zenith.multiply(tmpSkyMix);
  tmpSkyMix.setRGB(lerp(1, tint[0], 0.55), lerp(1, tint[1], 0.55), lerp(1, tint[2], 0.55));
  palette.horizon.multiply(tmpSkyMix);
  palette.fog.multiply(tmpSkyMix);
  palette.sun.multiply(tmpTint);
  palette.hemiSky.multiply(tmpTint);
  palette.ground.multiply(tmpTint);

  // 昼夜环境光强度
  palette.sunIntensity = lerp(2.45, 1.15, n);
  palette.hemiIntensity = lerp(1.05, 0.62, n);
  palette.cloudCover = lerp(0.44, 0.22, n);
  palette.exposure = lerp(1.0, 1.2, n);
  palette.night = n;
  palette.tint = tint;

  // 太阳/月亮方向（方位角相对 -Z）
  const elevation = lerp(30, 42, n) * (Math.PI / 180);
  const azimuth = lerp(-26, 34, n) * (Math.PI / 180);
  const cosEl = Math.cos(elevation);
  palette.sunDir.set(Math.sin(azimuth) * cosEl, Math.sin(elevation), -Math.cos(azimuth) * cosEl).normalize();

  return palette;
}

export function applyTintToColor(color: Color, tint: RGB, amount: number): Color {
  return color.setRGB(
    lerp(color.r, color.r * tint[0], amount),
    lerp(color.g, color.g * tint[1], amount),
    lerp(color.b, color.b * tint[2], amount),
  );
}
