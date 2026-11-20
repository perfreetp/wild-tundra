<template>
  <div class="app-shell">
    <TopBar />
    <SketchPanel />

    <main class="stage" ref="stageEl">
      <canvas ref="canvasEl"></canvas>

      <LabelOverlay />

      <div v-if="state.collisions.length" class="collision-banner">
        🔴 有 {{ state.collisions.length }} 块积木穿模啦,拖开一点吧!
      </div>

      <div class="hint-bar">{{ state.hint }}</div>
    </main>

    <BlockPanel />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { StudioEngine } from './lib/StudioEngine.js'
import { setEngine, state, actions } from './composables/useStudio.js'
import TopBar from './components/TopBar.vue'
import SketchPanel from './components/SketchPanel.vue'
import BlockPanel from './components/BlockPanel.vue'
import LabelOverlay from './components/LabelOverlay.vue'

const canvasEl = ref(null)
let engine = null

onMounted(() => {
  engine = new StudioEngine(canvasEl.value)
  setEngine(engine)
  // 便于测试与调试内省(只读观察,不绕过正常交互)
  if (import.meta.env.DEV) window.__studio = { engine }

  window.addEventListener('keydown', onKey)
})

function onKey(e) {
  if (e.target.tagName === 'INPUT') return
  if (e.key === 'Enter') {
    if (state.draft.gap) actions.closeGapWith()
    else actions.addPointAtPreview()
  }
  if (e.key === 'Backspace') actions.undoPoint()
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  engine?.dispose()
})
</script>
