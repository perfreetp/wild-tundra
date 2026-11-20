<template>
  <div class="app">
    <StatsBar />
    <div class="body">
      <TerrainView />
      <aside class="sidebar">
        <BrushPanel />
        <ExportPanel />
      </aside>
    </div>
  </div>
</template>

<script setup>
import StatsBar from './components/StatsBar.vue';
import TerrainView from './components/TerrainView.vue';
import BrushPanel from './components/BrushPanel.vue';
import ExportPanel from './components/ExportPanel.vue';
</script>
