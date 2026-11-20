import {
  CanvasTexture,
  LinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from 'three';
import { fbm2D, valueNoise2D } from '../core/math';

function createCanvas(width: number, height = width): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 2D 画布上下文');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, repeat = 1, srgb = true): Texture {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 4;
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function fastHash2(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function fastNoise2D(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = fastHash2(xi + seed * 977, yi + seed * 131);
  const b = fastHash2(xi + 1 + seed * 977, yi + seed * 131);
  const c = fastHash2(xi + seed * 977, yi + 1 + seed * 131);
  const d = fastHash2(xi + 1 + seed * 977, yi + 1 + seed * 131);
  const top = a + (b - a) * u;
  const bottom = c + (d - c) * u;
  return top + (bottom - top) * v;
}

function fastFbm(x: number, y: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += fastNoise2D(x * freq, y * freq, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

function writeTextureFromPixels(
  draw: (data: Uint8ClampedArray, width: number, height: number) => void,
  size: number,
  repeat: number,
  srgb = true,
): Texture {
  const { canvas, ctx } = createCanvas(size);
  const image = ctx.createImageData(size, size);
  draw(image.data, size, size);
  ctx.putImageData(image, 0, 0);
  return toTexture(canvas, repeat, srgb);
}

/** 云层纹理：RGB 为云色，A 为云量。 */
export function createCloudTexture(): Texture {
  const texture = writeTextureFromPixels(
    (data, size) => {
      const scale = 5.5;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const u = (x / size) * scale;
          const v = (y / size) * scale;
          const base = fastFbm(u, v, 5, 3);
          const detail = fastFbm(u * 3.1 + 11, v * 3.1 + 7, 4, 9);
          let d = base * 0.78 + detail * 0.22;
          d = Math.max(0, (d - 0.46) / 0.4);
          const puffy = Math.pow(d, 1.5);
          const alpha = Math.min(1, Math.max(0, (puffy - 0.18) / 0.55));
          const i = (y * size + x) * 4;
          const shade = 226 + Math.round(28 * Math.min(1, puffy * 1.4));
          data[i] = shade;
          data[i + 1] = shade;
          data[i + 2] = Math.min(255, shade + 6);
          data[i + 3] = Math.round(alpha * 255);
        }
      }
    },
    512,
    1,
  );
  texture.name = 'clouds';
  return texture;
}

/** 地面细节：轻微噪点，作为 map 与颜色相乘。 */
export function createGroundDetailTexture(): Texture {
  const texture = writeTextureFromPixels(
    (data, size) => {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const n = valueNoise2D(x / size * 22, y / size * 22, 5) * 0.5 + valueNoise2D(x / size * 70, y / size * 70, 11) * 0.5;
          const v = Math.round(180 + (n - 0.5) * 90);
          const i = (y * size + x) * 4;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = Math.round(v * 0.98);
          data[i + 3] = 255;
        }
      }
    },
    256,
    1,
  );
  texture.name = 'ground-detail';
  return texture;
}

/** 道砟纹理：碎石颗粒。 */
export function createBallastTexture(): Texture {
  const texture = writeTextureFromPixels(
    (data, size) => {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const cx = Math.floor(x / 4);
          const cy = Math.floor(y / 4);
          const h = fastHash2(cx, cy);
          const edge = fastHash2(cx + 97, cy + 31);
          const grain = valueNoise2D(x / 10, y / 10, 3) * 0.4;
          const v = 82 + h * 92 + edge * 22 + grain * 22;
          const i = (y * size + x) * 4;
          data[i] = Math.min(255, v * 1.02);
          data[i + 1] = Math.min(255, v * 0.99);
          data[i + 2] = Math.min(255, v * 0.93);
          data[i + 3] = 255;
        }
      }
    },
    256,
    1,
  );
  texture.name = 'ballast';
  return texture;
}

/** 混凝土纹理：轨枕 / 站台。 */
export function createConcreteTexture(): Texture {
  const texture = writeTextureFromPixels(
    (data, size) => {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const n = fbm2D(x / size * 9, y / size * 9, 4, 7) * 0.6 + valueNoise2D(x / 2, y / 2, 5) * 0.4;
          const v = Math.round(168 + (n - 0.5) * 60);
          const i = (y * size + x) * 4;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 255;
        }
      }
    },
    128,
    1,
  );
  texture.name = 'concrete';
  return texture;
}

export interface TextureSet {
  clouds: Texture;
  ground: Texture;
  ballast: Texture;
  concrete: Texture;
}

let cached: TextureSet | null = null;

export function getTextures(): TextureSet {
  if (!cached) {
    cached = {
      clouds: createCloudTexture(),
      ground: createGroundDetailTexture(),
      ballast: createBallastTexture(),
      concrete: createConcreteTexture(),
    };
  }
  return cached;
}
