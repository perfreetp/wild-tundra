# 列车驾驶视景渲染工具

基于 **TypeScript + React + three.js + three-mesh-bvh** 的列车驾驶视景渲染工具，用于多视点观察线路与隧道场景。

## 功能特性

### 多视点相机系统
- 加载线路后沿**轨道中心线**在同一里程处自动生成三个视点：**前向 / 左前（偏航 18°）/ 右前（偏航 -18°）**
- 每个视点独立可调：
  - 视场角 FOV **30–90°**
  - 近裁面 Near **0.5–5 m**（远裁面 200–3000 m 可调）
- 顶部标签页切换：三个单视点 + **三屏同显**（单 WebGLRenderer 三分视口）
- 单视点模式下鼠标拖拽 / 滚轮调整朝向与距离，拖拽后自动切换为手动机位，可一键复位吸附回中心线

### three-mesh-bvh 加速
- 场景按 40 m 里程分块（chunk），每块几何构建独立 **BVH**
- **视锥内加速裁剪**：`MeshBVH.shapecast` 与相机六面体求交，快速判定分块可见性
- **遮挡判断用射线检测**：`Raycaster.firstHitOnly` 走 BVH 加速，从相机射向分块中心判定遮挡，结果按分块缓存（600 ms TTL）并限制每帧射线预算
- 外部 GLB 模型按材质批合并后同样构建 BVH 并接入同一裁剪管线

### 绘制调用预算
- 三屏同显时三个相机的 draw call **硬上限 200 次**
- EWMA 平滑统计 + 五级视距（1200/800/550/380/260 m）自动升降级
- **帧内硬保证**：单帧超限立即收窄视距并重渲该帧，HUD 实时显示 draw call、分块数、遮挡剔除数、三角形与 FPS

### 材质与灯光
- **隧道内壁**与**列车车体**分别设置颜色、粗糙度，车体另可调金属度
- 灯光强度 **0–3 档**滑条，联动半球环境光、方向光与跟随列车的隧道点光源（0 档灭灯仅留微弱环境光）

### 雨雾天气
- 雨天：跟随相机的 GPU 雨粒子 + CSS 雨幕叠加层，强度可调
- 雾天：场景线性雾 + 屏幕朦胧叠加层，**能见度 50–500 m** 滑条联动雾 far 平面与叠加层不透明度

### 场景配置持久化
- 保存内容：三个视点的**位置 / 朝向 / FOV / 近远裁面**、灯光档位、雨雾天气、材质、行驶状态
- **保存到浏览器本地**（localStorage，启动自动恢复）
- **导出 JSON 文件**用于分享，**导入 JSON** 后完整还原视点与天气状态（含结构与取值范围校验）

### 线路数据
- 内置 1200 m 演示线路（S 形曲线、隧道/明线交替、钢轨轨枕、接触网、列车）
- 加载外部 **.glb / .gltf** 线路三维模型
- 导入 / 导出中心线 JSON：`{ "points": [[x, y, z], ...] }`

## 快速开始

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5180
```

## 构建与测试

```bash
npm run typecheck  # TypeScript 严格类型检查
npm run build      # 类型检查 + 生产构建到 dist/
npm run preview    # 预览生产构建

# 端到端冒烟测试（无头 WebGL）
npm run preview -- --port 5181 --strictPort   # 终端 A
node tests/make-assets.mjs                     # 生成 GLB/中心线测试资源（首次）
node tests/e2e.mjs                             # 终端 B
```

E2E 覆盖：WebGL 初始化、三屏 200 次绘制预算、FOV/Near 边界、灯光档位、雨雾叠加、
localStorage 往返、JSON 导入还原、GLB 模型加载、中心线导入、运行时错误检查。

## 架构

```
src/
├── engine/
│   ├── types.ts          # 领域类型（视点/天气/配置/分块/统计）
│   ├── bvh.ts            # BVH 初始化、视锥 shapecast、遮挡射线
│   ├── cameraRig.ts      # 中心线 → 前向/左前/右前三机位
│   ├── culling.ts        # 距离 + 视锥 + 遮挡三级裁剪管线
│   ├── drawBudget.ts     # 200 次绘制调用预算（EWMA + 帧内硬保证）
│   ├── sceneBuilder.ts   # 演示世界（隧道/轨道/接触网/列车分块）
│   ├── weather.ts        # 线性雾 + 跟随相机的雨粒子
│   └── viewEngine.ts     # 单渲染器三相机、视口管理、渲染循环
├── services/
│   ├── modelLoader.ts    # GLB/GLTF 加载、BVH 分块、中心线解析
│   └── persistence.ts    # localStorage、JSON 导入导出与校验
├── store/appStore.ts     # zustand 全局状态
├── components/           # React UI（顶栏/视口/面板/HUD/叠加层）
└── App.tsx
```

### 渲染循环要点
1. 自动行驶推进里程 → 列车与自动机位沿中心线定位
2. 每个相机独立执行：距离裁剪 → BVH 视锥求交 → 射线遮挡（缓存节流）
3. 单视点整幅 / 三屏 `setViewport + setScissor` 分段渲染，手动管理 `renderer.info`
4. 三屏超 200 次绘制调用时帧内收窄视距重渲
5. 统计 4 Hz 节流上报 HUD，机位 2.5 Hz 节流回传面板

## 配置 JSON 格式

```json
{
  "schemaVersion": 1,
  "savedAt": "2026-11-21T00:00:00.000Z",
  "routeProgress": 120.5,
  "autoDrive": true,
  "driveSpeed": 22,
  "views": {
    "front":     { "fov": 60, "near": 1, "far": 1500, "rigMode": true,
                   "pose": { "position": [0, 3.4, 0], "lookAt": [120, 3.4, 0], "up": [0, 1, 0] } },
    "leftFront": { "...": "同结构" },
    "rightFront": { "...": "同结构" }
  },
  "weather": { "rain": false, "fog": true, "visibility": 300, "rainIntensity": 0.5 },
  "lightLevel": 2,
  "materials": {
    "tunnelColor": "#9aa0a6", "tunnelRoughness": 0.92,
    "trainColor": "#e8ecf1", "trainRoughness": 0.35, "trainMetalness": 0.25
  }
}
```
