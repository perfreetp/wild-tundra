<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { Studio, type DisplayMode, type DragInfo, type StudioStats } from "./babylon/studio";
import { ProfileChart } from "./chart/profileChart";
import {
  createDefaultProject,
  downloadProject,
  deserializeProject,
  loadLocal,
  saveLocal,
} from "./core/project";
import { groundProfileAlong } from "./core/corridor";
import type { Corridor } from "./core/corridor";
import type { Project } from "./core/types";
import { formatChainage } from "./core/math";
import TopBar from "./components/TopBar.vue";
import StatsCard from "./components/StatsCard.vue";
import Inspector from "./components/Inspector.vue";
import ToastStack from "./components/ToastStack.vue";
import { pushToast } from "./components/toast";

const viewport = ref<HTMLCanvasElement | null>(null);
const overlay = ref<HTMLElement | null>(null);
const chartHost = ref<HTMLDivElement | null>(null);
const chartCanvas = ref<HTMLCanvasElement | null>(null);

const loading = ref(true);
const fatal = ref<string | null>(null);
const engineLabel = ref("WebGPU");
const displayMode = ref<DisplayMode>("both");
const showZones = ref(true);
const showHandles = ref(true);
const projectName = ref("示例线路");
const stats = ref<StudioStats>({
  fillArea: 0, cutArea: 0, fillCells: 0, cutCells: 0, maxFill: 0, maxCut: 0,
  maxToe: 0, fillVolume: 0, cutVolume: 0, maxFillDepth: 0, maxCutDepth: 0, length: 0,
});
const selected = ref<DragInfo>({ kind: null, id: null });
const planSnapshot = shallowRef<{
  id: string; x: number; z: number; radius: number; index: number;
  station: number; actualRadius: number; isEnd: boolean;
} | null>(null);
const profileSnapshot = shallowRef<{
  id: string; s: number; y: number; index: number;
  gradeBefore: number; gradeAfter: number;
} | null>(null);

/** 从 studio 的实时模型生成不可变快照，供响应式面板使用 */
function refreshSnapshots() {
  const sel = selected.value;
  if (!studio || !sel.id) {
    planSnapshot.value = null;
    profileSnapshot.value = null;
    return;
  }
  const proj = studio.getProject();
  const corridor = studio.getCorridor();
  if (sel.kind === "plan") {
    const idx = proj.plan.findIndex((q) => q.id === sel.id);
    const p = proj.plan[idx];
    planSnapshot.value = p
      ? {
          id: p.id,
          x: p.x,
          z: p.z,
          radius: p.radius,
          index: idx,
          station: corridor?.plan.controlStations[idx] ?? 0,
          actualRadius: corridor?.plan.controlRadii[idx] ?? 0,
          isEnd: idx === 0 || idx === proj.plan.length - 1,
        }
      : null;
    profileSnapshot.value = null;
  } else if (sel.kind === "profile") {
    const idx = proj.profile.findIndex((q) => q.id === sel.id);
    const p = proj.profile[idx];
    let gradeBefore = 0;
    let gradeAfter = 0;
    if (p && corridor) {
      if (idx > 0) gradeBefore = corridor.profile.evalGrade(p.s - 0.01);
      if (idx < corridor.profile.points.length - 1) gradeAfter = corridor.profile.evalGrade(p.s + 0.01);
    }
    profileSnapshot.value = p
      ? { id: p.id, s: p.s, y: p.y, index: idx, gradeBefore, gradeAfter }
      : null;
    planSnapshot.value = null;
  } else {
    planSnapshot.value = null;
    profileSnapshot.value = null;
  }
}
const profileSummary = shallowRef<{
  points: { id: string; s: number; y: number; grade: number }[];
  maxGrade: number;
  maxGradeS: number;
  segments: { s0: number; s1: number; grade: number; y0: number; y1: number }[];
}>({ points: [], maxGrade: 0, maxGradeS: 0, segments: [] });
const ballastWidth = ref(4.4);
const maxGradePermille = ref(25);
const exaggeration = ref(1.5);
const gradeOverLimit = computed(
  () => Math.abs(profileSummary.value.maxGrade) * 1000 > maxGradePermille.value + 0.05
);
const viewTick = ref(0);

let studio: Studio | null = null;
let chart: ProfileChart | null = null;
let autosaveTimer: number | undefined;
let currentProject: Project | null = null;

const selectedPlan = computed(() => {
  const snap = planSnapshot.value;
  if (selected.value.kind !== "plan" || !selected.value.id || !snap) return null;
  if (snap.id !== selected.value.id) return null;
  return snap;
});

const selectedProfile = computed(() => {
  const snap = profileSnapshot.value;
  if (selected.value.kind !== "profile" || !selected.value.id || !snap) return null;
  if (snap.id !== selected.value.id) return null;
  return snap;
});

function refreshSummary() {
  if (!studio) return;
  const corridor = studio.getCorridor();
  if (!corridor) return;
  const segs = corridor.profile.segments;
  const maxSeg = segs[corridor.profile.maxGradeSegment];
  profileSummary.value = {
    points: corridor.profile.points.map((p) => ({
      id: p.id,
      s: p.s,
      y: p.y,
      grade: corridor.profile.evalGrade(p.s + 0.5),
    })),
    maxGrade: corridor.profile.maxGrade,
    maxGradeS: maxSeg ? (maxSeg.s0 + maxSeg.s1) / 2 : 0,
    segments: segs.map((s) => ({ s0: s.s0, s1: s.s1, grade: s.grade, y0: s.y0, y1: s.y1 })),
  };
  viewTick.value++;
}

function onCorridor(payload: {
  corridor: Corridor;
  stats: StudioStats;
  selected: DragInfo;
}) {
  stats.value = payload.stats;
  selected.value = payload.selected;
  refreshSnapshots();
  refreshSummary();
  if (chart && currentProject) {
    chart.setData(payload.corridor, groundProfileAlong(payload.corridor, currentProject.terrain));
    chart.setState({ exaggeration: exaggeration.value });
  }
  scheduleAutosave();
}

function onSelect(info: DragInfo) {
  selected.value = info;
  refreshSnapshots();
  chart?.setState({ selectedId: info.kind === "profile" ? info.id : null });
}

function scheduleAutosave() {
  if (!studio) return;
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    if (!studio) return;
    const p = studio.getProject();
    p.name = projectName.value;
    saveLocal(p);
  }, 900);
}

function onDisplayMode(mode: DisplayMode) {
  displayMode.value = mode;
  studio?.setDisplayMode(mode);
}

function onToggleZones(v: boolean) {
  showZones.value = v;
  studio?.setShowZones(v);
}

function onToggleHandles(v: boolean) {
  showHandles.value = v;
  studio?.setHandlesVisible(v);
}

function onBallastWidth(v: number) {
  ballastWidth.value = v;
  studio?.setSettings({ ballastWidth: v });
}

function onRadius(v: number) {
  if (!selected.value.id) return;
  studio?.setRadius(selected.value.id, v);
}

function onNumberField(field: "x" | "z" | "s" | "y", value: number) {
  if (!studio || !selected.value.id) return;
  if (field === "x" || field === "z") {
    const p = studio.getProject().plan.find((q) => q.id === selected.value.id);
    if (!p) return;
    studio.setPlanPoint(p.id, field === "x" ? value : p.x, field === "z" ? value : p.z);
  } else {
    const p = studio.getProject().profile.find((q) => q.id === selected.value.id);
    if (!p) return;
    studio.setProfilePoint(p.id, field === "s" ? value : p.s, field === "y" ? value : p.y);
  }
}

function addPlan() {
  if (!studio) return;
  const id = studio.addPlanPoint();
  if (!id) pushToast("相邻控制点过近，无法再插入", "err");
  else pushToast("已插入平面控制点");
}

function addProfile() {
  if (!studio) return;
  const id = studio.addProfilePoint();
  if (!id) pushToast("纵断面控制点过密，无法再插入", "err");
  else pushToast("已插入纵断面变坡点");
}

function deleteSelected() {
  if (!studio || !selected.value.id) return;
  if (selected.value.kind === "plan") {
    const ok = studio.removePlanPoint(selected.value.id);
    pushToast(ok ? "已删除平面控制点" : "首末控制点不可删除", ok ? "ok" : "err");
  } else if (selected.value.kind === "profile") {
    const ok = studio.removeProfilePoint(selected.value.id);
    pushToast(ok ? "已删除变坡点" : "至少保留两个变坡点", ok ? "ok" : "err");
  }
}

function fitProfile() {
  studio?.fitProfileToGround();
  pushToast("已按地形重新拟合纵断面", "ok");
}

function focusView() {
  studio?.focusOnAlignment();
}

async function doExport() {
  if (!studio) return;
  const p = studio.getProject();
  p.name = projectName.value;
  const safe = projectName.value.replace(/[\\/:*?"<>|]/g, "_").slice(0, 40) || "rail-project";
  downloadProject(p, `${safe}.rts.json`);
  pushToast("已导出项目文件（地形 + 线路控制点）", "ok");
}

const fileInput = ref<HTMLInputElement | null>(null);

function triggerImport() {
  fileInput.value?.click();
}

async function onFileChosen(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !studio) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const project = deserializeProject(parsed);
    applyProject(project);
    pushToast(`已导入“${project.name}”，轨道与挖填方已重算`, "ok");
  } catch (err) {
    pushToast(`导入失败：${(err as Error).message}`, "err");
  }
}

function applyProject(project: Project) {
  if (!studio) return;
  currentProject = project;
  projectName.value = project.name;
  ballastWidth.value = project.settings.ballastWidth;
  maxGradePermille.value = project.settings.maxGradePermille;
  studio.setProject(project);
  studio.setDisplayMode(displayMode.value);
  studio.setShowZones(showZones.value);
  studio.setHandlesVisible(showHandles.value);
  studio.focusOnAlignment();
  selected.value = { kind: null, id: null };
  chart?.setState({ selectedId: null });
  scheduleAutosave();
}

function loadSample() {
  const p = createDefaultProject();
  applyProject(p);
  pushToast("已载入示例地形与线路", "ok");
}

function onChartDrag(id: string, s: number, y: number) {
  if (!studio) return;
  studio.setProfilePoint(id, s, y);
}

function onChartHover(id: string | null) {
  void id;
}

function onExaggeration(v: number) {
  exaggeration.value = v;
  chart?.setState({ exaggeration: v });
}

onMounted(async () => {
  if (!viewport.value || !overlay.value) return;
  if (!("gpu" in navigator)) {
    fatal.value =
      "当前浏览器不支持 WebGPU。请使用 Chrome / Edge 113+ 等支持 WebGPU 的浏览器打开，并确认已启用硬件加速。";
    loading.value = false;
    return;
  }
  const adapter = await (navigator as any).gpu?.requestAdapter?.();
  if (!adapter) {
    fatal.value =
      "无法获取 WebGPU 适配器。请检查浏览器是否已开启 WebGPU（chrome://flags/#enable-unsafe-webgpu），或改用支持 WebGPU 的设备。";
    loading.value = false;
    return;
  }

  const project = loadLocal() ?? createDefaultProject();
  currentProject = project;

  chart = new ProfileChart(chartCanvas.value!, {
    onHover: onChartHover,
    onSelect: (id) => {
      studio?.select({ kind: id ? "profile" : null, id });
    },
    onDragStart: (id) => {
      studio?.select({ kind: "profile", id });
    },
    onDrag: onChartDrag,
    onDragEnd: () => {
      refreshSummary();
    },
  });

  studio = new Studio(viewport.value, overlay.value, {
    onCorridor,
    onSelect,
  });

  try {
    await studio.init(project);
  } catch (err) {
    fatal.value = `WebGPU 引擎初始化失败：${(err as Error).message}`;
    loading.value = false;
    return;
  }

  if (import.meta.env.DEV) {
    (window as any).__chart = chart;
  }
  engineLabel.value = studio.engine.isWebGPU ? "WebGPU" : "WebGL";
  projectName.value = project.name;
  ballastWidth.value = project.settings.ballastWidth;
  maxGradePermille.value = project.settings.maxGradePermille;
  loading.value = false;
  requestAnimationFrame(() => {
    studio?.resize();
    chart?.resize();
    studio?.focusOnAlignment();
  });

  window.addEventListener("keydown", onKey);
});

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === "Delete" || e.key === "Backspace") {
    if (selected.value.id) {
      e.preventDefault();
      deleteSelected();
    }
  } else if (e.key === "1") onDisplayMode("both");
  else if (e.key === "2") onDisplayMode("terrain");
  else if (e.key === "3") onDisplayMode("track");
  else if (e.key === "f" || e.key === "F") focusView();
  else if (e.key === "Escape") studio?.select({ kind: null, id: null });
}

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  window.clearTimeout(autosaveTimer);
  chart?.dispose();
  studio?.dispose();
});

const displayLength = computed(() => stats.value.length.toFixed(1));
const modeItems: { id: DisplayMode; label: string; icon: string }[] = [
  { id: "both", label: "融合视图", icon: "◧" },
  { id: "terrain", label: "仅地形", icon: "▲" },
  { id: "track", label: "仅轨道", icon: "═" },
];
</script>

<template>
  <div class="app-shell">
    <TopBar
      :model-value="projectName"
      :display-mode="displayMode"
      :items="modeItems"
      @update:model-value="projectName = $event; scheduleAutosave()"
      @mode="onDisplayMode"
      @focus="focusView"
      @export="doExport"
      @import="triggerImport"
      @sample="loadSample"
    />

    <main class="stage">
      <canvas id="viewport" ref="viewport"></canvas>
      <div class="scene-overlay" ref="overlay"></div>

      <div class="hud hud-top-left">
        <StatsCard
          :stats="stats"
          :length="displayLength"
          :show-zones="showZones"
          @toggle-zones="onToggleZones"
        />
      </div>

      <div class="hud hud-top-right">
        <div class="engine-badge"><span class="dot"></span>{{ engineLabel }} 引擎</div>
        <div class="card" style="min-width: 214px">
          <div class="card-body" style="display: flex; flex-direction: column; gap: 10px">
            <div class="card-title" style="margin-bottom: 2px">显示</div>
            <label class="toggle">
              <input type="checkbox" :checked="showZones" @change="onToggleZones(($event.target as HTMLInputElement).checked)" />
              <span class="track"></span>
              <span>挖填方分区着色</span>
            </label>
            <label class="toggle">
              <input type="checkbox" :checked="showHandles" @change="onToggleHandles(($event.target as HTMLInputElement).checked)" />
              <span class="track"></span>
              <span>控制点手柄</span>
            </label>
            <div class="hr" style="margin: 2px 0"></div>
            <div class="legend">
              <span class="swatch fill"></span>填方
              <span class="swatch cut" style="margin-left: 8px"></span>挖方
            </div>
            <div class="legend">
              <span class="swatch boundary"></span>挖填分界线
            </div>
          </div>
        </div>
      </div>

      <div class="hud hud-bottom-left">
        <div class="hint">
          <div><b>拖动</b> 橙色球 = 平面走向 · 蓝色菱标 = 纵断面高程</div>
          <div>
            <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 切换视图 · <kbd>F</kbd> 适配线路 ·
            <kbd>Del</kbd> 删除选中
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div>
          <div class="boot-mark"></div>
          <div class="boot-text">正在初始化 WebGPU 引擎，生成地形…</div>
        </div>
      </div>

      <div v-if="fatal" class="error-panel">
        <div class="card">
          <h2>无法启动渲染引擎</h2>
          <p>{{ fatal }}</p>
          <code>{{ fatal }}</code>
        </div>
      </div>
    </main>

    <section class="bottom">
      <div class="chart-wrap" ref="chartHost">
        <div class="chart-head">
          <span class="chart-title">纵断面 · 坡度图</span>
          <span
            class="chart-pill mono"
            :class="{ over: gradeOverLimit }"
            v-if="profileSummary.maxGrade"
            :title="gradeOverLimit ? `超过设计限坡 ${maxGradePermille}‰` : '最大坡度'"
          >
            {{ gradeOverLimit ? "⚠ " : "" }}最大坡度
            {{ (profileSummary.maxGrade * 1000).toFixed(1) }}‰ @
            {{ formatChainage(profileSummary.maxGradeS) }}
          </span>
          <span class="chart-pill mono">{{ profileSummary.points.length }} 个变坡点</span>
          <span class="spacer" style="flex: 1"></span>
          <div class="exag" title="竖向放大，便于观察坡度变化">
            <span>竖向</span>
            <input type="range" min="1" max="6" step="0.5" :value="exaggeration"
              :style="{ '--pct': ((exaggeration - 1) / 5) * 100 + '%' }"
              @input="onExaggeration(parseFloat(($event.target as HTMLInputElement).value))" />
            <span class="mono">{{ exaggeration.toFixed(1) }}×</span>
          </div>
          <button class="icon-btn" title="插入变坡点" @click="addProfile">＋</button>
          <button class="icon-btn" title="按地形重新拟合纵断面" @click="fitProfile">⌁</button>
        </div>
        <canvas ref="chartCanvas"></canvas>
      </div>

      <Inspector
        :selected="selected"
        :plan-point="selectedPlan"
        :profile-point="selectedProfile"
        :ballast-width="ballastWidth"
        :stats="stats"
        @ballast="onBallastWidth"
        @radius="onRadius"
        @add-plan="addPlan"
        @add-profile="addProfile"
        @delete="deleteSelected"
        @field="onNumberField"
      />
    </section>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      style="display: none"
      @change="onFileChosen"
    />
    <ToastStack />
  </div>
</template>
