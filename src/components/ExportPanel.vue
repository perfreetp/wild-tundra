<template>
  <section class="panel">
    <h2>高度图导出</h2>
    <button class="wide" @click="doExport">导出 heightmap.png + JSON</button>
    <label class="wide import-btn">
      导入高度图(PNG / PNG+JSON)
      <input type="file" multiple accept=".png,.json" hidden @change="doImport" />
    </label>
    <button class="wide secondary" @click="reset">重新生成峡谷</button>
    <p v-if="store.message" class="msg">{{ store.message }}</p>
  </section>
</template>

<script setup>
import { store } from '../store.js';
import { getApp } from '../terrain/engine.js';

const doExport = () => getApp()?.exportHeightmap();
const doImport = (e) => {
  const app = getApp();
  if (app && e.target.files.length) app.importFiles(e.target.files);
  e.target.value = '';
};
const reset = () => getApp()?.resetTerrain();
</script>
