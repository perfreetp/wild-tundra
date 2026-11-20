# 器官三维重建工具

基于 TypeScript + React + three.js + manifold-3d 的 CT 器官三维重建应用。

## 运行

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 生产构建
node test/smoke.mjs  # 核心算法冒烟测试（Node 直接跑，无需浏览器）
```

打开页面后点击 **演示数据** 可立即体验（合成椭球器官 + 病灶 + 噪点），
或点击 **导入 DICOM 序列** 选择一个序列的全部切片文件（目前支持未压缩传输语法）。

## 功能

- **DICOM 导入**：解析切片序列，按 ImagePositionPatient/实例号排序堆叠成体素体，
  应用 Rescale Slope/Intercept 还原 CT 值（HU）
- **窗宽窗位**：两个滑块，实时作用于切片显示与三维网格的 CT 值伪彩色映射
- **灰度阈值带**：上下限滑块定义体素蒙版，拖动时防抖触发 Worker 重建
- **等值面重建**：Worker 内 marching tetrahedra（带 1 体素 padding 保证封闭），
  随后用 manifold-3d 做布尔合并 + 流形修复，自动去掉体积小于最大分量 1% 的孤立小块
- **伪彩色**：表面顶点三线性采样 CT 值，映射到蓝→青→绿→黄→红 5 段色带，支持不透明度调节
- **剖切平面**：横断/冠状/矢状三个可独立开关的裁剪面，拖动显示内部结构
- **切片浏览**：左侧横断面视图，滚轮翻层，显示层号与阈值蒙版红色叠加
- **三维视口**：轨道旋转 / 缩放 / 平移（OrbitControls）
- **状态栏**：三角面数、重建耗时、连通分量数
- **导出**：STL（二进制）与 GLB

## 结构

```
src/
  App.tsx          主界面与状态编排
  reconCore.ts     核心算法：marching tetrahedra / 流形修复 / CT 采样（可脱离浏览器测试）
  recon.worker.ts  Worker 入口，加载 manifold-3d WASM，调用 reconCore
  reconClient.ts   主线程 Worker 客户端（体数据只传一次，过期请求自动丢弃）
  dicom.ts         DICOM 序列解析与体素堆叠
  Viewport.tsx     three.js 三维视口（网格、伪彩色、剖切平面）
  SliceViewer.tsx  切片浏览与蒙版叠加
  ControlPanel.tsx 控制面板
  colormap.ts      5 段色带与顶点色计算
  exporters.ts     STL / GLB 导出
  demoVolume.ts    合成演示体数据
test/
  smoke.mjs        核心算法端到端测试（流形性、去小块、体积、采样）
  diag.mjs         网格拓扑诊断（边流形性、定向一致性、退化三角形）
```
