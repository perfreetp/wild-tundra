<template>
  <section class="panel">
    <h2>笔刷面板</h2>
    <div class="brush-types">
      <button
        v-for="(label, key) in BRUSHES"
        :key="key"
        :class="['brush-btn', 'brush-' + key, { active: store.brush === key }]"
        @click="store.brush = key"
      >
        {{ label }}
      </button>
    </div>

    <div class="slider-row">
      <label>强度 <b>{{ store.strength }}</b></label>
      <input type="range" min="0" max="100" step="1" v-model.number="store.strength" />
    </div>

    <div class="slider-row">
      <label>半径 <b>{{ store.radius }} 格</b></label>
      <input type="range" min="1" max="64" step="1" v-model.number="store.radius" />
    </div>

    <p class="hint">
      左键拖动雕刻 · 右键环绕 · 滚轮缩放<br />
      Ctrl+右键平移 · 1/2/3 切换笔刷 · Ctrl+Z/Y 撤销重做
    </p>
  </section>
</template>

<script setup>
import { store, BRUSHES } from '../store.js';
</script>
