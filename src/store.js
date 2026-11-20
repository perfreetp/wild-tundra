import { reactive } from 'vue';

export const BRUSHES = {
  raise: '抬升',
  smooth: '平滑',
  flatten: '压平'
};

export const store = reactive({
  // 笔刷
  brush: 'raise',
  strength: 50, // 0-100
  radius: 12,   // 1-64 格
  // 实时统计
  affectedCells: 0,
  minAlt: 0,
  maxAlt: 0,
  fps: 0,
  // 撤销/重做
  canUndo: false,
  canRedo: false,
  // 导入导出反馈
  message: ''
});
