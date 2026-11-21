// 儿童向配色:每种片一种明亮颜色,背面使用更深的同色系
export const TILE_COLORS: Record<string, { front: string; back: string; name: string }> = {
  square: { front: '#ff8fa3', back: '#d6336c', name: '正方形' },
  triangle: { front: '#74c0fc', back: '#1971c2', name: '三角形' },
  hexagon: { front: '#ffd43b', back: '#f08c00', name: '六边形' },
  sector: { front: '#69db7c', back: '#2f9e44', name: '扇形' },
};

export const TEMPLATE_COLORS = ['#ff8fa3', '#74c0fc', '#ffd43b', '#69db7c', '#da77f2', '#63e6be'];
