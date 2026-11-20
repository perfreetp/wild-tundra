<template>
  <div class="topbar">
    <div class="logo">
      <span class="badge">🧊</span>
      小小形状建筑师
    </div>

    <div class="toolbar">
      <button
        v-for="m in modes"
        :key="m.id"
        class="tbtn"
        :class="{ active: state.mode === m.id }"
        @click="actions.setMode(m.id)"
      >
        <span>{{ m.icon }}</span>{{ m.name }}
      </button>
    </div>

    <div class="view-btns">
      <button class="tbtn" @click="actions.focusView('front')" title="正视图">▦ 正视</button>
      <button class="tbtn" @click="actions.focusView('top')" title="俯视图">▤ 俯视</button>
      <button class="tbtn" style="background:#ffe0c7" @click="actions.exportImage()">📷 留念</button>
    </div>
  </div>
</template>

<script setup>
import { state, actions } from '../composables/useStudio.js'

const modes = [
  { id: 'draw', name: '画形状', icon: '✏️' },
  { id: 'extrude', name: '拉伸', icon: '📏' },
  { id: 'revolve', name: '回转', icon: '🌀' },
  { id: 'move', name: '拼积木', icon: '✋' },
]
</script>
