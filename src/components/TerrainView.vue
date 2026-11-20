<template>
  <canvas ref="canvasRef" class="terrain-canvas"></canvas>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { createTerrainApp } from '../terrain/engine.js';

const canvasRef = ref(null);
let app = null;

onMounted(() => {
  app = createTerrainApp(canvasRef.value);
});

onBeforeUnmount(() => {
  app?.dispose();
  app = null;
});
</script>
