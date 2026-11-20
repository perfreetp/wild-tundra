# 室内火灾内攻视景漫游工具

基于 TypeScript + Web Components + three.js(WebGPURenderer)的室内火灾第一人称漫游训练工具。

## 运行

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 生产构建 → dist/
npm run typecheck  # 类型检查
```

浏览器需支持 WebGPU(Chrome/Edge 113+);不支持时自动回退 WebGL2 后端,功能一致。

## 操作

| 操作 | 说明 |
| --- | --- |
| 点击画面 | 锁定鼠标进入第一人称 |
| 鼠标移动 | 视角 |
| `W A S D` / 方向键 | 移动 |
| `Space` / `C`(或 `E`/`Q`) | 升降(观察顶棚烟气层 / 低姿推进) |
| `Shift` | 加速 |
| `Esc` | 释放鼠标 |

## 功能

- **双渲染模式**:工具栏切换 可见光 / 热成像。热成像用铁红伪彩色把温度场映射到画面(黑→紫红→橙→亮白)。
- **热场/烟气场**:按解析模型逐位置计算——火核高斯项 + 辐射平方衰减 + 热烟气上浮高度修正;烟气浓度换算能见度,驱动指数雾与体积感粒子层遮挡。
- **热浪扭曲**:相机附近温度超过阈值后,后处理通道对画面做时变噪声 UV 扭曲,越靠近火源越强烈。
- **左侧面板**:实时显示当前位置温度(°C)与能见度(m),附位置坐标与模式指示。
- **自动漫游**:沿预设路径(Catmull-Rom 平滑,穿三个门洞)自动巡航;可随时停止恢复手控。
- **轨迹记录/回放**:手动或自动漫游均可录制(10Hz 位姿采样),停止后可回放。
- **本地持久化**:场景与热场数据、最近轨迹存于 `localStorage`,刷新自动恢复。
- **路径文件**:轨迹可导出为 JSON 文件(`fire-roam-path.json`),他人通过"导入路径"载入并回放。

## 代码结构

```
src/
  main.ts                入口
  core/app.ts            应用编排:渲染循环、模式切换、命令分发、持久化
  core/controls.ts       第一人称指针锁定控制
  scene/building.ts      楼层平面(三室、门洞、家具)
  scene/fire.ts          火焰可视化(双层锥体 + 闪烁光源)
  scene/smoke.ts         烟气粒子层(按浓度场分布)
  thermal/field.ts       热场/烟气场解析模型(CPU 采样)
  thermal/thermalNodes.ts TSL 温度节点、伪彩色材质、热浪后处理
  path/roam.ts           轨迹记录/回放、预设路径、导入导出
  ui/components.ts       Web Components:<fr-hud> 左侧面板、<fr-toolbar> 工具栏
```

## 修改场景

- 楼层平面/家具:`src/scene/building.ts` 的 `WALLS` / `FURNITURE`
- 火源:`src/thermal/field.ts` 的 `ThermalField.defaultFires()`(位置、热释放速率、火核半径、产烟系数)
- 预设漫游路径:`src/path/roam.ts` 的 `PRESET_WAYPOINTS`
