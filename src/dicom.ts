import * as dicomParser from 'dicom-parser';
import type { VolumeData } from './types';

interface SliceInfo {
  rows: number;
  cols: number;
  z: number;
  instance: number;
  slope: number;
  intercept: number;
  pixels: Int16Array | Uint16Array;
  spacingXY: [number, number];
  windowCenter?: number;
  windowWidth?: number;
}

function parseOne(buffer: ArrayBuffer): SliceInfo {
  const byteArray = new Uint8Array(buffer);
  const ds = dicomParser.parseDicom(byteArray);

  // 仅支持未压缩的传输语法
  const ts = ds.string('x00020010');
  if (
    ts &&
    ts !== '1.2.840.10008.1.2' &&
    ts !== '1.2.840.10008.1.2.1' &&
    ts !== '1.2.840.10008.1.2.2'
  ) {
    throw new Error(`不支持的压缩传输语法: ${ts}（仅支持未压缩 DICOM）`);
  }

  const rows = ds.uint16('x00280010');
  const cols = ds.uint16('x00280011');
  if (!rows || !cols) throw new Error('缺少 Rows/Columns 标签');

  const bitsAllocated = ds.uint16('x00280100') ?? 16;
  const pixelRepresentation = ds.uint16('x00280103') ?? 0;
  const slope = parseFloat(ds.string('x00281053') ?? '1') || 1;
  const intercept = parseFloat(ds.string('x00281052') ?? '0') || 0;

  const el = ds.elements.x7fe00010;
  if (!el) throw new Error('缺少 PixelData (7FE0,0010)');
  if (el.encapsulatedPixelData) throw new Error('封装（压缩）像素数据暂不支持');

  let pixels: Int16Array | Uint16Array;
  if (bitsAllocated === 16) {
    pixels = pixelRepresentation === 1
      ? new Int16Array(ds.byteArray.buffer, el.dataOffset, rows * cols)
      : new Uint16Array(ds.byteArray.buffer, el.dataOffset, rows * cols);
  } else if (bitsAllocated === 8) {
    pixels = new Uint8Array(ds.byteArray.buffer, el.dataOffset, rows * cols) as unknown as Uint16Array;
  } else {
    throw new Error(`不支持的 BitsAllocated: ${bitsAllocated}`);
  }

  const ipp = ds.string('x00200032')?.split('\\').map(Number);
  const z = ipp && ipp.length === 3 ? ipp[2] : NaN;
  const instance = parseInt(ds.string('x00200013') ?? '0', 10) || 0;

  const ps = ds.string('x00280030')?.split('\\').map(Number);
  const spacingXY: [number, number] =
    ps && ps.length === 2 && ps[0] > 0 && ps[1] > 0 ? [ps[1], ps[0]] : [1, 1];

  const wc = parseFloat(ds.string('x00281050') ?? '');
  const ww = parseFloat(ds.string('x00281051') ?? '');

  return {
    rows, cols, z, instance, slope, intercept, pixels, spacingXY,
    windowCenter: Number.isFinite(wc) ? wc : undefined,
    windowWidth: Number.isFinite(ww) ? ww : undefined,
  };
}

export interface LoadedDicom {
  volume: VolumeData;
  windowCenter?: number;
  windowWidth?: number;
  fileCount: number;
}

/** 解析一组 DICOM 文件并按层堆叠为体素体 */
export async function loadDicomSeries(files: File[]): Promise<LoadedDicom> {
  const slices: SliceInfo[] = [];
  const errors: string[] = [];
  for (const f of files) {
    try {
      slices.push(parseOne(await f.arrayBuffer()));
    } catch (e) {
      errors.push(`${f.name}: ${(e as Error).message}`);
    }
  }
  if (slices.length === 0) {
    throw new Error(`没有可解析的 DICOM 切片。\n${errors.slice(0, 3).join('\n')}`);
  }

  const { rows, cols } = slices[0];
  for (const s of slices) {
    if (s.rows !== rows || s.cols !== cols) {
      throw new Error('切片尺寸不一致，请选择同一序列');
    }
  }

  // 按 Z 位置（或实例号）排序
  const allHaveZ = slices.every((s) => Number.isFinite(s.z));
  slices.sort((a, b) => (allHaveZ ? a.z - b.z : a.instance - b.instance));

  // 层间距：优先用相邻层 Z 差的中位数，否则用 SliceThickness 不可得时取 1
  let sz = 1;
  if (allHaveZ && slices.length > 1) {
    const dz: number[] = [];
    for (let i = 1; i < slices.length; i++) {
      const d = Math.abs(slices[i].z - slices[i - 1].z);
      if (d > 1e-6) dz.push(d);
    }
    dz.sort((a, b) => a - b);
    if (dz.length) sz = dz[Math.floor(dz.length / 2)];
  }

  const nz = slices.length;
  const nxy = rows * cols;
  const data = new Float32Array(nxy * nz);
  let min = Infinity;
  let max = -Infinity;
  for (let k = 0; k < nz; k++) {
    const s = slices[k];
    const out = data.subarray(k * nxy, (k + 1) * nxy);
    for (let i = 0; i < nxy; i++) {
      const v = s.pixels[i] * s.slope + s.intercept;
      out[i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  return {
    volume: {
      dims: [cols, rows, nz],
      spacing: [slices[0].spacingXY[0], slices[0].spacingXY[1], sz],
      data, min, max,
    },
    windowCenter: slices[0].windowCenter,
    windowWidth: slices[0].windowWidth,
    fileCount: slices.length,
  };
}
