<script setup lang="ts">
import { computed } from "vue";
import type { StudioStats } from "../babylon/studio";

const props = defineProps<{
  stats: StudioStats;
  length: string;
  showZones: boolean;
}>();

const emit = defineEmits<{ (e: "toggle-zones", v: boolean): void }>();

const fmtArea = (m2: number) => (m2 >= 10000 ? `${(m2 / 10000).toFixed(2)} 万m²` : `${Math.round(m2).toLocaleString()} m²`);
const fmtVol = (m3: number) =>
  m3 >= 10000 ? `${(m3 / 10000).toFixed(2)} 万m³` : `${Math.round(m3).toLocaleString()} m³`;
const ratio = computed(() => {
  const f = props.stats.fillVolume;
  const c = props.stats.cutVolume;
  if (c <= 0) return "—";
  return `1 : ${(f / c).toFixed(2)}`;
});
</script>

<template>
  <div class="card">
    <div class="card-head">
      <span class="card-title">工程概览</span>
      <label class="toggle" style="font-size: 10px">
        <input type="checkbox" :checked="showZones" @change="emit('toggle-zones', ($event.target as HTMLInputElement).checked)" />
        <span class="track" style="width: 24px; height: 13px"></span>
        <span>分区</span>
      </label>
    </div>
    <div class="stat-grid">
      <div class="stat">
        <div class="k">线路长度</div>
        <div class="v">{{ length }}<small>m</small></div>
      </div>
      <div class="stat">
        <div class="k">填挖比</div>
        <div class="v">{{ ratio }}</div>
      </div>
      <div class="stat">
        <div class="k">填方面积</div>
        <div class="v fill">{{ fmtArea(stats.fillArea) }}</div>
      </div>
      <div class="stat">
        <div class="k">挖方面积</div>
        <div class="v cut">{{ fmtArea(stats.cutArea) }}</div>
      </div>
      <div class="stat">
        <div class="k">填方体积</div>
        <div class="v fill">{{ fmtVol(stats.fillVolume) }}</div>
      </div>
      <div class="stat">
        <div class="k">挖方体积</div>
        <div class="v cut">{{ fmtVol(stats.cutVolume) }}</div>
      </div>
      <div class="stat">
        <div class="k">最大填高</div>
        <div class="v">{{ stats.maxFillDepth.toFixed(2) }}<small>m</small></div>
      </div>
      <div class="stat">
        <div class="k">最大挖深</div>
        <div class="v">{{ stats.maxCutDepth.toFixed(2) }}<small>m</small></div>
      </div>
    </div>
  </div>
</template>
