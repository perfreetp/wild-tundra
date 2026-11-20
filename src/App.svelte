<script lang="ts">
  import { onMount } from 'svelte';
  import TopBar from './components/TopBar.svelte';
  import SidePanel from './components/SidePanel.svelte';
  import { Simulation } from './lib/simulation';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const sim = new Simulation(canvas);
    sim.init().catch((e) => console.error('仿真初始化失败', e));
  });
</script>

<div class="layout">
  <TopBar />
  <div class="main">
    <canvas bind:this={canvas} id="viewport"></canvas>
    <SidePanel />
  </div>
</div>
