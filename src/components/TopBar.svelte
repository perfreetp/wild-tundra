<script lang="ts">
  import { uiState, commands } from '../lib/store';
  import { TASK_DEFS } from '../lib/tasks';
  import type { TaskId } from '../lib/types';

  function pick(id: TaskId) {
    commands.switchTask?.(id);
  }
</script>

<header class="topbar">
  <div class="brand">
    <span class="logo">⦿</span>
    <span>腔镜器械操作训练台</span>
    <span class="engine" class:webgpu={$uiState.engineKind === 'WebGPU'}>{$uiState.engineKind}</span>
  </div>

  <nav class="tasks">
    {#each TASK_DEFS as def}
      <button
        class="task-btn"
        class:active={$uiState.task.id === def.id}
        class:done={$uiState.task.id === def.id && $uiState.task.done}
        on:click={() => pick(def.id)}
        title={def.description}
      >
        {def.title}
      </button>
    {/each}
  </nav>

  <div class="task-info">
    <span class="desc">{$uiState.task.description}</span>
    {#if $uiState.task.progress}<span class="progress">{$uiState.task.progress}</span>{/if}
    {#if $uiState.task.done}<span class="done-flag">✓ 任务完成({$uiState.task.elapsed.toFixed(1)} s)</span>{/if}
  </div>
</header>
