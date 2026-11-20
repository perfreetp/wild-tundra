import './styles.css';
import './ui/toolbar';
import './ui/scene-controls';
import './ui/layer-stack';
import './ui/hud';

import { store, type StoreChange } from './core/store';
import { cloneView, createDefaultView, moveLayer } from './core/view';
import { loadFromStorage, parseImport, saveToStorage, serializeExport } from './core/persist';
import { clamp } from './core/math';
import { BLEND_MODES, COLOR_TEMP_MAX, COLOR_TEMP_MIN, PITCH_MAX, PITCH_MIN, YAW_MAX, YAW_MIN, type BlendMode, type LayerId, type ViewState } from './core/types';
import { checkWebGL2, ViewEngine } from './render/engine';
import type { LayerStackDetail } from './ui/layer-stack';
import type { ControlChangeDetail } from './ui/scene-controls';
import type { ToolbarDetail } from './ui/toolbar';
import { PRESETS } from './ui/toolbar';
import type { HudOverlayElement } from './ui/hud';
import type { LayerStackElement } from './ui/layer-stack';
import type { SceneControlsElement } from './ui/scene-controls';
import type { ToolbarElement } from './ui/toolbar';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`缺少元素 #${id}`);
  return el as T;
};

function boot(): void {
  const fatal = $('fatal');
  const fatalMsg = $('fatal-msg');
  const webglError = checkWebGL2();
  if (webglError) {
    fatal.hidden = false;
    fatalMsg.textContent = webglError;
    return;
  }

  // ---- 状态 ----
  const restored = loadFromStorage();
  let presetId: string | null = null;
  if (restored.view) {
    store.replace(restored.view, 'init');
    presetId = matchPreset(restored.view);
  }

  // ---- 引擎 ----
  const viewport = $('viewport');
  const canvas = $<HTMLCanvasElement>('scene-canvas');
  let engine: ViewEngine;
  try {
    const debugBuffer = new URLSearchParams(location.search).has('debug');
    engine = new ViewEngine(viewport, canvas, { preserveDrawingBuffer: debugBuffer });
  } catch (error) {
    fatal.hidden = false;
    fatalMsg.textContent = `渲染器初始化失败：${error instanceof Error ? error.message : String(error)}`;
    return;
  }

  const hud = $<HudOverlayElement>('hud');
  const stack = $<LayerStackElement>('layers');
  const controls = $<SceneControlsElement>('controls');
  const toolbar = $<ToolbarElement>('toolbar');

  // 首次同步 UI
  const initial = store.state;
  stack.view = initial;
  controls.view = initial;
  engine.applyState(initial);
  toolbar.activePreset = presetId;

  store.subscribe((change: StoreChange) => {
    stack.view = change.state;
    controls.view = change.state;
    engine.applyState(change.state);
    updateStatus(change.state);
    if (change.reason !== 'preset-applied') {
      presetId = matchPreset(change.state);
      toolbar.activePreset = presetId;
    }
    schedulePersist();
  });

  updateStatus(initial);
  engine.start();

  // ---- 自动保存 ----
  let persistTimer = 0;
  let saveFailed = false;
  function schedulePersist(): void {
    window.clearTimeout(persistTimer);
    persistTimer = window.setTimeout(() => {
      const ok = saveToStorage(store.state);
      if (!ok && !saveFailed) saveFailed = true;
      const note = $('save-note');
      if (note) {
        note.textContent = ok
          ? '参数已自动保存到浏览器本地，下次打开自动还原。'
          : '浏览器本地存储不可用（隐私模式？），导出 JSON 可保留参数。';
        note.style.color = ok ? '' : 'var(--accent)';
      }
    }, 240);
  }

  // ---- 图层面板 ----
  document.addEventListener('layer-change', (event) => {
    const detail = (event as CustomEvent<LayerStackDetail>).detail;
    applyLayerChange(detail);
  });

  function applyLayerChange(detail: LayerStackDetail): void {
    const { type, id } = detail;
    switch (type) {
      case 'opacity': {
        const value = clamp(Number(detail.value ?? 0), 0, 1);
        store.update((draft) => {
          if (draft.layers[id].opacity === value) return false;
          draft.layers[id].opacity = value;
        }, 'layer-opacity');
        break;
      }
      case 'blend': {
        const value = detail.value as BlendMode;
        if (!BLEND_MODES.includes(value)) return;
        store.update((draft) => {
          if (draft.layers[id].blend === value) return false;
          draft.layers[id].blend = value;
        }, 'layer-blend');
        break;
      }
      case 'visible': {
        const value = Boolean(detail.value);
        store.update((draft) => {
          if (draft.layers[id].visible === value) return false;
          draft.layers[id].visible = value;
        }, 'layer-visible');
        break;
      }
      case 'reorder': {
        const to = detail.to;
        if (!to || to === id) return;
        store.update((draft) => {
          const next = moveLayer(draft.order, id, to);
          if (next.join(',') === draft.order.join(',')) return false;
          draft.order = next;
        }, 'layer-order');
        break;
      }
      default:
        break;
    }
  }

  // ---- 环境 / 相机面板 ----
  document.addEventListener('control-change', (event) => {
    const detail = (event as CustomEvent<ControlChangeDetail>).detail;
    applyControlChange(detail);
  });

  function applyControlChange(detail: ControlChangeDetail): void {
    switch (detail.type) {
      case 'fog': {
        const value = clamp(Number(detail.value ?? 0), 0, 1);
        store.update((draft) => {
          if (Math.abs(draft.fog - value) < 1e-4) return false;
          draft.fog = value;
        }, 'fog');
        break;
      }
      case 'color-temp': {
        const value = clamp(Math.round(Number(detail.value ?? 5600)), COLOR_TEMP_MIN, COLOR_TEMP_MAX);
        store.update((draft) => {
          if (Math.round(draft.colorTemp) === value) return false;
          draft.colorTemp = value;
        }, 'color-temp');
        break;
      }
      case 'night': {
        const value = Boolean(detail.value);
        store.update((draft) => {
          if (draft.night === value) return false;
          draft.night = value;
        }, 'night');
        break;
      }
      case 'pitch': {
        const value = clamp(Number(detail.value ?? 0), PITCH_MIN, PITCH_MAX);
        store.update((draft) => {
          if (Math.abs(draft.camera.pitch - value) < 1e-3) return false;
          draft.camera.pitch = value;
        }, 'camera');
        break;
      }
      case 'yaw': {
        const value = clamp(Number(detail.value ?? 0), YAW_MIN, YAW_MAX);
        store.update((draft) => {
          if (Math.abs(draft.camera.yaw - value) < 1e-3) return false;
          draft.camera.yaw = value;
        }, 'camera');
        break;
      }
      case 'reset-camera': {
        store.update((draft) => {
          if (draft.camera.pitch === 0 && draft.camera.yaw === 0) return false;
          draft.camera.pitch = 0;
          draft.camera.yaw = 0;
        }, 'camera');
        break;
      }
      default:
        break;
    }
  }

  // ---- 工具栏：预设 / 导出 / 导入 / 重置 ----
  document.addEventListener('toolbar-action', async (event) => {
    const detail = (event as CustomEvent<ToolbarDetail>).detail;
    switch (detail.action) {
      case 'preset': {
        const preset = PRESETS.find((p) => p.id === detail.preset);
        if (!preset) return;
        const draft = cloneView(store.state);
        preset.apply(draft);
        store.replace(draft, 'preset-applied');
        presetId = preset.id;
        toolbar.activePreset = presetId;
        flashNote(`已应用预设：${preset.name}`, 'ok');
        toast(`预设：${preset.name}`, 'ok');
        break;
      }
      case 'export':
        exportJson();
        break;
      case 'import':
        $<HTMLInputElement>('file-input').click();
        break;
      case 'reset': {
        store.reset();
        presetId = null;
        toolbar.activePreset = null;
        flashNote('已恢复初始状态', 'ok');
        toast('已重置合成状态', 'ok');
        break;
      }
      default:
        break;
    }
  });

  // 侧栏的导出 / 导入按钮与工具栏等价
  $('btn-export').addEventListener('click', () => exportJson());
  $('btn-import').addEventListener('click', () => $<HTMLInputElement>('file-input').click());

  function exportJson(): void {
    const text = serializeExport(store.state);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    const name = `railview-view-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(
      stamp.getHours(),
    )}${pad(stamp.getMinutes())}.json`;
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    flashNote(`已导出 ${name}`, 'ok');
    toast('已导出 JSON', 'ok');
  }

  const fileInput = $<HTMLInputElement>('file-input');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      flashNote('文件过大（> 2 MB），不像视景状态文件。', 'err');
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      flashNote('读取文件失败。', 'err');
      return;
    }
    const result = parseImport(text);
    if (!result.ok) {
      flashNote(`导入失败：${result.error}`, 'err');
      toast(`导入失败：${result.error}`, 'err');
      return;
    }
    store.replace(result.view, 'import');
    presetId = matchPreset(result.view);
    toolbar.activePreset = presetId;
    flashNote(`已导入 ${file.name}，合成状态与相机角度已还原。`, 'ok');
    toast('导入成功，已还原合成状态', 'ok');
  });

  // ---- 画面拖拽控制视角 ----
  let drag: { x: number; y: number; pitch: number; yaw: number } | null = null;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('.fatal')) return;
    drag = { x: event.clientX, y: event.clientY, pitch: store.state.camera.pitch, yaw: store.state.camera.yaw };
    viewport.classList.add('dragging');
    viewport.setPointerCapture(event.pointerId);
    $('drag-tip').classList.add('fade');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const sensitivity = 0.16;
    const pitch = clamp(drag.pitch - (event.clientY - drag.y) * sensitivity, PITCH_MIN, PITCH_MAX);
    const yaw = clamp(drag.yaw - (event.clientX - drag.x) * sensitivity, YAW_MIN, YAW_MAX);
    store.update((draft) => {
      if (Math.abs(draft.camera.pitch - pitch) < 1e-3 && Math.abs(draft.camera.yaw - yaw) < 1e-3) return false;
      draft.camera.pitch = Math.round(pitch * 10) / 10;
      draft.camera.yaw = Math.round(yaw * 10) / 10;
    }, 'camera');
  });
  const endDrag = (): void => {
    drag = null;
    viewport.classList.remove('dragging');
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
  }, { passive: false });

  // 键盘：方向键微调相机
  window.addEventListener('keydown', (event) => {
    if ((event.target as HTMLElement)?.closest?.('input, textarea, [contenteditable]')) return;
    const step = event.shiftKey ? 0.5 : 1.5;
    let handled = true;
    switch (event.key) {
      case 'ArrowUp':
        nudgeCamera(step, 0);
        break;
      case 'ArrowDown':
        nudgeCamera(-step, 0);
        break;
      case 'ArrowLeft':
        nudgeCamera(0, -step);
        break;
      case 'ArrowRight':
        nudgeCamera(0, step);
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  });

  function nudgeCamera(dPitch: number, dYaw: number): void {
    store.update((draft) => {
      const pitch = clamp(draft.camera.pitch + dPitch, PITCH_MIN, PITCH_MAX);
      const yaw = clamp(draft.camera.yaw + dYaw, YAW_MIN, YAW_MAX);
      if (pitch === draft.camera.pitch && yaw === draft.camera.yaw) return false;
      draft.camera.pitch = pitch;
      draft.camera.yaw = yaw;
    }, 'camera');
  }

  // ---- HUD ----
  function tickHud(): void {
    const state = store.state;
    const stats = engine.getStats();
    hud.updateStats({
      fps: stats.fps,
      framesRendered: stats.framesRendered,
      width: stats.width,
      height: stats.height,
      drawCalls: stats.drawCalls,
      visibilityKm: engine.visibilityKm(),
      layerCount: state.order.filter((id) => state.layers[id].visible && state.layers[id].opacity > 0).length,
      night: state.night,
    });
    hud.updateCamera(state.camera.pitch, state.camera.yaw);
    window.setTimeout(tickHud, 480);
  }
  tickHud();

  // ---- 状态栏 ----
  function updateStatus(state: Readonly<ViewState>): void {
    const chipLayers = $('chip-layers');
    const visible = state.order.filter((id) => state.layers[id].visible);
    chipLayers.textContent = `${visible.length} / 3 LAYERS`;
    chipLayers.classList.toggle('warn', visible.length < 3);
    const chipFog = $('chip-fog');
    chipFog.textContent = `FOG ${state.fog.toFixed(2)}`;
    chipFog.classList.toggle('warn', state.fog > 0.6);
    const chipTemp = $('chip-temp');
    chipTemp.textContent = `${Math.round(state.colorTemp)} K`;
    chipTemp.classList.toggle('night', state.night);
    const cam = $('status-camera');
    cam.textContent = `P ${state.camera.pitch > 0 ? '+' : ''}${state.camera.pitch.toFixed(1)}° / Y ${
      state.camera.yaw > 0 ? '+' : ''
    }${state.camera.yaw.toFixed(1)}°`;
  }

  // ---- 提示 ----
  const note = $('file-note');
  function flashNote(text: string, kind: 'ok' | 'err'): void {
    note.textContent = text;
    note.className = `file-note ${kind}`;
  }

  const toastHost = document.createElement('div');
  toastHost.className = 'toast-host';
  document.body.appendChild(toastHost);
  function toast(text: string, kind: 'ok' | 'err' = 'ok'): void {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = text;
    toastHost.appendChild(el);
    window.setTimeout(() => {
      el.classList.add('out');
      window.setTimeout(() => el.remove(), 260);
    }, 1900);
  }

  // 用户操作后隐藏拖拽提示（防止遮挡）
  const hideTip = (): void => $('drag-tip').classList.add('fade');
  window.setTimeout(hideTip, 9000);

  window.addEventListener('beforeunload', () => {
    saveToStorage(store.state);
    engine.stop();
    engine.dispose();
  });
  window.addEventListener('resize', () => engine.resize());

  if (restored.error) {
    flashNote(`本地保存的数据损坏已忽略：${restored.error}`, 'err');
  }

  // 调试接口（自动化测试使用）
  Object.defineProperty(window, '__railview', {
    value: {
      store,
      engine,
      ready: true,
      getState: () => cloneView(store.state),
      setState: (view: unknown) => store.replace(view, 'import'),
      reset: () => store.reset(),
      defaultView: createDefaultView,
    },
    configurable: true,
  });
}

function matchPreset(view: ViewState): string | null {
  for (const preset of PRESETS) {
    const draft = createDefaultView();
    preset.apply(draft);
    if (
      Math.abs(draft.fog - view.fog) < 1e-3 &&
      Math.round(draft.colorTemp) === Math.round(view.colorTemp) &&
      draft.night === view.night &&
      (['far', 'mid', 'near'] as LayerId[]).every(
        (id) =>
          Math.abs(draft.layers[id].opacity - view.layers[id].opacity) < 1e-3 &&
          draft.layers[id].blend === view.layers[id].blend &&
          draft.layers[id].visible === view.layers[id].visible,
      )
    ) {
      return preset.id;
    }
  }
  return null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
