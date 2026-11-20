import { useEffect, useRef } from 'react';
import type { VolumeData } from './types';

interface SliceViewerProps {
  volume: VolumeData;
  sliceIndex: number;
  windowWidth: number;
  windowLevel: number;
  thresholdMin: number;
  thresholdMax: number;
  onSliceChange: (i: number) => void;
}

/** 左侧横断面切片浏览：滚轮翻层，窗宽窗位灰度显示 + 阈值蒙版叠加 */
export function SliceViewer({
  volume, sliceIndex, windowWidth, windowLevel,
  thresholdMin, thresholdMax, onSliceChange,
}: SliceViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nx, ny, nz] = volume.dims;

  // 滚轮翻层
  useEffect(() => {
    const canvas = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(nz - 1, sliceIndex + delta));
      if (next !== sliceIndex) onSliceChange(next);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [sliceIndex, nz, onSliceChange]);

  // 绘制切片 + 蒙版叠加
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = nx;
    canvas.height = ny;

    const img = ctx.createImageData(nx, ny);
    const offset = sliceIndex * nx * ny;
    const lo = windowLevel - windowWidth / 2;
    const inv = windowWidth > 0 ? 255 / windowWidth : 1;
    for (let i = 0; i < nx * ny; i++) {
      const v = volume.data[offset + i];
      let g = (v - lo) * inv;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      const inMask = v >= thresholdMin && v <= thresholdMax;
      const p = i * 4;
      if (inMask) {
        // 蒙版叠加：红色半透明
        img.data[p] = g * 0.55 + 255 * 0.45;
        img.data[p + 1] = g * 0.55;
        img.data[p + 2] = g * 0.55;
      } else {
        img.data[p] = g;
        img.data[p + 1] = g;
        img.data[p + 2] = g;
      }
      img.data[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [volume, sliceIndex, windowWidth, windowLevel, thresholdMin, thresholdMax, nx, ny]);

  return (
    <div className="slice-viewer">
      <canvas ref={canvasRef} style={{ width: '100%', imageRendering: 'pixelated' }} />
      <div className="slice-label">
        层 {sliceIndex + 1} / {nz}
      </div>
      <input
        type="range"
        min={0}
        max={nz - 1}
        value={sliceIndex}
        onChange={(e) => onSliceChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
