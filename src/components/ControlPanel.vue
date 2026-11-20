<script setup lang="ts">
import { computed, ref } from 'vue';
import { store, play, pause, exportJSON, importJSON, totalLength } from '../store';

const fileInput = ref<HTMLInputElement>();

const volumeRatio = computed(() => {
  if (!store.initialVolume || store.steps.length === 0) return 1;
  return (store.steps[store.currentStep]?.volume ?? store.initialVolume) / store.initialVolume;
});

const stepRatio = computed(() =>
  store.totalSteps > 0 ? store.currentStep / store.totalSteps : 0,
);

function onFile(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) importJSON(f);
  (e.target as HTMLInputElement).value = '';
}
</script>

<template>
  <div class="panel-section">
    <h3>开挖步序</h3>
    <div class="row">
      <label>步长</label>
      <input type="range" min="1" max="5" step="0.5" v-model.number="store.stepLength" />
      <output>{{ store.stepLength.toFixed(1) }} m</output>
    </div>
    <div class="row">
      <label>总步数</label>
      <input type="range" min="3" max="20" step="1" v-model.number="store.totalSteps" />
      <output>{{ store.totalSteps }} 步</output>
    </div>
    <div class="row">
      <label>剖切角度</label>
      <input type="range" min="0" max="360" step="1" v-model.number="store.cutAngle" />
      <output>{{ store.cutAngle }}°</output>
    </div>
    <div class="row">
      <label>平面倾角</label>
      <input type="range" min="0" max="60" step="1" v-model.number="store.tiltAngle" />
      <output>{{ store.tiltAngle }}°</output>
    </div>
    <p class="hint">总进尺 {{ totalLength().toFixed(1) }} m;倾角为 0 时剖切面垂直于轴线,旋转角无视觉效果。</p>
  </div>

  <div class="panel-section">
    <h3>施工进度</h3>
    <div class="progress-outer">
      <div class="progress-inner" :style="{ width: `${stepRatio * 100}%` }" />
    </div>
    <div class="progress-labels">
      <span>步序 {{ store.currentStep }} / {{ store.totalSteps }}</span>
      <span>剩余体积 {{ (volumeRatio * 100).toFixed(1) }}%</span>
    </div>
    <div class="step-slider-row">
      <input
        type="range"
        min="0"
        :max="store.totalSteps"
        step="1"
        v-model.number="store.currentStep"
        style="flex: 1"
      />
    </div>
    <div class="btn-row" style="margin-top: 8px">
      <button class="primary" v-if="!store.playing" @click="play" :disabled="store.steps.length === 0">▶ 回放</button>
      <button class="primary" v-else @click="pause">⏸ 暂停</button>
      <button @click="store.currentStep = 0">⏮ 复位</button>
      <button @click="store.currentStep = store.totalSteps">⏭ 完成</button>
    </div>
    <div class="row" style="margin-top: 8px">
      <label style="width: auto">
        <input type="checkbox" v-model="store.showGhost" /> 显示已开挖部分
      </label>
    </div>
  </div>

  <div class="panel-section">
    <h3>保存 / 分享</h3>
    <div class="btn-row">
      <button @click="exportJSON">导出 JSON</button>
      <button @click="fileInput?.click()">导入 JSON</button>
      <input ref="fileInput" type="file" accept=".json,application/json" style="display: none" @change="onFile" />
    </div>
    <p class="hint">参数、断面与剖切角度自动保存到浏览器本地;导入 JSON 后自动按步序回放。</p>
    <div class="status-line" :class="{ error: store.statusError }">{{ store.status }}</div>
  </div>
</template>
