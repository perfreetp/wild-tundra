import { useCallback, useEffect, useRef, useState } from "react";
import { generateShader, type GenerateResult, type GeneratedShader } from "../core/generate";
import type { MaterialGraph } from "../core/types";
import { MaterialPreview, type CompileStats, type PreviewSample } from "../preview/MaterialPreview";

export interface ShaderStatus {
  /** 生成器产出的最新结果（可能因图不合法而是错误）。 */
  generated: GenerateResult;
  /** 预览里已经生效的源码 key。 */
  activeKey: string;
  compiling: boolean;
  /** 最近一次生成耗时（ms）。 */
  generateMs: number;
  /** 预览编译统计。 */
  stats: CompileStats;
  /** 从参数变化到新材质上屏的总耗时（ms）。 */
  settledMs: number | null;
}

const EMPTY_STATS: CompileStats = {
  lastCompileMs: 0,
  totalCompiles: 0,
  recent: [],
  lastError: null,
  coalesced: 0,
};

export function usePreview(graph: MaterialGraph, hostRef: React.RefObject<HTMLDivElement | null>) {
  const previewRef = useRef<MaterialPreview | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<ShaderStatus>({
    generated: { ok: false, reason: "预览尚未就绪", issues: [] },
    activeKey: "",
    compiling: false,
    generateMs: 0,
    stats: EMPTY_STATS,
    settledMs: null,
  });
  const [sample, setSample] = useState<PreviewSample | null>(null);
  const versionRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let preview: MaterialPreview;
    try {
      preview = new MaterialPreview(host);
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        generated: {
          ok: false,
          reason: `WebGL 初始化失败：${error instanceof Error ? error.message : String(error)}`,
          issues: [],
        },
      }));
      return;
    }
    previewRef.current = preview;
    preview.start();
    setReady(true);
    // 开发模式下把预览实例挂到 window，便于在控制台/自动化里检查编译与采样
    if (import.meta.env.DEV) {
      (window as unknown as { __hmePreview?: MaterialPreview }).__hmePreview = preview;
    }

    const observer = new ResizeObserver(() => preview.resize());
    observer.observe(host);

    return () => {
      observer.disconnect();
      preview.dispose();
      previewRef.current = null;
      setReady(false);
    };
  }, [hostRef]);

  // 图变化 → 重新生成源码 → 交给预览编译
  useEffect(() => {
    if (!ready) return;
    const preview = previewRef.current;
    if (!preview) return;
    const version = ++versionRef.current;
    const started = performance.now();
    const result = generateShader(graph);
    const generateMs = performance.now() - started;

    setStatus((prev) => ({
      ...prev,
      generated: result,
      generateMs,
    }));

    if (!result.ok) return;
    setStatus((prev) => ({ ...prev, compiling: true }));
    const shader: GeneratedShader = result;
    preview
      .requestShader(shader)
      .then(() => {
        // 队列为空时 currentKey 一定是最新源码；旧版本的 then 晚到也不覆盖状态
        setStatus((prev) => ({
          ...prev,
          activeKey: preview.getMaterialKey(),
          compiling: false,
          stats: preview.getStats(),
          settledMs: version === versionRef.current ? performance.now() - started : prev.settledMs,
        }));
      })
      .catch((error: unknown) => {
        if (version !== versionRef.current) return;
        setStatus((prev) => ({
          ...prev,
          compiling: false,
          stats: preview.getStats(),
          generated: {
            ok: false,
            reason: `编译失败：${error instanceof Error ? error.message : String(error)}`,
            issues: [],
          },
        }));
      });
  }, [graph, ready]);

  const setLight = useCallback((azimuth: number, elevation: number) => {
    previewRef.current?.setLight({ azimuth, elevation });
  }, []);

  const setRoughnessScale = useCallback((value: number) => {
    previewRef.current?.setRoughnessScale(value);
  }, []);

  const setExposure = useCallback((value: number) => {
    previewRef.current?.setExposure(value);
  }, []);

  const setLightIntensity = useCallback((value: number) => {
    previewRef.current?.setLightIntensity(value);
  }, []);

  const orbit = useCallback((dAlpha: number, dBeta = 0, dRadius = 0) => {
    previewRef.current?.orbit(dAlpha, dBeta, dRadius);
  }, []);

  const measure = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return null;
    const result = preview.sampleViewports();
    setSample(result);
    return result;
  }, []);

  return {
    ready,
    status,
    sample,
    setLight,
    setRoughnessScale,
    setExposure,
    setLightIntensity,
    orbit,
    measure,
    previewRef,
  };
}
