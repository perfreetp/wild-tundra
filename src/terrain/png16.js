// 16 位灰度 PNG 编解码(浏览器 canvas 只支持 8 位,故手写容器层)
// zlib 压缩使用 fflate;支持解码 colorType=0(灰度)、bitDepth=8/16、全部 5 种过滤器
import { zlibSync, unzlibSync } from 'fflate';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** 把 Uint16Array(行优先,大端写入)编码为 16 位灰度 PNG */
export function encodeHeightmapPNG(width, height, u16) {
  const raw = new Uint8Array((width * 2 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 2 + 1);
    raw[row] = 0; // 过滤器 0 (None)
    for (let x = 0; x < width; x++) {
      const v = u16[y * width + x];
      raw[row + 1 + x * 2] = v >>> 8;
      raw[row + 2 + x * 2] = v & 0xff;
    }
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 16; // bitDepth
  ihdr[9] = 0;  // colorType: 灰度
  // [10] 压缩 [11] 过滤 [12] 隔行 均为 0
  const idat = zlibSync(raw);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', new Uint8Array(0))
  ];
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/**
 * 解码灰度 PNG。返回 { width, height, bitDepth, data }
 * bitDepth=16 时 data 为 Uint16Array,bitDepth=8 时为 Uint8Array。
 */
export function decodePNG(u8) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (u8[i] !== sig[i]) throw new Error('不是有效的 PNG 文件');
  }
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatParts = [];
  while (pos + 8 <= u8.length) {
    const dv = new DataView(u8.buffer, u8.byteOffset + pos);
    const len = dv.getUint32(0);
    const type = String.fromCharCode(u8[pos + 4], u8[pos + 5], u8[pos + 6], u8[pos + 7]);
    const data = u8.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = dv.getUint32(8);
      height = dv.getUint32(12);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (colorType !== 0) throw new Error('仅支持灰度 PNG(colorType=0)');
  if (bitDepth !== 16 && bitDepth !== 8) throw new Error('仅支持 8/16 位灰度 PNG');

  let total = 0;
  for (const p of idatParts) total += p.length;
  const idat = new Uint8Array(total);
  let o = 0;
  for (const p of idatParts) {
    idat.set(p, o);
    o += p.length;
  }
  const raw = unzlibSync(idat);

  const bpp = bitDepth === 16 ? 2 : 1;
  const stride = width * bpp;
  const out = new Uint8Array(width * height * bpp);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const lineOff = y * (stride + 1) + 1;
    const rowOff = y * stride;
    for (let x = 0; x < stride; x++) {
      const rawB = raw[lineOff + x];
      const a = x >= bpp ? out[rowOff + x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let pred;
      if (f === 0) pred = 0;
      else if (f === 1) pred = a;
      else if (f === 2) pred = b;
      else if (f === 3) pred = (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else {
        throw new Error('未知 PNG 过滤器 ' + f);
      }
      out[rowOff + x] = (rawB + pred) & 0xff;
    }
    prev = out.subarray(rowOff, rowOff + stride);
  }

  if (bitDepth === 16) {
    const data = new Uint16Array(width * height);
    for (let i = 0; i < data.length; i++) data[i] = (out[i * 2] << 8) | out[i * 2 + 1];
    return { width, height, bitDepth, data };
  }
  return { width, height, bitDepth, data: out };
}
