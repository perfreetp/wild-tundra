<script setup lang="ts">
import { onMounted } from 'vue';
import Viewport from './components/Viewport.vue';
import ProfileEditor from './components/ProfileEditor.vue';
import ControlPanel from './components/ControlPanel.vue';
import { bootstrap } from './store';

onMounted(() => {
  bootstrap();
});
</script>

<template>
  <div class="app-layout">
    <Viewport />
    <aside class="side-panel">
      <ControlPanel />
      <ProfileEditor />
    </aside>
  </div>
</template>
