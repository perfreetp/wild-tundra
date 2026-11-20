<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import {
    sectionState,
    startAutoPersist,
    exportState,
    importState,
  } from "./lib/state";
  import { createSceneContext, applyViewMode, readCameraState, applyCameraState, type SceneContext } from "./lib/scene";
  import { buildStationCity, type BuiltModel } from "./lib/model";
  import { ClipController } from "./lib/clip";
  import { clippedProjectionArea } from "./lib/area";
  import { Plane } from "@babylonjs/core";
  import { CATEGORY_LABEL, type FloorInfo } from "./lib/types";
  import Controls from "./components/Controls.svelte";
  import FloorList from "./components/FloorList.svelte";

  let canvas: HTMLCanvasElement;
  let ctx: SceneContext | null = null;
  let model: BuiltModel | null = null;
  let clip: ClipController | null = null;
  let engineLabel = "";
  let importError = "";
  let selectedArea: number | null = null;

  // 当前剖切平面(供面积计算)
  function currentPlane(): Plane {
    const s = get(sectionState);
    return clip ? clip.computePlane(s) : new Plane(0, 1, 0, -s.clipHeight);
  }

  function refreshArea() {
    const s = get(sectionState);
    if (!s.selectedFloorId || !model) {
      selectedArea = null;
      return;
    }
    const mesh = model.floorMeshes.get(s.selectedFloorId);
    if (!mesh) {
      selectedArea = null;
      return;
    }
    selectedArea = clippedProjectionArea(mesh, currentPlane());
  }

  onMount(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => ctx?.engine.resize();

    (async () => {
      ctx = await createSceneContext(canvas);
      if (disposed) return;
      engineLabel = ctx.isWebGPU ? "WebGPU" : "WebGL(回退)";
      // 调试句柄
      (window as unknown as { __scene: unknown }).__scene = ctx.scene;

      model = buildStationCity(ctx.scene);
      clip = new ClipController(ctx.scene, ctx.shaderLanguage, model);

      // 状态 -> 场景
      const applyAll = (first = false) => {
        const s = get(sectionState);
        clip!.update(s);
        applyHighlight(s.selectedFloorId);
        if (first) {
          if (s.camera) applyCameraState(ctx!.camera, s.camera);
          else applyViewMode(ctx!.camera, s.viewMode);
        }
        refreshArea();
      };

      const applyHighlight = (floorId: string | null) => {
        if (!model) return;
        for (const [id, mesh] of model.floorMeshes) {
          const info = mesh.metadata.floor as FloorInfo;
          mesh.material =
            id === floorId
              ? model.highlightMaterial
              : model.categoryMaterials[info.category];
        }
      };

      applyAll(true);
      let prev = get(sectionState);
      unsubscribe = sectionState.subscribe((s) => {
        if (!ctx || !clip) return;
        clip.update(s);
        applyHighlight(s.selectedFloorId);
        if (s.viewMode !== prev.viewMode) applyViewMode(ctx.camera, s.viewMode);
        prev = s;
        refreshArea();
      });

      // 相机变化 -> 防抖写回状态(本地持久化)
      ctx.camera.onViewMatrixChangedObservable.add(() => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          if (!ctx) return;
          sectionState.update((st) => ({ ...st, camera: readCameraState(ctx!.camera) }));
        }, 400);
      });

      ctx.engine.runRenderLoop(() => ctx!.scene.render());
      window.addEventListener("resize", onResize);
    })();

    startAutoPersist();

    return () => {
      disposed = true;
      unsubscribe?.();
      window.removeEventListener("resize", onResize);
      ctx?.engine.dispose();
    };
  });

  function onImportFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const err = importState(String(reader.result));
      if (err) {
        importError = `导入失败:${err}`;
      } else if (ctx) {
        importError = "";
        // 还原视角与视图模式(剖切状态由 store 订阅自动应用)
        const s = get(sectionState);
        if (s.camera) applyCameraState(ctx.camera, s.camera);
        applyViewMode(ctx.camera, s.viewMode);
      }
      input.value = "";
    };
    reader.readAsText(file);
  }

  $: floors = model ? model.floors : [];
  $: selectedFloor = $sectionState.selectedFloorId
    ? floors.find((f) => f.id === $sectionState.selectedFloorId) ?? null
    : null;
</script>

<div class="layout">
  <div class="viewport">
    <canvas bind:this={canvas}></canvas>
    <div class="engine-badge">引擎:{engineLabel || "初始化中…"}</div>
  </div>

  <aside class="panel">
    <h1>站城一体化剖切展示</h1>
    <Controls />

    {#if selectedFloor}
      <section class="info">
        <h2>选中楼层</h2>
        <p><b>{selectedFloor.buildingName}</b> · 第 {selectedFloor.floor} 层</p>
        <p>类别:{CATEGORY_LABEL[selectedFloor.category]}</p>
        <p>高度区间:{selectedFloor.zMin.toFixed(1)} ~ {selectedFloor.zMax.toFixed(1)} m</p>
        <p>
          剖切投影面积:
          {#if selectedArea !== null}
            <b>{selectedArea.toFixed(1)} m²</b>
          {:else}
            计算中…
          {/if}
        </p>
      </section>
    {:else}
      <section class="info muted">在下方列表点击楼层查看面积与高度区间</section>
    {/if}

    <FloorList {floors} />

    <section class="io">
      <button on:click={exportState}>导出状态 JSON</button>
      <label class="import-btn">
        导入状态 JSON
        <input type="file" accept=".json,application/json" on:change={onImportFile} />
      </label>
      {#if importError}<p class="error">{importError}</p>{/if}
    </section>
  </aside>
</div>

<style>
  :global(html, body, #app) {
    height: 100%;
    margin: 0;
    font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
    background: #0b0d12;
    color: #e6e9ef;
  }
  .layout {
    display: flex;
    height: 100%;
  }
  .viewport {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
  }
  .engine-badge {
    position: absolute;
    left: 12px;
    top: 10px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.45);
    font-size: 12px;
    pointer-events: none;
  }
  .panel {
    width: 340px;
    flex-shrink: 0;
    overflow-y: auto;
    padding: 14px 16px 24px;
    background: #12151d;
    border-left: 1px solid #262b38;
    box-sizing: border-box;
  }
  h1 {
    font-size: 17px;
    margin: 4px 0 12px;
  }
  h2 {
    font-size: 14px;
    margin: 0 0 6px;
  }
  .info {
    background: #1a1f2b;
    border: 1px solid #2b3242;
    border-radius: 8px;
    padding: 10px 12px;
    margin: 12px 0;
    font-size: 13px;
    line-height: 1.7;
  }
  .info p {
    margin: 2px 0;
  }
  .muted {
    color: #8a93a6;
  }
  .io {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    flex-wrap: wrap;
  }
  button,
  .import-btn {
    background: #2b6cb0;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 7px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  button:hover,
  .import-btn:hover {
    background: #3580cf;
  }
  .import-btn input {
    display: none;
  }
  .error {
    color: #ff7b72;
    font-size: 12px;
    width: 100%;
  }
</style>
