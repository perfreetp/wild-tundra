import { useEffect, useRef } from 'react';
import { SimulationEngine } from '../three/SimulationEngine';
import { useSimStore } from '../store';
import { TUNNEL_ENTRY_Z, TUNNEL_EXIT_Z } from '../presets';

let engineRef: { current: SimulationEngine | null } = { current: null };
export function getEngine() {
  return engineRef.current;
}

export function Viewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const params = useSimStore((s) => s.params);
  const selectedId = useSimStore((s) => s.selectedId);

  useEffect(() => {
    if (!hostRef.current) return;
    const engine = new SimulationEngine(hostRef.current);
    engineRef.current = engine;

    // 测试钩子：?test=<工况> 自动切换参数组合，供无头浏览器截图回归验证
    const testCase = new URLSearchParams(window.location.search).get('test');
    if (testCase) {
      const store = useSimStore.getState();
      store.setCruising(false);
      const cases: Record<string, () => void> = {
        night: () => store.updateParams({ timeOfDay: 'night' }),
        dusk: () => store.updateParams({ timeOfDay: 'dusk' }),
        pincushion: () =>
          store.updateParams({
            distortionMode: 'pincushion',
            distortionAmount: 0.8,
            fov: 45,
          }),
        barrelWide: () =>
          store.updateParams({
            distortionMode: 'barrel',
            distortionAmount: 0.9,
            fov: 115,
          }),
        tunnelDark: () => {
          store.updateParams({ timeOfDay: 'night', exposureStops: -4 });
          engine.teleportCamera(-100);
        },
        overExposed: () =>
          store.updateParams({ exposureStops: 5, dynamicRange: 7 }),
        rolling: () =>
          store.updateParams({ rollingShutterTilt: 0.95, fov: 90 }),
      };
      cases[testCase]?.();
    }

    // HUD：通过引擎内部状态读取成本较高，这里用一个轻量 rAF 轮询 DOM 更新
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = hudRef.current;
      if (!el) return;
      // 从引擎相机位置更新隧道状态提示
      const pos = engine.cameraZ;
      const inTunnel = pos < TUNNEL_ENTRY_Z && pos > TUNNEL_EXIT_Z;
      const nearEntry =
        pos < TUNNEL_ENTRY_Z + 15 && pos > TUNNEL_EXIT_Z - 15;
      const tag = inTunnel
        ? '隧道内'
        : nearEntry
          ? pos > TUNNEL_ENTRY_Z
            ? '接近隧道入口'
            : '接近隧道出口'
          : '开放道路';
      el.querySelector('[data-hud=env]')!.textContent = tag;
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const selected = useSimStore((s) =>
    s.objects.find((o) => o.id === s.selectedId),
  );

  return (
    <div className="viewer">
      <div className="canvas-host" ref={hostRef} />

      {/* 画面 HUD 叠加层（DOM，不进入截图） */}
      <div className="hud" ref={hudRef}>
        <div className="hud-top">
          <span className="hud-badge" data-hud="env">
            开放道路
          </span>
          <span className="hud-badge">
            FOV {params.fov.toFixed(0)}° · f={params.focalLength}mm
          </span>
          <span className="hud-badge">
            EV {params.exposureStops >= 0 ? '+' : ''}
            {params.exposureStops} · DR {params.dynamicRange}档
          </span>
        </div>
        <div className="hud-corner tl" />
        <div className="hud-corner tr" />
        <div className="hud-corner bl" />
        <div className="hud-corner br" />
        <div className="hud-bottom">
          {selected
            ? `已选中：${selected.name}（拖动 Gizmo 调整位置，右侧面板可精确编辑）`
            : '点击场景中的车辆 / 车道线可选中并拖动编辑'}
        </div>
      </div>
    </div>
  );
}
