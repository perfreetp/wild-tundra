<script setup lang="ts">
import type { ViewportStats } from '../viewport/SceneManager'

defineProps<{ stats: ViewportStats }>()

const fpsClass = (fps: number) => (fps >= 50 ? 'good' : fps >= 30 ? 'warn' : 'warn')
const bvhClass = (ms: number) => (ms <= 1 ? 'good' : ms <= 3 ? 'warn' : 'warn')
</script>

<template>
  <div class="panel hud-panel">
    <h2 class="panel-title">实时性能</h2>
    <div class="hud-row">
      <span class="label">帧率 FPS</span>
      <span class="value" :class="fpsClass(stats.fps)">{{ stats.fps.toFixed(1) }}</span>
    </div>
    <div class="hud-row">
      <span class="label">BVH 求交耗时</span>
      <span class="value" :class="bvhClass(stats.bvhMs)">{{ stats.bvhMs.toFixed(3) }} ms</span>
    </div>
    <div class="hud-row">
      <span class="label">Worker 形变耗时</span>
      <span class="value">{{ stats.workerMs.toFixed(3) }} ms</span>
    </div>
    <hr class="divider" />
    <div class="hud-row">
      <span class="label">命中三角形</span>
      <span class="value">{{ stats.faceIndex >= 0 ? '#' + stats.faceIndex : '—' }}</span>
    </div>
    <div class="hud-row">
      <span class="label">蒙皮骨骼数</span>
      <span class="value">{{ stats.boneCount }}</span>
    </div>
  </div>
</template>
