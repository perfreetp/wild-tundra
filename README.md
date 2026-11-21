# 磁力片乐园 · 拼拼折折

一个面向 3–6 岁儿童、在平板上玩的磁力片拼搭启蒙应用。使用 **SolidJS** 构建界面、**Babylon.js** 做 3D 渲染,纯手写几何引擎实现边吸附与平面折叠。

## 运行

```bash
npm install
npm run dev      # 本地开发(默认 http://localhost:5173)
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览生产构建
npm run test:math# 纯几何单元测试(36 项)
```

## 功能与实现对照

| 需求 | 实现位置 |
| --- | --- |
| 左侧片库:正方形 / 三角形 / 六边形 / 扇形 | `src/components/TileLibrary.tsx`、`src/geometry/math.ts` 形状工厂 |
| 拖到台面按边自动吸附贴合 | `findSnap()`(等长边 + 距离/角度评分 + SAT 防重叠) |
| 转动手柄按 15° 步进对齐 | 场景指针旋转手势 + `quantizeAngle()` |
| 靠近已有边整条亮起提示 | 每片直边的世界空间发光管 `edgeGlows` + `snapPreview` |
| 两片相交变红并抖一下 | SAT 重叠检测 + `overlapIds` 红色材质 + 正弦抖动 |
| 立起来后沿公共边折成 3D | `computeFoldTransforms()` BFS 折叠运动学(旋转矩阵复合) |
| 每折一次显示当前折角 | `FoldPanel.tsx`,15° 步进、超过 120° 停住 |
| 半透明塑料材质、背面异色 | `tiles.ts` 手工挤出网格,多材质(正面/背面/侧面) |
| 两盏灯可拖动、影子跟随 | `SpotLight` + `ShadowGenerator`,`moveLight` 同步光源 |
| 手指转模型看背面 | `ArcRotateCamera` 触摸旋转,背面用独立深色材质 |
| 点一片单独拿起再放回 | 折叠模式 `liftedId`,抬起片沿 +y 上浮 |
| 双击回到平铺视角 | `resetCamera()` 缓动回位 |
| 每一步留记录、可倒着回放 | 事件型历史栈 + 撤销/重做 + 逐步回放(上一步/下一步) |
| 拼完生成搭法卡片导出图片 | `exportCard.ts` 合成截图与统计信息为 PNG 下载 |
| 片库模板跟拼、点亮下一步 | `templates.ts` + 呼吸闪烁的幽灵引导片 + 步骤芯片 |
| 断开贴合处黄色描边 | `detachTile()` 产生 `brokenEdges`,`brokenOutlines` 高亮 |

## 目录结构

```
src/
  geometry/math.ts        纯几何:形状、SAT 碰撞、吸附求解、折叠运动学(可单测)
  geometry/math.test.ts   36 项几何单元测试
  state/store.ts          Solid 信号状态机:片、连接、历史、回放、模板
  state/templates.ts      跟拼模板数据
  state/colors.ts         儿童向配色(正面/背面)
  babylon/tiles.ts        磁力片网格:半透明塑料、正反异色、发光/描边管、手柄
  babylon/scene.ts        场景引擎:相机、灯影、触摸交互、折叠动画、提示、幽灵片
  components/             Solid UI:片库、工具栏、折叠、回放、模板、卡片导出
```

## 关键设计

- **几何与渲染解耦**:`geometry/math.ts` 不依赖 Babylon,所有吸附/碰撞/折叠数学都能在 Node 下单测。
- **折叠用旋转矩阵而非欧拉角**:多级折叠通过 `父旋转 × 本地铰链旋转 × 子平铺旋转` 复合,避免万向锁;渲染层再把矩阵转四元数。
- **历史即事件流**:增删、移动、连接、断开、折叠都是可反转事件,撤销/重做/回放共用同一套 apply 逻辑。
- **折叠动画与状态分离**:store 立即保存目标折角,场景用独立的视觉补间表插值,快速连点也能正确累积。
- **世界空间提示层**:发光管、黄色描边、手柄不挂在会旋转的片节点下,每帧按片的世界变换显式同步,姿态不会被父节点四元数复合打乱。

## 自动化验证

`scripts/` 下是基于 Chrome DevTools Protocol 的无头浏览器脚本,覆盖吸附、折叠、模板、卡片导出、灯光、断开/重叠反馈等端到端流程(需本机 Chrome,`npm run dev` 后运行)。
