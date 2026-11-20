<script lang="ts">
  import { sectionState } from "../lib/state";
  import { MAX_CLIP_HEIGHT } from "../lib/types";

  function set(patch: Partial<import("../lib/types").SectionState>) {
    sectionState.update((s) => ({ ...s, ...patch }));
  }
</script>

<section class="controls">
  <h2>剖切控制</h2>

  <div class="row">
    <span class="label">剖切方向</span>
    <div class="seg">
      <button
        class:active={$sectionState.direction === "horizontal"}
        on:click={() => set({ direction: "horizontal" })}>水平</button>
      <button
        class:active={$sectionState.direction === "vertical"}
        on:click={() => set({ direction: "vertical" })}>垂直</button>
    </div>
  </div>

  {#if $sectionState.direction === "horizontal"}
    <div class="row">
      <span class="label">剖切高度</span>
      <input
        type="range"
        min="0"
        max={MAX_CLIP_HEIGHT}
        step="0.5"
        value={$sectionState.clipHeight}
        on:input={(e) => set({ clipHeight: Number(e.currentTarget.value) })} />
      <span class="value">{$sectionState.clipHeight.toFixed(1)} m</span>
    </div>
  {:else}
    <div class="row">
      <span class="label">剖切角度</span>
      <input
        type="range"
        min="0"
        max="180"
        step="1"
        value={$sectionState.clipAngle}
        on:input={(e) => set({ clipAngle: Number(e.currentTarget.value) })} />
      <span class="value">{$sectionState.clipAngle.toFixed(0)}°</span>
    </div>
  {/if}

  <div class="row">
    <span class="label">视图模式</span>
    <div class="seg">
      <button
        class:active={$sectionState.viewMode === "orbit"}
        on:click={() => set({ viewMode: "orbit" })}>环绕</button>
      <button
        class:active={$sectionState.viewMode === "top"}
        on:click={() => set({ viewMode: "top" })}>俯视</button>
    </div>
  </div>
</section>

<style>
  .controls {
    background: #1a1f2b;
    border: 1px solid #2b3242;
    border-radius: 8px;
    padding: 10px 12px;
  }
  h2 {
    font-size: 14px;
    margin: 0 0 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    font-size: 13px;
  }
  .label {
    width: 60px;
    flex-shrink: 0;
    color: #9aa4b8;
  }
  .value {
    width: 64px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  input[type="range"] {
    flex: 1;
    min-width: 0;
    accent-color: #4f9cf0;
  }
  .seg {
    display: flex;
    gap: 4px;
  }
  .seg button {
    background: #232936;
    border: 1px solid #333b4d;
    color: #c6cddb;
    border-radius: 6px;
    padding: 5px 14px;
    font-size: 13px;
    cursor: pointer;
  }
  .seg button.active {
    background: #2b6cb0;
    border-color: #2b6cb0;
    color: #fff;
  }
</style>
