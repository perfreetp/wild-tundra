# 车载摄像头成像仿真工具（Vehicle Camera Imaging Simulator）

面向自动驾驶视觉团队的浏览器端相机成像仿真平台。在 3D 场景中摆放虚拟车辆与道路标线，
通过虚拟相机实时成像，模拟真实车载传感器的光学、曝光与读出特性，用于算法早期验证、
数据增强与标定演示。

## 技术栈

- **TypeScript + React 18**：UI 与状态管理（zustand）
- **three.js r169**：3D 场景、灯光、阴影、射线拾取
- **postprocessing 6.36**：后处理合成（Bloom + 4 个自定义 GLSL Effect）
- **Vite 5**：开发服务器与生产构建

## 快速开始

```bash
npm install
npm run dev        # 开发模式，默认 http://127.0.0.1:5173
npm run build      # 类型检查 + 生产构建，产物在 dist/
npm run preview    # 本地预览生产构建
```

## 功能清单与实现位置

| 需求 | 实现方式 | 主要文件 |
| --- | --- | ---|
| 虚拟车辆 / 道路标线摆放 | 程序化建模 + TransformControls  gizmo，支持点击拾取、移动/旋转、面板精确编辑 | `three/SceneBuilder.ts`、`three/SimulationEngine.ts` |
| 桶形 / 枕形畸变 | 自定义 GLSL，r²+r⁴ 径向多项式，各向同性（宽高比补偿），画面外填黑 | `effects/LensDistortionEffect.ts` |
| 焦距 / FOV 30–120° | FOV 直接驱动 PerspectiveCamera，焦距作物理标注 | `components/CameraPanel.tsx` |
| 曝光 / 动态范围档位 | EV 每档 ×2 亮度；扩展 Reinhard 曲线，白点由动态范围档（6–20）决定 | `effects/ExposureEffect.ts` |
| 隧道出入口明暗过渡 | 相机巡航穿过隧道，基于位置的线性过渡压制阳光/环境光，配 EV 快捷档位 | `three/SimulationEngine.ts` |
| 夜间眩光 / 光晕 | BloomEffect 按光源亮度阈值触发，车灯/路灯/隧道灯条自发光驱动 | `three/SceneBuilder.ts`、`SimulationEngine.ts` |
| 滚动快门倾斜量 | 自定义 GLSL，按行曝光时刻对运动流做剪切/径向果冻形变，0 即全局快门 | `effects/RollingShutterEffect.ts` |
| 标定网格 | 固定像素线宽的网格 + 中心十字叠加（避免 fwidth 在全屏三角形上的导数泄漏） | `effects/GridOverlayEffect.ts` |
| 白天 / 黄昏 / 夜间预设 | 三套天空、雾、太阳、环境光与人工光源强度曲线 | `presets.ts` |
| 配置保存到浏览器 | localStorage 持久化相机参数组，支持命名、应用、删除 | `store.ts` |
| 截图 / 参数文件分享 | PNG 截图（preserveDrawingBuffer）+ JSON 导入导出 | `components/Toolbar.tsx`、`PresetPanel.tsx` |

## 后处理管线

```
RenderPass
  → EffectPass 1: Bloom（眩光）→ Exposure（EV + 动态范围色调映射）
  → EffectPass 2: LensDistortion → RollingShutter → GridOverlay
  → CopyPass（统一 sRGB 编码输出）
```

自定义 Effect 统一使用 `BlendFunction.SET`（全画面替换语义），
不要用 `NORMAL`——后者走 alpha 混合路径，在 EffectMaterial 链中会产生颜色污染。

## 场景操作

- **左键点击**车辆/车道线：选中并附着变换 gizmo
- gizmo 拖动时自动暂停巡航；右侧面板可输入精确坐标、朝向、颜色、标线尺寸
- 巡航开关与速度在「场景编辑」页；相机沿道路循环行驶，经过 z=-70~-130 的隧道段

## 无头回归验证（可选）

URL 查询参数 `?test=<工况>` 会自动切换参数组合，便于截图回归：

`night` / `dusk` / `pincushion` / `barrelWide` / `tunnelDark` / `overExposed` / `rolling`

## 目录结构

```
src/
├── effects/          # 四个自定义 postprocessing Effect
├── three/            # 场景构建与渲染引擎
├── components/       # React UI（视角、面板、工具栏）
├── presets.ts        # 光照预设与道路/隧道常量
├── store.ts          # zustand 状态 + localStorage 持久化
└── types.ts          # 全局类型
```

## 已知约束

- 为保证截图稳定启用了 `preserveDrawingBuffer`，有少量显存开销
- 开发模式刻意不启用 React StrictMode（避免 WebGL 上下文与 store 订阅双挂载）
- 滚动快门以运动流近似逐行读出，未做逐像素时间戳的物理级仿真
