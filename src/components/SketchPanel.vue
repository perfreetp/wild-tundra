<template>
  <aside class="panel">
    <h3>草图工作台</h3>

    <!-- 画线阶段 -->
    <div class="section" v-if="!state.shape">
      <div class="label">① 画一笔封闭轮廓</div>
      <p style="margin:0 0 10px;font-size:13px;color:var(--ink-soft);line-height:1.7">
        在网格上逐点点出形状,点会自动吸到网格;画近水平/垂直时会出现绿色约束标记。
      </p>
      <div class="btn-row">
        <button class="pbtn blue" @click="actions.addPointAtPreview()" :disabled="!canAddPoint">➕ 加点</button>
        <button class="pbtn ghost" @click="actions.undoPoint()" :disabled="!state.draft.points.length">↩ 撤销</button>
        <button class="pbtn ghost" @click="actions.clearDraft()" :disabled="!state.draft.points.length">🗑 清空</button>
      </div>

      <div v-if="state.draft.gap" style="margin-top:12px">
        <span class="chip warn">🔴 还差一点点就闭合啦</span>
        <p style="font-size:13px;color:var(--ink-soft);margin:8px 0">
          缺口处有两个黄色圆点,点任意一个就能补上缺口:
        </p>
        <button class="pbtn primary" style="width:100%" @click="actions.closeGapWith()">
          🟡 点我补上缺口
        </button>
      </div>
      <div v-else-if="state.draft.points.length" style="margin-top:12px">
        <span class="chip ok">已画 {{ state.draft.points.length }} 个点</span>
      </div>
    </div>

    <!-- 形状已闭合:尖角与成型 -->
    <template v-else>
      <div class="section">
        <div class="label">② 尖角加工</div>
        <p style="margin:0 0 8px;font-size:13px;color:var(--ink-soft)">
          先在画布上点一个白色尖角(选中变橙色),再选加工方式:
        </p>
        <div class="btn-row" style="margin-bottom:10px">
          <button class="pbtn" :class="{ sel: state.cornerMode === 'none' }" @click="actions.setCornerMode('none')">保持尖角</button>
          <button class="pbtn" :class="{ sel: state.cornerMode === 'chamfer' }" @click="actions.setCornerMode('chamfer')">斜切倒角</button>
          <button class="pbtn" :class="{ sel: state.cornerMode === 'fillet' }" @click="actions.setCornerMode('fillet')">圆圆圆角</button>
        </div>
        <div class="label">半径 <span class="range-value">{{ state.cornerRadius.toFixed(2) }}</span></div>
        <input
          type="range" min="0.05" max="1.5" step="0.05"
          :value="state.cornerRadius"
          @input="actions.setCornerRadius($event.target.value)"
        />
        <button class="pbtn ghost" style="width:100%;margin-top:6px" @click="actions.applyCornerToAll()">
          ✨ 一次给所有尖角都加上
        </button>
      </div>

      <!-- 拉伸 -->
      <div class="section" v-if="state.mode === 'extrude'">
        <div class="label">③ 拖手柄变厚,或用滑块</div>
        <div class="label">厚度 <span class="range-value">{{ state.depth.toFixed(1) }} 格</span></div>
        <input
          type="range" min="0.2" max="6" step="0.1"
          :value="state.depth"
          @input="actions.setDepth($event.target.value)"
        />
        <button class="pbtn primary" style="width:100%;margin-top:8px" @click="actions.buildExtrude()">
          🧱 变成积木!
        </button>
      </div>

      <!-- 回转 -->
      <div class="section" v-if="state.mode === 'revolve'">
        <div class="label">③ 画一条旋转轴</div>
        <div class="btn-row" style="margin-bottom:8px">
          <button class="pbtn purple" @click="actions.startAxisPick()">
            {{ state.axis ? '🔄 重画转轴' : '📍 开始画转轴' }}
          </button>
          <button class="pbtn ghost" :disabled="!state.axis" @click="actions.clearAxis()">清除</button>
        </div>
        <span v-if="state.axis" class="chip" :class="state.axisValid ? 'ok' : 'warn'">
          {{ state.axisValid ? '✅ 转轴位置合适' : '⚠️ 轴要在轮廓同一侧外面' }}
        </span>

        <div class="label" style="margin-top:12px">旋转角度 <span class="range-value">{{ state.revAngle }}°</span></div>
        <input
          type="range" min="15" max="360" step="15"
          :value="state.revAngle"
          :disabled="!state.axisValid"
          @input="actions.setRevAngle($event.target.value)"
        />
        <p style="font-size:12px;color:var(--ink-soft);margin:4px 0 10px">每 15° 一档,拖动手柄会“咔哒”吸住</p>
        <button
          class="pbtn purple" style="width:100%"
          :disabled="!state.axisValid"
          @click="actions.buildRevolve()"
        >
          🌀 转成回转体!
        </button>
      </div>
    </template>

    <div class="section" v-if="state.shape">
      <div class="label">小提示</div>
      <p style="margin:0;font-size:13px;color:var(--ink-soft);line-height:1.8">
        双击画布上的蓝色数字可以直接改尺寸,轮廓的宽度、高度和实体都会跟着重算。
      </p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { state, actions } from '../composables/useStudio.js'

const canAddPoint = computed(() =>
  state.mode === 'draw' && !state.shape && !!state.draft.preview
)
</script>
