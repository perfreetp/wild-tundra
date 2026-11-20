# 热网水力工况三维着色系统

基于 **TypeScript + React 18 + three.js（three-mesh-bvh）+ Zustand + Vite** 的供热管网水力工况三维可视化与诊断系统。所有数据保存在浏览器本地，管网与着色方案可导出 JSON 分享。

## 功能清单

| 模块 | 实现 |
| --- | --- |
| 数据导入 | 导入节点/管段 JSON，按拓扑自动构建三维管网；含宽松校验与错误提示 |
| 三维建模 | 管段沿折线逐段圆柱挤出（0.5m 轴向步长），折点球过渡；节点球按口径缩放，楼栋附挂点立管 |
| 双视图 | 供水 / 回水两套独立管网一键切换 |
| 水力解算 | 达西-韦斯伯格公式 + Swamee-Jain 摩擦因子；支状拓扑 BFS 定向，流量自叶向根汇总、压力/温度沿程递推 |
| 逐顶点着色 | 自定义 ShaderMaterial，压力/温度逐顶点映射 **8 级色带**，含 Lambert + Fresnel 光照 |
| 超阈值 | 比摩阻超阈值管段红色 BackSide hull 描边 + 脉冲高亮，阈值可实时调节 |
| 拾取 | 逐管段独立 **three-mesh-bvh** 加速射线拾取（管段优先于节点球） |
| 管段弹窗 | 两端节点压力/温度/坐标、流量/流速/比摩阻，**0.5m 采样**的沿程压降与温度 SVG 曲线（标注泄漏折点） |
| 泄漏模拟 | 红色标记可拖拽，沿管折线吸附；按影响半径在管面逐顶点渲染红色扩散梯度；泄漏拆分为虚拟管段参与水力解算 |
| 受影响楼栋 | 同侧拓扑切断分析，自动标出无法到达热源的楼栋挂点，点击可飞行定位 |
| 节点树联动 | 左侧节点树搜索/分类过滤，点击飞行定位并与三维视图联动 |
| 视角预设 | 透视全景 / 俯视总览 / 街景巡检 3 个带补间动画的预设 |
| 本地持久化 | 管网、色带、泄漏点、UI 偏好全部写入 localStorage |
| 导入导出 | 管网数据 / 着色方案 / 完整工程包三类 JSON 导出，导入兼容单实体与完整包 |

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 类型检查 + 生产构建
npm run preview
```

## 测试

```bash
# 水力解算器 Node 冒烟测试（流量守恒、压力单调、泄漏拆分、受影响楼栋等 10 项断言）
npx esbuild scripts/smoke.ts --bundle --platform=node --format=esm --outfile=scripts/.smoke.mjs
node scripts/.smoke.mjs

# 无头浏览器端到端验证（需先 npm run dev；WebGL/Shader/BVH/拾取/拖拽/导出全链路）
node scripts/headless-check.cjs
```

无头验证通过 CDP 驱动本机 Chrome（SwiftShader 软渲染），覆盖：首帧渲染零控制台错误、21 节点树、8 级色带、BVH 点选弹窗与双曲线、泄漏布置→半径场顶点写入→滑杆调节→供回水切换显隐、标记拖拽吸附、节点树定位、JSON 导出、localStorage 持久化。

## 目录结构

```
src/
├── types.ts                  全部领域模型
├── store.ts                  Zustand 状态（解算调度、持久化）
├── lib/
│   ├── solver.ts             水力/热力解算 + 0.5m 沿程采样
│   ├── topology.ts           拓扑校验、受影响楼栋分析
│   ├── geometry.ts           折线几何、吸附、采样工具
│   ├── scheme.ts             默认 8 级色带
│   ├── sample.ts             内置 21 节点示范管网
│   ├── storage.ts            localStorage 与 JSON 下载
│   └── io.ts                 导入校验/信封解析
├── three/
│   ├── SceneManager.ts       场景、相机、BVH 拾取、泄漏拖拽、描边、预设
│   ├── geometryBuilder.ts    圆柱/球体几何、逐顶点属性、半径场
│   ├── shaders.ts            8 级色带逐顶点着色 Shader
│   └── bvh.d.ts              BVH 注入类型声明
└── components/               Toolbar / NodeTree / Viewport / SchemePanel / LeakPanel / PipeInfoPanel
```

## 导入数据格式

```jsonc
{
  "version": 1,
  "name": "片区热网",
  "nodes": [
    { "id": "N0", "name": "热源", "type": "source",
      "x": 0, "y": 0, "z": 2, "diameter": 400, "demand": 0 }
    // type: source | junction | building；building 的 demand 为需求流量 m³/h
  ],
  "supplyPipes": [
    { "id": "P0", "name": "主干", "from": "N0", "to": "N1",
      "diameter": 400,
      "polyline": [[30, 0, 2]] }   // 可选折线控制点，坐标单位米
  ],
  "returnPipes": [ /* 与供水同拓扑，id 需区分（如加 R 前缀） */ ]
}
```

## 水力模型说明

- 管段压降 `dp = f · (L/D) · ρv²/2`，摩擦因子 `f` 用 Swamee-Jain 显式式（当量粗糙度 0.5mm）
- 流量按支状拓扑从楼栋需求自叶向根汇总，泄漏点附加出流 `q = 0.5·R²` m³/h
- 供水：热源定压 1.0MPa / 110℃，沿程压力下降、温降按流量与长度估算
- 回水：热源 0.25MPa，楼栋回水 60℃，节点温度按流量加权混合
- 模型为工程演示级简化计算，未含泵阀特性曲线与环状网平差，可在 `lib/solver.ts` 替换为专业解算内核
