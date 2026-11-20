<script setup lang="ts">
defineProps<{
  contactDepth: number
  maxDeformation: number
  contact: boolean
}>()

const fmt = (v: number) => v.toFixed(4)
</script>

<template>
  <div class="panel metric-panel">
    <div class="metric">
      <span class="metric-label">当前接触深度</span>
      <span class="metric-value warm">
        {{ fmt(contactDepth) }}<span class="metric-unit">单位</span>
      </span>
    </div>
    <div class="metric">
      <span class="metric-label">最大形变位移</span>
      <span class="metric-value">
        {{ fmt(maxDeformation) }}<span class="metric-unit">单位</span>
      </span>
    </div>
    <div class="metric">
      <span class="metric-label">接触状态</span>
      <span class="metric-value" :style="{ color: contact ? 'var(--accent-warm)' : 'var(--fg-dim)', fontSize: '18px' }">
        {{ contact ? '接触中' : '未接触' }}
      </span>
    </div>
  </div>
</template>
