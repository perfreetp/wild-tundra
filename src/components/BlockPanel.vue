<template>
  <aside class="panel right">
    <h3>我的积木盒 <span class="chip" style="margin-left:auto">{{ state.blockCount }} 块</span></h3>

    <div v-if="!state.blocks.length" class="empty-tip">
      🧩 还没有积木<br />
      先在左边画一个形状,<br />拉伸或回转做成积木吧!
    </div>

    <div
      v-for="b in state.blocks"
      :key="b.id"
      class="block-item"
      :class="{ sel: b.id === state.selectedId }"
      @click="actions.selectBlock(b.id)"
    >
      <span class="dot" :style="{ background: b.color.diffuse }"></span>
      <div style="flex:1;min-width:0">
        <div class="nm">{{ b.name }}</div>
        <div class="sub">
          {{ b.kind === 'extrude' ? `拉伸 · 厚 ${b.depth.toFixed(1)} 格` : `回转 · ${b.revAngle}°` }}
          <span v-if="state.collisions.includes(b.id)" style="color:var(--red);font-weight:800"> · 穿模!</span>
        </div>
      </div>
    </div>

    <div class="section" v-if="state.blocks.length" style="margin-top:14px">
      <div class="label">拼搭操作</div>
      <div class="btn-row">
        <button class="pbtn green" :disabled="!state.selectedId" @click="actions.duplicateSelected()">
          📋 复制一块
        </button>
        <button class="pbtn ghost" :disabled="!state.selectedId" @click="actions.deleteSelected()">
          🗑 删除
        </button>
      </div>
      <p style="margin:10px 0 0;font-size:13px;color:var(--ink-soft);line-height:1.7">
        切到「拼积木」模式后,直接拖住积木移动;两块撞在一起的地方会亮起<b style="color:var(--red)">红色轮廓</b>提醒。
      </p>
    </div>

    <div class="section">
      <div class="label">视角操作</div>
      <p style="margin:0 0 8px;font-size:13px;color:var(--ink-soft);line-height:1.7">
        空白处按住拖动可以绕着作品转一圈,滚轮可以放大缩小。
      </p>
      <div class="btn-row">
        <button class="pbtn" @click="actions.focusView('front')">▦ 一键正视</button>
        <button class="pbtn" @click="actions.focusView('top')">▤ 一键俯视</button>
      </div>
    </div>

    <button class="pbtn primary" style="width:100%;font-size:16px;padding:13px" @click="actions.exportImage()">
      📷 导出作品照片留念
    </button>
  </aside>
</template>

<script setup>
import { state, actions } from '../composables/useStudio.js'
</script>
