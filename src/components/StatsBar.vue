<template>
  <header class="stats-bar">
    <span class="title">溯溪峡谷地形雕刻器</span>
    <span class="stat">当前笔刷 <b :class="'brush-' + store.brush">{{ brushLabel }}</b></span>
    <span class="stat">影响格数 <b>{{ store.affectedCells }}</b></span>
    <span class="stat">最高海拔 <b>{{ store.maxAlt.toFixed(1) }} m</b></span>
    <span class="stat">最低海拔 <b>{{ store.minAlt.toFixed(1) }} m</b></span>
    <span class="stat">FPS <b>{{ store.fps }}</b></span>
    <span class="spacer"></span>
    <button :disabled="!store.canUndo" title="Ctrl+Z" @click="undo">撤销</button>
    <button :disabled="!store.canRedo" title="Ctrl+Y" @click="redo">重做</button>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { store, BRUSHES } from '../store.js';
import { getApp } from '../terrain/engine.js';

const brushLabel = computed(() => BRUSHES[store.brush]);
const undo = () => getApp()?.undo();
const redo = () => getApp()?.redo();
</script>
