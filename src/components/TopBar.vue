<script setup lang="ts">
import type { DisplayMode } from "../babylon/studio";

defineProps<{
  modelValue: string;
  displayMode: DisplayMode;
  items: { id: DisplayMode; label: string; icon: string }[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "mode", v: DisplayMode): void;
  (e: "focus"): void;
  (e: "export"): void;
  (e: "import"): void;
  (e: "sample"): void;
}>();
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark"></div>
      <div>
        <div class="brand-title">线路地形融合工作台</div>
        <div class="brand-sub">Alignment · Terrain Studio</div>
      </div>
    </div>

    <input
      class="project-name"
      :value="modelValue"
      spellcheck="false"
      title="项目名称"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />

    <div class="seg">
      <button
        v-for="it in items"
        :key="it.id"
        :class="{ on: displayMode === it.id }"
        @click="emit('mode', it.id)"
      >
        <span style="font-size: 11px">{{ it.icon }}</span>{{ it.label }}
      </button>
    </div>

    <button class="btn ghost" @click="emit('focus')" title="适配到线路范围 (F)">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
      </svg>
      适配线路
    </button>

    <div class="spacer"></div>

    <button class="btn ghost" @click="emit('sample')">载入示例</button>
    <button class="btn" @click="emit('import')">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M8 11V2M8 2L4.5 5.5M8 2l3.5 3.5M2 11v2.5h12V11" />
      </svg>
      导入文件
    </button>
    <button class="btn primary" @click="emit('export')">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M8 2v9M8 11l3.5-3.5M8 11L4.5 7.5M2 11v2.5h12V11" />
      </svg>
      导出文件
    </button>
  </header>
</template>
