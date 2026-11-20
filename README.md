# 列车视景合成台 · RailView Compositor

基于 **TypeScript + 原生 Web Components + three.js + postprocessing** 的列车驾驶视景多图层合成工具。
面向驾驶模拟器 / 视景系统的图层调试：把远景、中景、近景三层独立渲染的视景，在 `EffectComposer`
中用自定义合成通道逐层叠加，实时调节透明度、混合模式、雾效与色温，并把整套合成状态保存 / 分享。

![界面](screenshots/preset-clear-noon.png)

## 功能

| 需求 | 实现 |
| --- | --- |
| 加载远景 / 中景 / 近景三个视景图层 | 三层各自是独立的 three.js `Scene`，用程序化几何与贴图生成（山脊、村庄、轨道、接触网…） |
| 每层单独调整透明度 0–1 | 每个图层有独立滑条，实时写入合成通道 |
| 每层混合模式：正常 / 叠加 / 滤色 | 分段按钮切换，对应 `normal` / `overlay` / `screen` |
| 图层顺序用拖拽调整 | 图层面板支持 HTML5 拖放，也提供 ↑/↓ 按钮与键盘操作 |
| 用 postprocessing 合成通道串联图层 | 自定义 `LayerPass`（`postprocessing` 的 `Pass` 子类）逐层合成 |
| 雾效强度 0–1 滑条控制远近景衰减 | 距离雾按图层深度缓冲计算，逐层权重不同 |
| 昼夜切换改变环境光色温 2000–8000 K | 色温滑条 + 昼夜偏移，驱动天空、光照、雾色 |
| 视景相机俯仰 -30–30°、偏航 -60–60° | 滑条 / 画面拖拽 / 方向键三种方式 |
| 合成结果实时显示 | `requestAnimationFrame` 渲染循环，参数即时生效 |
| 参数保存到浏览器本地 | `localStorage` 防抖自动保存，启动自动还原 |
| 导出 JSON 分享 / 导入还原 | 带版本号的导出文档，导入时校验并钳制越界值 |

## 快速开始

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

生产构建与预览：

```bash
npm run build      # 类型检查 + vite build → dist/
npm run preview    # 预览 dist（默认 http://127.0.0.1:4173）
```

要求：支持 **WebGL2** 的现代浏览器（Chrome / Edge / Firefox / Safari 16+）。

## 使用说明

- **图层堆栈**：右侧列表从上到下 = 后渲染 → 先渲染。按住最左侧的拖拽手柄拖动即可换序；↑/↓ 也可换序，👁 控制显隐。
- **透明度 / 混合**：每个图层独立的滑条与「正常 / 叠加 / 滤色」按钮。
- **雾效**：滑条 0 完全通透，1 浓雾；远景比近景更早被吞没，HUD 会显示估计能见度。
- **色温**：2000 K（暖）到 8000 K（冷）。白天在设定值上叠加 −300 K 的暖偏移，夜间叠加 +1800 K 的冷偏移，
  结果始终落在 2000–8000 K 范围内（滑条旁会显示「设定值 → 实际值」）。
- **相机**：拖动画面、方向键（Shift 微调）或右侧滑条调整俯仰 / 偏航；「回正视角」一键归零。
- **保存 / 分享**：所有改动会自动存到浏览器本地；「导出 JSON」得到可分享的状态文件，「导入」可完整还原
  （包括图层顺序、透明度、混合模式、雾效、色温、昼夜与相机角度）。
- 顶部四个预设（晴空午间 / 清晨薄雾 / 黄昏叠加 / 夜间滤色）可快速切换典型视景。

### 键盘

| 按键 | 作用 |
| --- | --- |
| 方向键 | 相机上下 / 左右微调（Shift 加速细调） |
| Tab / Space / Enter | 常规焦点与按钮激活 |

## 架构

```
src/
├─ core/                 纯逻辑（可单测）
│  ├─ types.ts           图层 ID、混合模式、状态类型与范围常量
│  ├─ view.ts            默认状态、校验归一化（sanitizeView）、顺序变换
│  ├─ store.ts           轻量响应式 store（订阅 / 变更原因 / 版本号）
│  ├─ persist.ts         localStorage 读写、导出文档、导入解析
│  ├─ color.ts           色温 → RGB、白平衡系数、昼夜色温偏移
│  └─ math.ts            clamp / 噪声（fbm、ridged）/ 确定性随机
├─ render/               three.js + postprocessing
│  ├─ engine.ts          渲染器、合成器装配、状态应用、画质自适应
│  ├─ layer-pass.ts      核心：单图层的合成通道（LayerPass）
│  ├─ layers.ts          三个视景图层的程序化场景构建
│  ├─ lights.ts          逐图层三点光照 + 表面反照率常量
│  ├─ palette.ts         昼夜 / 色温 → 天空、雾、光照调色板
│  ├─ sky.ts             天空穹顶（渐变、太阳/月亮、星空、双层云）
│  ├─ view-camera.ts     视景相机（YXZ 欧拉角 + 俯仰/偏航钳制）
│  ├─ effects.ts         自定义调色 Effect 与 FXAA Effect
│  ├─ textures.ts        程序化贴图（云、道砟、混凝土、地面）
│  ├─ geometry.ts        山脊带、截面扫掠等几何生成
│  └─ look.ts            夜间 / 色温 / 大气透视的材质调色
└─ ui/                   Web Components（Shadow DOM + 构造样式表）
   ├─ base-element.ts    组件基类（共享样式、微批渲染、事件上报）
   ├─ layer-stack.ts     图层堆栈（拖拽排序、透明度、混合模式）
   ├─ scene-controls.ts  雾效、色温、昼夜、相机
   ├─ toolbar.ts         预设、导出、导入、重置
   ├─ hud.ts             画面内 HUD（帧率、能见度、相机角度）
   └─ styles.ts          组件共享 Design Token / 基础样式
```

### 合成管线

```
SkyPass ──▶ LayerPass(far) ──▶ LayerPass(mid) ──▶ LayerPass(near) ──▶ Bloom ──▶ FXAA ──▶ Grade ──▶ 屏幕
```

每个 `LayerPass` 做两件事：

1. 把本图层场景渲染到独立的 `WebGLRenderTarget`（颜色 + 深度纹理，透明背景）；
2. 用全屏着色器读取上一通道结果，按 `alpha × opacity` 与混合函数（normal / overlay / screen）叠加，
   并按该像素的深度做距离雾。

图层顺序改变时，`EffectComposer` 中的通道顺序同步重排，因此三层可以被任意串联。
`Grade` 效果负责曝光、ACES 色调映射、对比度/饱和度、暗角与轻微颗粒；`FXAA` 抑制几何边缘锯齿。

### 持久化格式

```json
{
  "kind": "railview-view-state",
  "version": 1,
  "exportedAt": "2026-11-21T00:00:00.000Z",
  "app": "railview-compositor",
  "view": {
    "layers": {
      "far":  { "opacity": 1, "blend": "normal", "visible": true },
      "mid":  { "opacity": 0.72, "blend": "overlay", "visible": true },
      "near": { "opacity": 1, "blend": "normal", "visible": true }
    },
    "order": ["far", "mid", "near"],
    "fog": 0.34,
    "colorTemp": 5600,
    "night": false,
    "camera": { "pitch": -2, "yaw": 0 }
  }
}
```

导入时兼容裸 `view` 对象；未知 `kind`、过高 `version`、非 JSON 都会给出明确错误；
数值越界会被钳制到合法范围，缺失图层顺序会自动补齐。

## 测试

```bash
npm test           # 单元测试（vitest）：状态校验、持久化、色彩与噪声
npm run typecheck  # tsc --noEmit
```

浏览器端验证脚本（需要本机 Chrome；先 `npm run build && npm run preview`）：

```bash
node scripts/e2e.mjs           # 交互全流程：滑条/混合/拖拽/导入导出/移动端
node scripts/blend-verify.mjs  # 验证三种混合模式确实产生不同像素
node scripts/measure.mjs       # 采样画面亮度，检查昼夜/雾效响应
node scripts/screenshot.mjs    # 生成截图
```

## 说明

- 视景内容全部程序化生成，不依赖外部素材。
- 渲染分辨率会在长时间低帧率时自动降级（最低 0.6×），帧率恢复后自动抬回；
  自动化脚本加 `?debug=1` 可关闭降级并允许回读帧缓冲。
- 雾的强度按图层加权：远景最先被雾化，近景最抗雾，符合真实驾驶视景的大气透视。
