<script setup lang="ts">
import { toasts } from "./toast";
</script>

<template>
  <div class="toasts">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind">{{ t.text }}</div>
  </div>
</template>
