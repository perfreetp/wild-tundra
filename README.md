# 舞台桁架节点实体建模工作台

React 19 + three.js + manifold-3d（WASM 布尔内核）实现的桁架节点实体建模工具，单位 mm。

## 运行

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run test:e2e   # 端到端冒烟测试（需先 npm run dev，Playwright 无头浏览器）
```

## 功能对照

| 需求 | 实现 |
| --- | --- |
| 三类基元 | 球节点（半径 20–80mm 可调）、圆管柱（6 档外径 Ø20/30/40/50/60/80，壁厚 2mm 步进，真实空心管=外柱−内柱）、连接块（中心立方体 + 6 空间方向勾选伸出臂），见 `src/kernel/primitives.js` |
| 视口拖拽布尔 | 开启「拖拽布尔模式」后把一个实体拖到另一个上，弹出菜单选择并集 / 差集 / 交集，生成新的历史树父节点（`SceneManager` 指针射线拾取 + `store.createBoolean`） |
| 历史树 | 折叠、双击重命名、静音（叶子静音=空实体；运算静音=跳过运算透传首个有效子节点）、HTML5 拖拽重排；禁止把子节点排到父节点之前、禁止拖入自身后代（`store.reorderNode` 校验，红色落点预警） |
| 依赖重算 | 改任一上游参数/位置后按拓扑顺序重算下游，布尔链深度上限 12 级，超出给出截断提示；Evaluator 按 `节点id@version` 缓存，未变更节点不重复计算 |
| 800ms 进度条 | 分帧调度（每 2 个节点让出事件循环），累计耗时超过 800ms 才显示进度条与 done/total |
| 干涉检查 | 选中两个实体做 manifold 交集，视口红色高亮重叠区域并显示重叠体积（mm³），无重叠时给出无干涉结论 |
| 装配页 | 多个节点按 XYZ 坐标摆放，manifold 并集合并为单一整体实体，带自动旋转预览 |
| 导出页 | `STLExporter`（`binary: true`）输出二进制 STL；`GLTFExporter` 输出 GLB；历史树+装配清单序列化存入 IndexedDB，可列表读回/删除 |

## 架构

```
src/
  kernel/
    manifoldModule.js  WASM 单例加载（setWasmUrl + ?url 静态资源）
    bridge.js          three BufferGeometry ↔ manifold Manifold 桥接
    primitives.js      三类基元工厂与参数规格
    evaluator.js       历史树求值器（缓存、静音规则、12 级依赖收集）
    interference.js    交集干涉计算
    idb.js             IndexedDB 封装与工程序列化
  state/store.js       zustand 全局状态：树 CRUD、布尔建链、重排校验、分帧重算调度
  three/SceneManager.js three 场景/渲染循环/TransformControls/射线拾取/拖拽布尔/高亮
  components/          ParamPanel、Viewport、HistoryTree、AssemblyPage、ExportPage
```

### 关键设计

- **manifold 实体不进 React state**：求值结果（Manifold 对象、体积、错误、版本）存在 zustand，视口仅在 `version` 变化时把 manifold 转成 `BufferGeometry` 重建网格，避免大对象触发无关渲染。
- **WASM 与主线程**：布尔运算在主线程 WASM 执行，重算按节点分帧 `setTimeout(0)` 让出，保证进度条可绘制；Evaluator 缓存跨重算复用。
- **差集顺序**：按历史树子节点顺序，第一个子实体减去其余子实体，可在树中重排调整。
- **差集保护**：存在祖先/后代关系的节点禁止直接做布尔，避免把节点从自己的子树中减掉。

## 测试

`tests/e2e-smoke.mjs` 用 Playwright 驱动真实页面，覆盖 19 项断言：参数钳制、三布尔求值、上游变更版本递增、静音、重排规则、干涉体积、IndexedDB 存读、二进制 STL/GLB 文件校验、12 级截断、控制台无错误。
