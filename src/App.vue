<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import LeftPanel from './components/LeftPanel.vue'
import MetricPanel from './components/MetricPanel.vue'
import HudPanel from './components/HudPanel.vue'
import HelpPanel from './components/HelpPanel.vue'
import { SceneManager, type ViewportStats } from './viewport/SceneManager'
import { HARDNESS_PROFILES, ORGANS, type HardnessLevel } from './shared/types'

const viewportRef = ref<HTMLDivElement | null>(null)
const scene = shallowRef<SceneManager | null>(null)
const loading = ref(true)
const wireframe = ref(false)
const activeOrganId = ref(ORGANS[0].id)
const hardness = ref<HardnessLevel>('medium')

const stats = reactive<ViewportStats>({
  fps: 0,
  bvhMs: 0,
  workerMs: 0,
  contactDepth: 0,
  maxDeformation: 0,
  contact: false,
  faceIndex: -1,
  boneCount: 0,
})

onMounted(async () => {
  const manager = new SceneManager(viewportRef.value!, (s) => {
    Object.assign(stats, s)
  })
  scene.value = manager
  manager.setHardness(HARDNESS_PROFILES[hardness.value])
  try {
    await manager.loadOrgan(ORGANS[0])
  } finally {
    loading.value = false
  }
})

async function selectOrgan(id: string): Promise<void> {
  if (id === activeOrganId.value || !scene.value || loading.value) return
  loading.value = true
  activeOrganId.value = id
  const desc = ORGANS.find((o) => o.id === id)!
  try {
    await scene.value.loadOrgan(desc)
  } finally {
    loading.value = false
  }
}

function selectHardness(level: HardnessLevel): void {
  hardness.value = level
  scene.value?.setHardness(HARDNESS_PROFILES[level])
}

function toggleWireframe(on: boolean): void {
  wireframe.value = on
  scene.value?.setWireframe(on)
}

onBeforeUnmount(() => {
  scene.value?.dispose()
})
</script>

<template>
  <div class="app-shell">
    <div ref="viewportRef" class="viewport-root" />

    <LeftPanel
      :organs="ORGANS"
      :active-organ-id="activeOrganId"
      :hardness="hardness"
      :wireframe="wireframe"
      :bone-count="stats.boneCount"
      @select-organ="selectOrgan"
      @select-hardness="selectHardness"
      @toggle-wireframe="toggleWireframe"
    />

    <MetricPanel
      :contact-depth="stats.contactDepth"
      :max-deformation="stats.maxDeformation"
      :contact="stats.contact"
    />

    <HudPanel :stats="stats" />
    <HelpPanel />

    <div v-if="loading" class="loading-mask">
      <span class="spinner" />
      正在构建 BVH 与预计算蒙皮权重…
    </div>
  </div>
</template>
