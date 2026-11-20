# 软组织形变视口 · Soft Tissue Deformation Viewport

基于 **TypeScript + Vue 3 + Three.js + three-mesh-bvh** 的交互式软组织形变模拟视口。
球形探针（器械）接触器官表面时，通过 BVH 加速求交定位命中三角形，按距离衰减施加顶点位移，
再经虚拟骨骼蒙皮权重向邻域平滑扩散形成连续凹陷；松开后按弹性系数逐帧回弹。所有形变计算运行在 **Web Worker** 中。

## 功能清单

| 需求 | 实现 |
| --- | --- |
| 加载官网格后预计算骨骼蒙皮权重 | Worker `init` 阶段在包围球内生成虚拟骨骼晶格，Wendland 紧支核 + 空间哈希为每顶点计算 4 骨骼权重 |
| 球形探针代表器械，鼠标拖动 | 相机平面拖拽 + `Shift` 拖拽沿视线推近/拉远 |
| BVH 加速求交得到命中三角形 | 外部 `closestPointToPoint`，内部 `raycastFirst(DoubleSide)` 射线内外判定 |
| 按命中点距离衰减施加位移 | 平滑三次衰减 `3t²-2t³` |
| 蒙皮权重向邻域平滑扩散形成凹陷 | 顶点位移 → 骨骼加权聚合 → 蒙皮混合回顶点，每帧一次 |
| 松开后按弹性系数逐帧回弹 | 弹簧-阻尼 ODE，目标位移归零自动回弹 |
| 软/中/硬 3 档 | 调节影响半径（衰减半径）+ 弹簧系数/阻尼（回弹速度） |
| 接触深度 / 最大形变位移两个数值 | 顶部指标面板实时显示 |
| 网格线框叠加开关 | 线框与实体共享同一 geometry，位移自动同步 |
| 探针轨迹淡出残影 | 加法混合点精灵，按出生时间 1.4s 淡出 |
| 左侧 3 个可切换器官 | 肝 / 肾 / 腺体（程序化高模，可替换为 GLTF 加载） |
| 右下角帧率 + BVH 求交耗时 | HUD 面板，EMA 平滑 |
| 形变计算放入 Worker | `deformWorker.ts`，双缓冲 Transferable 零拷贝 |

## 架构

```
主线程 (Vue + Three.js)                     Worker (deformWorker.ts)
─────────────────────                       ─────────────────────────
SceneManager                                init:
  渲染 / OrbitControls / 探针拖拽      ──►    虚拟骨骼晶格 + 每顶点 4 蒙皮权重
  BVH closestPoint / raycast 求交
  接触点·法线·深度                    ──►    frame:
  双缓冲 postMessage (Transferable)          距离衰减接触力
  ◄── 形变后位置 / 最大形变 / 耗时           弹簧-阻尼积分 → 蒙皮扩散 → 输出
  refit BVH + computeVertexNormals
```

### 接触检测的关键设计

`closestPointToPoint` 只能返回表面**外部**的最近点：探针一旦进入器官内部，最近点会跳到远侧表面，
接触判定立即失效。因此采用双阶段方案：

1. 从探针中心沿「离开器官中心」方向发射 BVH 射线（`DoubleSide`，因为内部命中的是背面），
   命中距离 < 器官半径 ⇒ 探针在内部；
2. 接触点始终取 `closestPointToPoint` 的最近表面点（入口侧），保证凹陷出现在器械真正压入的位置；
3. 法线统一翻转为背离器官中心的外法线，深度 = 探针半径 ± 表面距离。

### 三档硬度参数

| 档位 | 影响半径 | 弹簧 K | 阻尼 | 手感 |
| --- | --- | --- | --- | --- |
| 软 | 0.55 | 18 | 6.5 | 凹陷大而广，回弹慢 |
| 中 | 0.38 | 42 | 10 | 平衡 |
| 硬 | 0.24 | 90 | 16 | 凹陷小而集中，回弹快 |

## 运行

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 类型检查 + 生产构建（Worker 打成独立 chunk）
npm run preview    # 预览生产构建
```

## 操作

- **拖动青色探针**：在相机平面上移动器械
- **Shift + 拖动**：沿视线方向推近/拉远，把探针压入器官内部
- **空白处拖拽 / 滚轮 / 右键**：旋转 / 缩放 / 平移视角
- 左侧面板切换器官、硬度与线框；顶部看接触深度与最大形变；右下看 FPS 与 BVH/Worker 耗时

## 目录结构

```
src/
  shared/types.ts          消息协议、硬度档位、器官描述
  organs/organFactory.ts    程序化器官网格（替换为 GLTFLoader 的接入点）
  workers/deformWorker.ts   蒙皮权重预计算 + 接触力 + 扩散 + 回弹
  viewport/SceneManager.ts  渲染、BVH 求交、探针、残影、Worker 编排
  components/               左侧面板 / 指标面板 / HUD / 操作提示
  App.vue
scripts/                    CDP 无头浏览器自动化验证脚本
```

## 接入真实官网格

`organFactory.ts` 中的程序化生成可直接替换为 `GLTFLoader`：加载后取首个 `BufferGeometry`，
后续 BVH 构建、`geometryToBuffers` 传 Worker、蒙皮权重预计算管线完全一致，无需改动。
