import { useEffect, useRef } from 'react';
import { SceneManager, VIEW_PRESETS } from '../three/SceneManager';
import { useStore } from '../store';

export default function Viewport() {
  const ref = useRef<HTMLDivElement>(null);
  const managerRef = useRef<SceneManager | null>(null);

  const network = useStore((s) => s.network);
  const results = useStore((s) => s.results);
  const scheme = useStore((s) => s.scheme);
  const leaks = useStore((s) => s.leaks);
  const side = useStore((s) => s.side);
  const colorMode = useStore((s) => s.colorMode);
  const showLabels = useStore((s) => s.showLabels);
  const affectedBuildings = useStore((s) => s.affectedBuildings);
  const focusNonce = useStore((s) => s.focusNonce);
  const selection = useStore((s) => s.selection);
  const selectPipe = useStore((s) => s.selectPipe);
  const selectNode = useStore((s) => s.selectNode);
  const updateLeak = useStore((s) => s.updateLeak);
  const addLeak = useStore((s) => s.addLeak);

  // 初始化（仅一次）
  useEffect(() => {
    const mgr = new SceneManager(ref.current!, {
      onPickPipe: (pipeId, pickSide) => {
        selectPipe(pipeId ? { pipeId, side: pickSide } : null);
      },
      onPickNode: (nodeId) => selectNode(nodeId),
      onLeakDrag: (leakId, t) => updateLeak(leakId, { t }),
    });
    managerRef.current = mgr;
    const st = useStore.getState();
    mgr.setNetwork(
      st.network,
      st.results,
      st.scheme,
      st.leaks,
      st.side,
      st.affectedBuildings,
    );
    return () => {
      mgr.dispose();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 管网整体替换
  useEffect(() => {
    managerRef.current?.setNetwork(
      network,
      results,
      scheme,
      leaks,
      side,
      affectedBuildings,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  // 供/回水切换
  useEffect(() => {
    managerRef.current?.showSide(side);
  }, [side]);

  // 着色模式 / 色带变化
  useEffect(() => {
    managerRef.current?.setColorMode(colorMode, scheme);
  }, [colorMode, scheme]);

  // 标签
  useEffect(() => {
    managerRef.current?.setShowLabels(showLabels);
  }, [showLabels]);

  // 解算结果（泄漏、阈值等）
  useEffect(() => {
    managerRef.current?.setResults(results, leaks, affectedBuildings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, leaks, affectedBuildings]);

  // 节点树联动定位
  useEffect(() => {
    if (focusNonce) managerRef.current?.focusNode(focusNonce.nodeId);
  }, [focusNonce]);

  return (
    <div className="viewport-wrap">
      <div ref={ref} className="viewport" />
      <div className="preset-bar">
        {VIEW_PRESETS.map((p) => (
          <button
            key={p.id}
            className="btn preset-btn"
            onClick={() => managerRef.current?.applyPreset(p)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="hint-bar">
        左键拾取管段/节点 · 拖拽红色泄漏点沿管移动 · 滚轮缩放 · 右键平移
        <button
          className="btn mini"
          onClick={() => {
            if (selection) addLeak(selection.pipeId, selection.side, 0.5);
          }}
          disabled={!selection}
        >
          ＋ 在选中管段加泄漏点
        </button>
      </div>
    </div>
  );
}
