<script lang="ts">
  import { uiState, commands } from '../lib/store';

  let fileInput: HTMLInputElement;

  function onFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then((text) => commands.replay?.(text));
    (e.target as HTMLInputElement).value = '';
  }

  const names = ['左钳', '右钳'];
  const fmt = (v: number) => v.toFixed(1);
</script>

<aside class="sidepanel">
  {#each $uiState.tips as tip, i}
    <section class="card">
      <h3 class:contact={tip.contact}>
        {names[i]} 末端位置
        {#if tip.contact}<span class="badge warn">接触器官</span>{/if}
        {#if tip.holding}<span class="badge hold">夹持 {tip.holding}</span>{/if}
      </h3>
      <div class="readout">
        <div><span class="axis">X</span><span>{fmt(tip.pos.x)}</span><em>mm</em></div>
        <div><span class="axis">Y</span><span>{fmt(tip.pos.y)}</span><em>mm</em></div>
        <div><span class="axis">Z</span><span>{fmt(tip.pos.z)}</span><em>mm</em></div>
      </div>
      <h4>关节链角度</h4>
      <table>
        <tbody>
          <tr><td>戳卡偏航</td><td>{fmt(tip.joints.trocarYaw)}°</td></tr>
          <tr><td>戳卡俯仰</td><td>{fmt(tip.joints.trocarPitch)}°</td></tr>
          <tr><td>插入深度</td><td>{fmt(tip.joints.insertion)} mm</td></tr>
          <tr><td>杆自转</td><td>{fmt(tip.joints.roll)}°</td></tr>
          <tr><td>钳口开合</td><td>{fmt(tip.jawDeg)}°</td></tr>
        </tbody>
      </table>
    </section>
  {/each}

  <section class="card">
    <h3>操作记录</h3>
    <div class="btn-row">
      <button on:click={() => commands.toggleRecord?.()} class:rec={$uiState.recording}>
        {$uiState.recording ? '■ 停止记录' : '● 开始记录'}
      </button>
      <button on:click={() => commands.exportRecord?.()} disabled={$uiState.recordFrames === 0}>
        导出 JSON ({$uiState.recordFrames})
      </button>
    </div>
    <div class="btn-row">
      <button on:click={() => fileInput.click()} disabled={$uiState.replaying}>导入并回放</button>
      {#if $uiState.replaying}
        <button on:click={() => commands.stopReplay?.()}>停止回放</button>
      {/if}
    </div>
    <input bind:this={fileInput} type="file" accept=".json,application/json" on:change={onFile} hidden />
  </section>

  <section class="card help">
    <h3>键位</h3>
    <table>
      <tbody>
        <tr><td></td><td>左钳</td><td>右钳</td></tr>
        <tr><td>手柄移动</td><td>W A S D</td><td>I J K L</td></tr>
        <tr><td>插入 / 退出</td><td>Q / E</td><td>U / O</td></tr>
        <tr><td>钳口闭 / 开</td><td>Z / X</td><td>N / M</td></tr>
        <tr><td>杆自转</td><td>C / V</td><td>, / .</td></tr>
        <tr><td>相机</td><td colspan="2">左键旋转 · 中键平移 · 滚轮缩放</td></tr>
      </tbody>
    </table>
  </section>
</aside>

{#if $uiState.message}
  <div class="toast">{$uiState.message}</div>
{/if}
