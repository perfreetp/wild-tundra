<script setup lang="ts">
import type { HardnessLevel, OrganDescriptor } from '../shared/types'

defineProps<{
  organs: OrganDescriptor[]
  activeOrganId: string
  hardness: HardnessLevel
  wireframe: boolean
  boneCount: number
}>()

const emit = defineEmits<{
  (e: 'select-organ', id: string): void
  (e: 'select-hardness', level: HardnessLevel): void
  (e: 'toggle-wireframe', on: boolean): void
}>()

const hardnessOptions: { value: HardnessLevel; label: string }[] = [
  { value: 'soft', label: '软' },
  { value: 'medium', label: '中' },
  { value: 'hard', label: '硬' },
]

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`
</script>

<template>
  <aside class="panel left-panel">
    <div>
      <h2 class="panel-title">器官模型</h2>
      <div class="organ-list">
        <div
          v-for="organ in organs"
          :key="organ.id"
          class="organ-item"
          :class="{ active: organ.id === activeOrganId }"
          @click="emit('select-organ', organ.id)"
        >
          <span class="organ-swatch" :style="{ background: hex(organ.color) }" />
          <div>
            <div class="organ-name">{{ organ.name }}</div>
            <div class="organ-en">{{ organ.englishName }}</div>
          </div>
        </div>
      </div>
    </div>

    <hr class="divider" />

    <div>
      <h2 class="panel-title">组织硬度</h2>
      <div class="segmented">
        <button
          v-for="opt in hardnessOptions"
          :key="opt.value"
          :class="{ active: hardness === opt.value }"
          @click="emit('select-hardness', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <hr class="divider" />

    <div class="toggle-row">
      <span>网格线框叠加</span>
      <button
        class="switch"
        :class="{ on: wireframe }"
        :aria-pressed="wireframe"
        @click="emit('toggle-wireframe', !wireframe)"
      />
    </div>

    <div class="hud-row">
      <span class="label">虚拟骨骼 / 顶点权重</span>
      <span class="value">{{ boneCount }} / 4</span>
    </div>
  </aside>
</template>
