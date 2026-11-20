<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { store, DEFAULT_PROFILE, scheduleCompute } from '../store';

const canvas = ref<HTMLCanvasElement>();
const coordText = ref('');
const W = 332;
const H = 240;
const MARGIN = 24;

let dragIdx = -1;
let scale = 20;
let ox = 0;
let oy = 0;

function computeTransform(): void {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of store.profile) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  scale = Math.min((W - MARGIN * 2) / w, (H - MARGIN * 2) / h);
  ox = W / 2 - ((minX + maxX) / 2) * scale;
  oy = H / 2 + ((minY + maxY) / 2) * scale;
}

const toScreen = (x: number, y: number): [number, number] => [x * scale + ox, -y * scale + oy];
const toWorld = (sx: number, sy: number): [number, number] => [
  (sx - ox) / scale,
  -(sy - oy) / scale,
];

function draw(): void {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  computeTransform();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#10141b';
  ctx.fillRect(0, 0, W, H);

  // 网格(1m)
  ctx.strokeStyle = '#222a36';
  ctx.lineWidth = 1;
  const step = Math.max(1, Math.round(24 / scale));
  const [wx0, wy1] = toWorld(0, 0);
  const [wx1, wy0] = toWorld(W, H);
  for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) {
    const [sx] = toScreen(x, 0);
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
  }
  for (let y = Math.floor(wy0 / step) * step; y <= wy1; y += step) {
    const [, sy] = toScreen(0, y);
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
  }
  // 轴线(中心)
  const [ax, ay] = toScreen(0, 0);
  ctx.strokeStyle = '#3a4a63';
  ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.stroke();

  // 多边形
  const pts = store.profile;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const [sx, sy] = toScreen(x, y);
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(245,166,35,0.12)';
  ctx.fill();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 顶点
  pts.forEach(([x, y], i) => {
    const [sx, sy] = toScreen(x, y);
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fillStyle = i === dragIdx ? '#ffe14d' : '#4da3ff';
    ctx.fill();
  });
}

function pickPoint(sx: number, sy: number): number {
  let best = -1;
  let bestD = 12;
  store.profile.forEach(([x, y], i) => {
    const [px, py] = toScreen(x, y);
    const d = Math.hypot(px - sx, py - sy);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

function nearestSegment(sx: number, sy: number): number {
  const pts = store.profile;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = toScreen(pts[i][0], pts[i][1]);
    const [bx, by] = toScreen(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1]);
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((sx - ax) * dx + (sy - ay) * dy) / len2));
    const d = Math.hypot(ax + t * dx - sx, ay + t * dy - sy);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function pos(e: MouseEvent): [number, number] {
  const r = canvas.value!.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

function onDown(e: MouseEvent): void {
  const [sx, sy] = pos(e);
  dragIdx = pickPoint(sx, sy);
}

function onMove(e: MouseEvent): void {
  if (dragIdx < 0) return;
  const [sx, sy] = pos(e);
  const [wx, wy] = toWorld(sx, sy);
  store.profile[dragIdx] = [Math.round(wx * 10) / 10, Math.round(wy * 10) / 10];
}

function onUp(): void {
  if (dragIdx >= 0) syncText();
  dragIdx = -1;
}

function onDblClick(e: MouseEvent): void {
  const [sx, sy] = pos(e);
  if (pickPoint(sx, sy) >= 0) return;
  const seg = nearestSegment(sx, sy);
  const [wx, wy] = toWorld(sx, sy);
  store.profile.splice(seg + 1, 0, [Math.round(wx * 10) / 10, Math.round(wy * 10) / 10]);
  syncText();
}

function onRightClick(e: MouseEvent): void {
  e.preventDefault();
  if (store.profile.length <= 3) return;
  const [sx, sy] = pos(e);
  const idx = pickPoint(sx, sy);
  if (idx >= 0) {
    store.profile.splice(idx, 1);
    syncText();
  }
}

function syncText(): void {
  coordText.value = store.profile.map(([x, y]) => `${x}, ${y}`).join('\n');
}

function applyText(): void {
  const pts: [number, number][] = [];
  for (const line of coordText.value.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const m = t.split(/[,\s]+/).map(Number);
    if (m.length >= 2 && m.every(Number.isFinite)) pts.push([m[0], m[1]]);
  }
  if (pts.length >= 3) {
    store.profile = pts;
  }
}

function resetDefault(): void {
  store.profile = DEFAULT_PROFILE.map((p) => [...p] as [number, number]);
}

watch(() => store.profile, () => { draw(); syncText(); }, { deep: true });

onMounted(() => {
  syncText();
  draw();
  // 首次绘制后确保计算触发(若本地无缓存)
  scheduleCompute();
});
</script>

<template>
  <div class="panel-section">
    <h3>断面轮廓</h3>
    <canvas
      ref="canvas"
      :width="W"
      :height="H"
      style="border-radius: 6px; cursor: crosshair; width: 100%"
      @mousedown="onDown"
      @mousemove="onMove"
      @mouseup="onUp"
      @mouseleave="onUp"
      @dblclick="onDblClick"
      @contextmenu="onRightClick"
    />
    <p class="hint">拖拽移动顶点 · 双击空白加点 · 右键删点</p>
    <textarea v-model="coordText" rows="5" spellcheck="false" @change="applyText" />
    <div class="btn-row" style="margin-top: 6px">
      <button @click="applyText">应用坐标</button>
      <button @click="resetDefault">恢复默认断面</button>
    </div>
  </div>
</template>
