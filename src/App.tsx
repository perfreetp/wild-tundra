import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ReconResult, VolumeData } from './types';
import { loadDicomSeries } from './dicom';
import { makeDemoVolume } from './demoVolume';
import { ReconClient } from './reconClient';
import { computeVertexColors } from './colormap';
import { exportGLB, exportSTL } from './exporters';
import { Viewport, type ClipState } from './Viewport';
import { SliceViewer } from './SliceViewer';
import { ControlPanel } from './ControlPanel';

export default function App() {
  const [volume, setVolume] = useState<VolumeData | null>(null);
  const [result, setResult] = useState<ReconResult | null>(null);
  const [stats, setStats] = useState<{ tris: number; timeMs: number; components: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [windowWidth, setWindowWidth] = useState(400);
  const [windowLevel, setWindowLevel] = useState(40);
  const [thresholdMin, setThresholdMin] = useState(0);
  const [thresholdMax, setThresholdMax] = useState(200);
  const [opacity, setOpacity] = useState(1);
  const [sliceIndex, setSliceIndex] = useState(0);
  const [clip, setClip] = useState<ClipState>({
    x: { enabled: false, pos: 0.5 },
    y: { enabled: false, pos: 0.5 },
    z: { enabled: false, pos: 0.5 },
  });

  const clientRef = useRef<ReconClient | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  if (!clientRef.current) clientRef.current = new ReconClient();
  useEffect(() => () => clientRef.current?.dispose(), []);

  // 载入新体数据
  const setNewVolume = useCallback((v: VolumeData, wc?: number, ww?: number) => {
    setVolume(v);
    setResult(null);
    setStats(null);
    setSliceIndex(Math.floor(v.dims[2] / 2));
    const width = ww ?? Math.max(1, v.max - v.min);
    const level = wc ?? (v.max + v.min) / 2;
    setWindowWidth(width);
    setWindowLevel(level);
    // 默认阈值带：取数据上半段（对 CT 即软组织以上）
    setThresholdMin(Math.max(v.min, level - width / 4));
    setThresholdMax(v.max);
    clientRef.current!.init(v);
  }, []);

  const onImportDicom = useCallback(async (files: FileList) => {
    setError(null);
    setBusy(true);
    try {
      const { volume: v, windowCenter, windowWidth: ww, fileCount } = await loadDicomSeries(Array.from(files));
      setNewVolume(v, windowCenter, ww);
      console.log(`已载入 ${fileCount} 层 DICOM 切片`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [setNewVolume]);

  const onDemo = useCallback(() => {
    setError(null);
    setNewVolume(makeDemoVolume(), 40, 400);
  }, [setNewVolume]);

  // 阈值带 / 体数据变化 → 防抖触发 Worker 重建
  useEffect(() => {
    if (!volume) return;
    const client = clientRef.current!;
    const timer = setTimeout(() => {
      client.invalidatePending();
      setBusy(true);
      client
        .reconstruct({ thresholdMin, thresholdMax })
        .then((r) => {
          setResult(r);
          setStats({ tris: r.triCount, timeMs: r.timeMs, components: r.components });
        })
        .catch((e) => {
          if (e.message !== 'stale') setError(e.message);
        })
        .finally(() => setBusy(false));
    }, 150);
    return () => clearTimeout(timer);
  }, [volume, thresholdMin, thresholdMax]);

  // 顶点色：CT 值按当前窗宽窗位映射到 5 段色带
  const colors = useMemo(
    () => (result ? computeVertexColors(result.values, windowLevel, windowWidth) : null),
    [result, windowLevel, windowWidth],
  );

  const onWindowChange = useCallback((w: number, l: number) => {
    setWindowWidth(w);
    setWindowLevel(l);
  }, []);
  const onThresholdChange = useCallback((min: number, max: number) => {
    setThresholdMin(min);
    setThresholdMax(max);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <span className="title">器官三维重建</span>
        {volume && (
          <span className="stat">
            体数据 {volume.dims[0]}×{volume.dims[1]}×{volume.dims[2]}
          </span>
        )}
        {stats && (
          <>
            <span className="stat">三角面数 {stats.tris.toLocaleString()}</span>
            <span className="stat">重建耗时 {stats.timeMs.toFixed(0)} ms</span>
            <span className="stat">连通分量 {stats.components}</span>
          </>
        )}
        {busy && <span className="stat busy">处理中…</span>}
        {error && <span className="stat error">{error}</span>}
      </header>

      <div className="main">
        <aside className="sidebar">
          {volume ? (
            <SliceViewer
              volume={volume}
              sliceIndex={sliceIndex}
              windowWidth={windowWidth}
              windowLevel={windowLevel}
              thresholdMin={thresholdMin}
              thresholdMax={thresholdMax}
              onSliceChange={setSliceIndex}
            />
          ) : (
            <div className="placeholder">导入 DICOM 序列或点击“演示数据”开始</div>
          )}
          <ControlPanel
            dataMin={volume?.min ?? -1000}
            dataMax={volume?.max ?? 1000}
            windowWidth={windowWidth}
            windowLevel={windowLevel}
            thresholdMin={thresholdMin}
            thresholdMax={thresholdMax}
            opacity={opacity}
            clip={clip}
            canExport={!!result && result.triCount > 0}
            onWindowChange={onWindowChange}
            onThresholdChange={onThresholdChange}
            onOpacityChange={setOpacity}
            onClipChange={setClip}
            onImportDicom={onImportDicom}
            onDemo={onDemo}
            onExportSTL={() => meshRef.current && exportSTL(meshRef.current)}
            onExportGLB={() => meshRef.current && exportGLB(meshRef.current)}
          />
        </aside>

        <Viewport
          result={result}
          dims={volume?.dims ?? [1, 1, 1]}
          spacing={volume?.spacing ?? [1, 1, 1]}
          colors={colors}
          opacity={opacity}
          clip={clip}
          meshRef={meshRef}
        />
      </div>
    </div>
  );
}
