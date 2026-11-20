<template>
  <div class="overlay">
    <div
      v-for="l in visibleLabels"
      :key="l.id"
      :class="labelClass(l)"
      :style="{ left: l.x + 'px', top: l.y + 'px' }"
      @dblclick="onDouble(l, $event)"
    >
      <template v-if="l.kind === 'dim'">
        <span v-if="editId !== l.id">{{ l.text }}<span class="unit">格</span></span>
        <input
          v-else
          ref="editInput"
          v-model="editVal"
          class="dim-input"
          @keyup.enter="commit(l)"
          @keyup.esc="cancel"
          @blur="commit(l)"
          type="number"
          min="0.2"
          step="0.5"
        />
      </template>
      <template v-else>{{ l.text }}</template>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { state, actions } from '../composables/useStudio.js'

const editId = ref(null)
const editVal = ref('')
const editInput = ref(null)

const visibleLabels = computed(() => state.exporting ? [] : state.labels)

function labelClass(l) {
  return {
    'dim-label': l.kind === 'dim',
    'con-mark': l.kind === 'constraint',
    readout: l.kind === 'readout',
    editing: editId.value === l.id,
  }
}

async function onDouble(l, e) {
  if (l.kind !== 'dim') return
  e.stopPropagation()
  editId.value = l.id
  editVal.value = l.text
  await nextTick()
  const input = e.currentTarget.querySelector('input')
  input?.focus()
  input?.select()
}

function commit(l) {
  if (editId.value === null) return
  actions.editDimension(l.edgeIndex, editVal.value)
  editId.value = null
}

function cancel() { editId.value = null }
</script>

<style scoped>
.dim-input {
  width: 72px;
  border: none;
  background: transparent;
  font: inherit;
  font-weight: 800;
  color: inherit;
  outline: none;
  text-align: center;
}
.dim-input::-webkit-outer-spin-button,
.dim-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
</style>
