// 应用主控制器:连接状态、Babylon 场景、时间轴与播放循环

import { SceneManager } from "./babylon/sceneManager";
import {
  FOV_MAX,
  FOV_MIN,
  GEAR_SPEED,
  KeyPoint,
  SpeedGear,
  SWAY_MAX,
  SWAY_MIN,
  clampFov,
  store,
  uid,
} from "./store";
import { RoutePath, autoScheduleTimes, nodeLabel } from "./routePath";
import { TimelineView } from "./ui/timeline";
import { TUNNEL, getNode } from "./tunnel";
import {
  buildRouteJson,
  buildTrajectoryCsv,
  downloadText,
} from "./exporter";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

class AppController {
  private sm!: SceneManager;
  private timeline!: TimelineView;
  private paths = new Map<string, RoutePath>();
  private lastFrameTs = 0;
  private rafId = 0;

  async init(): Promise<void> {
    const canvas = $<HTMLCanvasElement>("renderCanvas");
    this.sm = await SceneManager.Create(canvas);
    $("engineBadge").textContent = `${this.sm.engineName} 引擎`;

    this.timeline = new TimelineView($("timeline"), {
      onSeek: (t) => this.seek(t),
      onSelectKP: (id) => this.selectKP(id),
    });

    this.sm.setNodePickCallback((nodeId) => this.handleNodePick(nodeId));
    this.bindDom();
    this.rebuildAll();
    store.subscribe(() => this.render());
    this.tick();

    // 自动化/调试钩子
    window.mineCam = {
      store,
      getPaths: () => this.paths,
      rebuild: () => this.rebuildAll(),
      play: () => this.play(),
      seek: (t: number) => this.seek(t),
      buildDemoRoute: () => this.buildDemoRoute(),
      getSceneMeshCount: (prefix: string) =>
        this.sm.scene.meshes.filter((m) => m.id.startsWith(prefix)).length,
    };
  }

  /** 演示路线:采煤工作面 → 联络巷 → 上山 → 避难硐室 */
  private buildDemoRoute(): void {
    const seq = ["N0", "N1", "N2", "N3", "N4", "N5", "N6", "N7"];
    const gears: SpeedGear[] = [2, 2, 3, 2, 1, 2, 3, 2];
    const fovs = [60, 65, 70, 60, 55, 60, 75, 60];
    store.update((s) => {
      const active = s.routes.find((r) => r.id === s.activeRouteId)!;
      active.keyPoints = seq.map((nodeId, i) => ({
        id: uid("kp"),
        nodeId,
        time: 0,
        lookAtNodeId: i === 2 ? "N12" : null,
        fov: fovs[i],
        speed: gears[i],
      }));
      s.selectedKPId = null;
      s.playTime = 0;
    });
    store.update((s) => {
      const active = s.routes.find((r) => r.id === s.activeRouteId)!;
      const rescheduled = autoScheduleTimes(active, s.settings.filletRadius);
      active.keyPoints.forEach((kp, i) => (kp.time = rescheduled[i].time));
    });
    this.rebuildAll();
  }

  // ---------- 路径构建 ----------

  private rebuildAll(): void {
    const s = store.state;
    this.paths.clear();
    for (const route of s.routes) {
      this.paths.set(
        route.id,
        new RoutePath(
          route,
          s.settings.filletRadius,
          s.settings.signDwellSec,
          s.settings.fogEndPct
        )
      );
    }
    this.sm.refreshRoutes(s, this.paths);
    // 路径几何变化后同步时间轴与列表(状态未变的场景不会重复触发)
    this.render();
  }

  private get activePath(): RoutePath {
    return this.paths.get(store.state.activeRouteId)!;
  }

  // ---------- 编辑交互 ----------

  private handleNodePick(nodeId: string): void {
    const s = store.state;
    const route = store.activeRoute;
    if (s.tool === "add") {
      if (route.keyPoints.some((kp) => kp.nodeId === nodeId)) {
        this.flashHint("该节点已是关键点,请选择其他节点");
        return;
      }
      // 到达时间:按新关键点速度档与上一点间距自动推算
      const prev = route.keyPoints[route.keyPoints.length - 1];
      let time = 0;
      if (prev) {
        const candidate: KeyPoint = {
          id: uid("kp"),
          nodeId,
          time: prev.time + 1,
          lookAtNodeId: null,
          fov: prev.fov,
          speed: prev.speed,
        };
        const scheduled = autoScheduleTimes(
          { ...route, keyPoints: [...route.keyPoints, candidate] },
          s.settings.filletRadius
        );
        time = scheduled[scheduled.length - 1].time;
      }
      store.update((st) => {
        const active = st.routes.find((r) => r.id === st.activeRouteId)!;
        active.keyPoints.push({
          id: uid("kp"),
          nodeId,
          time,
          lookAtNodeId: null,
          fov: 60,
          speed: 2,
        });
        st.selectedKPId = active.keyPoints[active.keyPoints.length - 1].id;
      });
      this.rebuildAll();
    } else if (s.tool === "select") {
      const kp = route.keyPoints.find((k) => k.nodeId === nodeId);
      if (kp) this.selectKP(kp.id);
    } else if (s.tool === "gaze") {
      const kp = store.selectedKP;
      if (!kp) {
        this.flashHint("请先在关键点列表中选择一个关键点");
        return;
      }
      store.update((st) => {
        const target = st.routes
          .find((r) => r.id === st.activeRouteId)!
          .keyPoints.find((k) => k.id === st.selectedKPId)!;
        target.lookAtNodeId = target.nodeId === nodeId ? null : nodeId;
      });
      this.rebuildAll();
    }
  }

  private selectKP(id: string): void {
    store.update((s) => {
      s.selectedKPId = id;
    });
  }

  private flashHint(msg: string): void {
    const el = $("toolHint");
    const old = el.textContent;
    el.textContent = msg;
    el.style.color = "#fcd34d";
    setTimeout(() => {
      el.style.color = "";
      el.textContent = old;
    }, 1800);
  }

  // ---------- 播放 ----------

  private tick = (): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const now = performance.now();
    const dt = this.lastFrameTs ? (now - this.lastFrameTs) / 1000 : 0;
    this.lastFrameTs = now;
    const s = store.state;

    if (s.playing) {
      const path = this.activePath;
      let t = s.playTime + dt * s.playbackRate;
      let ended = false;
      if (t >= path.duration) {
        t = path.duration;
        ended = true;
      }
      store.silentUpdate((st) => {
        st.playTime = t;
        if (ended) st.playing = false;
      });
      if (path.keyPointCount >= 2) {
        this.applyPlayFrame(t);
        this.timeline.updatePlayhead(t);
      }
      if (ended) store.emit();
    }
  };

  private applyPlayFrame(t: number): void {
    const s = store.state;
    const path = this.activePath;
    if (path.keyPointCount < 2) return;
    const fr = path.sampleFrame(t);
    this.sm.updatePlayFrame(
      fr.position,
      fr.forward,
      fr.fov,
      fr.fogPct,
      t,
      s.settings.headSwayDeg
    );
    this.updateHud(t, fr.activeSign?.label ?? null, fr.fogPct, fr.fov, fr.speedGear);
  }

  private seek(t: number): void {
    const path = this.activePath;
    const clamped = Math.min(Math.max(t, 0), path.duration);
    store.update((s) => {
      s.playTime = clamped;
    });
    if (!store.state.playing) {
      this.sm.enterPreviewMode();
      this.applyPlayFrame(clamped);
    }
  }

  private play(): void {
    const path = this.activePath;
    if (path.keyPointCount < 2) {
      this.flashHint("至少需要 2 个关键点才能播放");
      return;
    }
    const s = store.state;
    if (s.playTime >= path.duration) {
      store.update((st) => (st.playTime = 0));
    }
    store.update((st) => (st.playing = true));
    this.sm.enterPreviewMode();
  }

  private stop(): void {
    store.update((st) => {
      st.playing = false;
      st.playTime = 0;
    });
    this.sm.enterEditMode();
    this.updateHud(0, null, 0, 60, 2);
  }

  private updateHud(
    t: number,
    signLabel: string | null,
    fogPct: number,
    fov: number,
    gear: SpeedGear
  ): void {
    const hud = $("hud");
    const sign = signLabel
      ? `<div class="hud-pill sign">注视标识牌:${signLabel} · 停留 0.5s</div>`
      : "";
    hud.innerHTML = `
      <div class="hud-pill">t = ${t.toFixed(2)} s · 速度 ${gear} 档 (${GEAR_SPEED[gear].toFixed(1)} m/s)</div>
      <div class="hud-pill">FOV ${fov.toFixed(1)}° · 雾密度 ${fogPct.toFixed(0)}%</div>
      ${sign}`;
    $("timeReadout").textContent = `${t.toFixed(1)} / ${this.activePath.duration.toFixed(1)} s`;
  }

  // ---------- DOM 绑定 ----------

  private bindDom(): void {
    // 工具切换
    document.querySelectorAll<HTMLButtonElement>(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        store.update((s) => (s.tool = btn.dataset.tool as typeof s.tool));
      });
    });

    // 路线切换 / 名称
    $("routeList").addEventListener("click", (e) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>(".route-chip");
      if (!chip) return;
      store.update((s) => {
        s.activeRouteId = chip.dataset.routeId!;
        s.selectedKPId = null;
        s.playTime = 0;
        s.playing = false;
      });
      this.sm.enterEditMode();
      this.timeline.render(store.state, this.activePath);
    });
    $("routeNameInput").addEventListener("input", (e) => {
      const v = (e.target as HTMLInputElement).value;
      store.update((s) => {
        if (v.trim()) {
          s.routes.find((r) => r.id === s.activeRouteId)!.name = v;
        }
      });
    });

    // 自动排时 / 清空
    $("btnAutoTime").addEventListener("click", () => {
      store.update((s) => {
        const active = s.routes.find((r) => r.id === s.activeRouteId)!;
        if (active.keyPoints.length < 2) return;
        const rescheduled = autoScheduleTimes(
          active,
          s.settings.filletRadius
        );
        active.keyPoints.forEach((kp, i) => (kp.time = rescheduled[i].time));
        s.playTime = 0;
      });
      this.rebuildAll();
    });
    $("btnClearRoute").addEventListener("click", () => {
      store.update((s) => {
        const active = s.routes.find((r) => r.id === s.activeRouteId)!;
        active.keyPoints = [];
        s.selectedKPId = null;
        s.playTime = 0;
        s.playing = false;
      });
      this.sm.enterEditMode();
      this.rebuildAll();
    });

    // 全局滑块
    $<HTMLInputElement>("swaySlider").addEventListener("input", (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      store.update((s) => {
        s.settings.headSwayDeg = Math.min(SWAY_MAX, Math.max(SWAY_MIN, v));
      });
    });
    $<HTMLInputElement>("fogSlider").addEventListener("input", (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      store.update((s) => (s.settings.fogEndPct = v));
      this.rebuildAll();
    });
    $<HTMLInputElement>("filletSlider").addEventListener("input", (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      store.update((s) => (s.settings.filletRadius = v));
      this.rebuildAll();
    });

    // 播放控制
    $("btnPlay").addEventListener("click", () => {
      if (store.state.playing) {
        store.update((s) => (s.playing = false));
      } else {
        this.play();
      }
    });
    $("btnStop").addEventListener("click", () => this.stop());
    $("rateGroup").addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".rate-btn");
      if (!btn) return;
      store.update((s) => (s.playbackRate = Number(btn.dataset.rate)));
    });

    // 导出
    $("btnExportJson").addEventListener("click", () => {
      const data = buildRouteJson(
        store.state,
        this.paths,
        new Date().toISOString()
      );
      downloadText("route.json", JSON.stringify(data, null, 2), "application/json");
    });
    $("btnExportTrack").addEventListener("click", () => {
      const csv = buildTrajectoryCsv(this.paths);
      downloadText("trajectory.csv", csv, "text/csv;charset=utf-8");
    });
  }

  // ---------- 全量渲染(状态驱动) ----------

  private render(): void {
    const s = store.state;

    // 工具按钮
    document.querySelectorAll<HTMLButtonElement>(".tool-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === s.tool);
    });
    document.querySelectorAll<HTMLButtonElement>(".rate-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        Number(btn.dataset.rate) === s.playbackRate
      );
    });
    $<HTMLInputElement>("swaySlider").value = String(s.settings.headSwayDeg);
    $("swayVal").textContent = `${s.settings.headSwayDeg.toFixed(1)}°`;
    $<HTMLInputElement>("fogSlider").value = String(s.settings.fogEndPct);
    $("fogVal").textContent = `${s.settings.fogEndPct}%`;
    $<HTMLInputElement>("filletSlider").value =
      String(s.settings.filletRadius);
    $("filletVal").textContent = `${s.settings.filletRadius.toFixed(1)}m`;

    this.renderRouteList();
    $<HTMLInputElement>("routeNameInput").value = store.activeRoute.name;
    this.renderKPList();
    this.renderKPEditor();
    this.sm.updateSelection(s);
    this.timeline.render(s, this.activePath);
    $("btnPlay").textContent = s.playing ? "❚❚ 暂停" : "▶ 播放";
  }

  private renderRouteList(): void {
    const s = store.state;
    const host = $("routeList");
    host.innerHTML = "";
    for (const route of s.routes) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className =
        "route-chip" + (route.id === s.activeRouteId ? " active" : "");
      chip.dataset.routeId = route.id;
      const [r, g, b] = route.color;
      chip.innerHTML = `<span class="swatch" style="background:rgb(${r * 255},${g * 255},${b * 255})"></span>${route.name.slice(0, 6)}`;
      host.appendChild(chip);
    }
  }

  private renderKPList(): void {
    const host = $("kpList");
    host.innerHTML = "";
    const route = store.activeRoute;
    const s = store.state;
    route.keyPoints.forEach((kp, i) => {
      const item = document.createElement("div");
      item.className = "kp-item" + (kp.id === s.selectedKPId ? " selected" : "");
      const gaze = kp.lookAtNodeId ? ` · 👁 ${nodeLabel(kp.lookAtNodeId)}` : "";
      item.innerHTML = `
        <span class="idx">${i + 1}</span>
        <span class="meta">
          <span class="name">${getNode(kp.nodeId).label}${gaze}</span>
          <span class="sub">${kp.time.toFixed(1)}s · FOV ${kp.fov}° · ${kp.speed}档</span>
        </span>
        <button class="del" title="删除">✕</button>`;
      item.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).classList.contains("del")) {
          store.update((s) => {
            const active = s.routes.find((r) => r.id === s.activeRouteId)!;
            const idx = active.keyPoints.findIndex((k) => k.id === kp.id);
            if (idx >= 0) active.keyPoints.splice(idx, 1);
            if (s.selectedKPId === kp.id) s.selectedKPId = null;
            s.playTime = 0;
          });
          this.rebuildAll();
        } else {
          this.selectKP(kp.id);
        }
      });
      host.appendChild(item);
    });
  }

  private renderKPEditor(): void {
    const host = $("kpEditor");
    const kp = store.selectedKP;
    if (!kp) {
      host.innerHTML = `<p class="kp-editor-empty">未选择关键点</p>`;
      return;
    }
    host.innerHTML = "";
    const nodeOpts = TUNNEL.nodes.map(
      (n) =>
        `<option value="${n.id}" ${n.id === kp.lookAtNodeId ? "selected" : ""}>${n.label}</option>`
    ).join("");

    const timeField = document.createElement("div");
    timeField.innerHTML = `
      <label>到达时间(s)</label>
      <input type="number" min="0" step="0.1" value="${kp.time}" data-kpfield="time" />`;
    const fovField = document.createElement("div");
    fovField.innerHTML = `
      <label>FOV 视场角(${FOV_MIN}°~${FOV_MAX}°)</label>
      <input type="number" min="${FOV_MIN}" max="${FOV_MAX}" step="1" value="${kp.fov}" data-kpfield="fov" />`;
    const gazeField = document.createElement("div");
    gazeField.innerHTML = `
      <label>注视点(留空=沿路径切线)</label>
      <select data-kpfield="gaze">
        <option value="">— 沿路径方向 —</option>
        ${nodeOpts}
      </select>`;
    const gearField = document.createElement("div");
    gearField.innerHTML = `
      <label>速度档位</label>
      <div class="gear-row">
        ${([1, 2, 3] as SpeedGear[])
          .map(
            (g) =>
              `<button type="button" class="btn gear-btn ${kp.speed === g ? "active" : ""}" data-gear="${g}">${g} 档</button>`
          )
          .join("")}
      </div>`;

    host.append(timeField, fovField, gazeField, gearField);

    host.querySelectorAll<HTMLElement>("[data-kpfield]").forEach((el) => {
      el.addEventListener("input", () => {
        const field = el.dataset.kpfield!;
        let gazeChanged = false;
        let timeChanged = false;
        store.update((s) => {
          const target = s.routes
            .find((r) => r.id === s.activeRouteId)!
            .keyPoints.find((k) => k.id === s.selectedKPId);
          if (!target) return;
          if (field === "time") {
            target.time = Math.max(0, Number((el as HTMLInputElement).value) || 0);
            timeChanged = true;
          }
          if (field === "fov")
            target.fov = clampFov(Number((el as HTMLInputElement).value) || FOV_MIN);
          if (field === "gaze") {
            target.lookAtNodeId = (el as HTMLSelectElement).value || null;
            gazeChanged = true;
          }
        });
        if (gazeChanged) this.rebuildAll();
        else if (timeChanged) this.timeline.render(store.state, this.activePath);
      });
    });
    host.querySelectorAll<HTMLElement>("[data-gear]").forEach((el) => {
      el.addEventListener("click", () => {
        const gear = Number(el.dataset.gear) as SpeedGear;
        store.update((s) => {
          const target = s.routes
            .find((r) => r.id === s.activeRouteId)!
            .keyPoints.find((k) => k.id === s.selectedKPId);
          if (target) target.speed = gear;
        });
      });
    });
  }
}

new AppController().init().catch((err) => {
  console.error(err);
  const badge = document.getElementById("engineBadge");
  if (badge) badge.textContent = "初始化失败,请查看控制台";
});

declare global {
  interface Window {
    mineCam?: {
      store: typeof store;
      getPaths: () => Map<string, RoutePath>;
      rebuild: () => void;
      play: () => void;
      seek: (t: number) => void;
      buildDemoRoute: () => void;
      getSceneMeshCount: (prefix: string) => number;
    };
  }
}
