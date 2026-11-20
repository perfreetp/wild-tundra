<script lang="ts">
  import { sectionState } from "../lib/state";
  import { CATEGORY_LABEL, type BuildingCategory, type FloorInfo } from "../lib/types";

  export let floors: FloorInfo[] = [];

  interface BuildingGroup {
    buildingId: string;
    buildingName: string;
    category: BuildingCategory;
    floors: FloorInfo[];
  }

  const CATEGORY_ORDER: Record<BuildingCategory, number> = {
    station: 0,
    commercial: 1,
    residential: 2,
  };

  // 按建筑分组,楼层自上而下(高层在前)
  $: groups = (() => {
    const map = new Map<string, BuildingGroup>();
    for (const f of floors) {
      let g = map.get(f.buildingId);
      if (!g) {
        g = { buildingId: f.buildingId, buildingName: f.buildingName, category: f.category, floors: [] };
        map.set(f.buildingId, g);
      }
      g.floors.push(f);
    }
    const arr = [...map.values()];
    for (const g of arr) g.floors.sort((a, b) => b.floor - a.floor);
    arr.sort((a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] || a.buildingId.localeCompare(b.buildingId));
    return arr;
  })();

  let collapsed: Record<string, boolean> = {};

  function select(id: string) {
    sectionState.update((s) => ({
      ...s,
      selectedFloorId: s.selectedFloorId === id ? null : id,
    }));
  }
</script>

<section class="floors">
  <h2>楼层分组</h2>
  {#each groups as g (g.buildingId)}
    <div class="building">
      <button class="building-head" on:click={() => (collapsed = { ...collapsed, [g.buildingId]: !collapsed[g.buildingId] })}>
        <span class="tag cat-{g.category}">{CATEGORY_LABEL[g.category]}</span>
        <span class="name">{g.buildingName}</span>
        <span class="count">{g.floors.length} 层 {collapsed[g.buildingId] ? "▸" : "▾"}</span>
      </button>
      {#if !collapsed[g.buildingId]}
        <div class="floor-grid">
          {#each g.floors as f (f.id)}
            <button
              class="floor"
              class:selected={$sectionState.selectedFloorId === f.id}
              on:click={() => select(f.id)}
              title="{f.zMin.toFixed(1)} ~ {f.zMax.toFixed(1)} m">
              {f.floor}F
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</section>

<style>
  .floors {
    margin-top: 12px;
  }
  h2 {
    font-size: 14px;
    margin: 0 0 8px;
  }
  .building {
    margin-bottom: 8px;
  }
  .building-head {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    background: #1a1f2b;
    border: 1px solid #2b3242;
    border-radius: 6px;
    padding: 6px 8px;
    color: #e6e9ef;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
  }
  .name {
    flex: 1;
  }
  .count {
    color: #8a93a6;
    font-size: 12px;
  }
  .tag {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    color: #0b0d12;
    font-weight: 600;
  }
  .cat-station { background: #6b9be8; }
  .cat-commercial { background: #eda44f; }
  .cat-residential { background: #8fc78f; }
  .floor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 4px;
    padding: 6px 2px 2px;
  }
  .floor {
    background: #232936;
    border: 1px solid #333b4d;
    border-radius: 4px;
    color: #c6cddb;
    font-size: 12px;
    padding: 4px 0;
    cursor: pointer;
  }
  .floor:hover {
    border-color: #4f9cf0;
  }
  .floor.selected {
    background: #b98a1c;
    border-color: #e8b93c;
    color: #fff;
    font-weight: 600;
  }
</style>
