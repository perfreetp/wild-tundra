<script setup lang="ts">
import { computed } from "vue";
import type { DragInfo, StudioStats } from "../babylon/studio";
import { formatChainage } from "../core/math";

const props = defineProps<{
  selected: DragInfo;
  planPoint: {
    id: string;
    x: number;
    z: number;
    radius: number;
    index: number;
    station: number;
    actualRadius: number;
    isEnd: boolean;
  } | null;
  profilePoint: {
    id: string;
    s: number;
    y: number;
    index: number;
    gradeBefore: number;
    gradeAfter: number;
  } | null;
  ballastWidth: number;
  stats: StudioStats;
}>();

const emit = defineEmits<{
  (e: "ballast", v: number): void;
  (e: "radius", v: number): void;
  (e: "add-plan"): void;
  (e: "add-profile"): void;
  (e: "delete"): void;
  (e: "field", field: "x" | "z" | "s" | "y", value: number): void;
}>();

const ballastPct = computed(() => ((props.ballastWidth - 3) / (8 - 3)) * 100);
const radiusPct = computed(() => {
  const r = props.planPoint?.radius ?? 0;
  return (Math.min(2500, Math.max(0, r)) / 2500) * 100;
});

function num(e: Event): number {
  const v = parseFloat((e.target as HTMLInputElement).value);
  return Number.isFinite(v) ? v : 0;
}

const gradeText = (g: number) => `${g >= 0 ? "+" : ""}${(g * 1000).toFixed(1)}‰`;

const radiusHint = computed(() => {
  const p = props.planPoint;
  if (!p) return "";
  if (p.isEnd) return "端点不可设置曲线";
  if (p.radius <= 0.5) return "折线转角（无圆曲线）";
  const diff = Math.abs(p.radius - p.actualRadius);
  if (diff > Math.max(2, p.radius * 0.02)) {
    return `受相邻边长限制，实际 R=${p.actualRadius.toFixed(0)} m`;
  }
  return `实际 R=${p.actualRadius.toFixed(0)} m`;
});
</script>

<template>
  <aside class="inspector scroll-thin">
    <template v-if="selected.kind === 'plan' && planPoint">
      <h3>
        平面控制点 <span class="chip plan">{{ planPoint.id }}</span>
      </h3>
      <div class="row">
        <label>里程</label>
        <span class="val mono">{{ formatChainage(planPoint.station) }}</span>
      </div>
      <div class="row">
        <label>东坐标 X</label>
        <input class="num-input" type="number" step="1" :value="planPoint.x.toFixed(1)" @change="emit('field', 'x', num($event))" />
      </div>
      <div class="row">
        <label>北坐标 Z</label>
        <input class="num-input" type="number" step="1" :value="planPoint.z.toFixed(1)" @change="emit('field', 'z', num($event))" />
      </div>
      <div class="hr"></div>
      <h3>圆曲线半径</h3>
      <div class="row">
        <input
          type="range"
          min="0"
          max="2500"
          step="10"
          :value="planPoint.radius"
          :disabled="planPoint.isEnd"
          :style="{ '--pct': radiusPct + '%' }"
          @input="emit('radius', num($event))"
        />
        <input
          class="num-input"
          type="number"
          min="0"
          step="50"
          :value="Math.round(planPoint.radius)"
          :disabled="planPoint.isEnd"
          @change="emit('radius', num($event))"
        />
      </div>
      <div class="row" style="margin-top: -2px">
        <span style="font-size: 10.5px; color: var(--fg-faint)">{{ radiusHint }}</span>
      </div>
      <div class="hr"></div>
      <div class="btn-row">
        <button class="btn" @click="emit('add-plan')">+ 在最长段插入</button>
        <button class="btn danger" :disabled="planPoint.isEnd" @click="emit('delete')">删除此点</button>
      </div>
    </template>

    <template v-else-if="selected.kind === 'profile' && profilePoint">
      <h3>
        纵断面变坡点 <span class="chip prof">{{ profilePoint.id }}</span>
      </h3>
      <div class="row">
        <label>里程</label>
        <input class="num-input" type="number" step="1" :value="profilePoint.s.toFixed(1)" @change="emit('field', 's', num($event))" />
      </div>
      <div class="row">
        <label>轨顶高程</label>
        <input class="num-input" type="number" step="0.1" :value="profilePoint.y.toFixed(2)" @change="emit('field', 'y', num($event))" />
      </div>
      <div class="hr"></div>
      <div class="row">
        <label>前坡</label>
        <span class="val mono" :style="{ color: profilePoint.gradeBefore > 0 ? '#f0b445' : '#67bff0' }">
          {{ gradeText(profilePoint.gradeBefore) }}
        </span>
      </div>
      <div class="row">
        <label>后坡</label>
        <span class="val mono" :style="{ color: profilePoint.gradeAfter > 0 ? '#f0b445' : '#67bff0' }">
          {{ gradeText(profilePoint.gradeAfter) }}
        </span>
      </div>
      <div class="row">
        <label>坡度代数差</label>
        <span class="val mono">{{ gradeText(profilePoint.gradeAfter - profilePoint.gradeBefore) }}</span>
      </div>
      <div class="hr"></div>
      <div class="btn-row">
        <button class="btn" @click="emit('add-profile')">+ 插入变坡点</button>
        <button class="btn danger" @click="emit('delete')">删除此点</button>
      </div>
    </template>

    <template v-else>
      <h3>参数</h3>
      <div class="row">
        <label>道床顶宽</label>
        <span class="val mono">{{ ballastWidth.toFixed(2) }} m</span>
      </div>
      <div class="row">
        <input
          type="range"
          min="3"
          max="8"
          step="0.05"
          :value="ballastWidth"
          :style="{ '--pct': ballastPct + '%' }"
          @input="emit('ballast', num($event))"
        />
      </div>
      <div class="hr"></div>
      <div class="row">
        <label>最大填高</label>
        <span class="val mono">{{ stats.maxFillDepth.toFixed(2) }} m</span>
      </div>
      <div class="row">
        <label>最大挖深</label>
        <span class="val mono">{{ stats.maxCutDepth.toFixed(2) }} m</span>
      </div>
      <div class="row">
        <label>最大坡脚偏移</label>
        <span class="val mono">{{ stats.maxToe.toFixed(1) }} m</span>
      </div>
      <div class="hr"></div>
      <div class="empty-tip" style="padding: 12px 4px; text-align: left">
        在场景中点击任意控制点手柄，或点击下方纵断面图中的圆点即可编辑。空白处拖动可旋转视角，滚轮缩放。
      </div>
    </template>
  </aside>
</template>
