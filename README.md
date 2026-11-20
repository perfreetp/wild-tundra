# 激光雷达回波强度仿真工具

浏览器端 LiDAR 回波强度仿真：可旋转城市场景 + 八类可调材质 + BVH 射线求交 +
入射角/距离/雨雾强度合成 + 蓝红色阶点云 + xyz/intensity 文本导出。
纯 TypeScript + three.js + three-mesh-bvh 实现，无后端。

## 运行

```bash
npm install
npm run dev        # 开发，浏览器打开终端提示的地址
npm run build      # 类型检查 + 生产构建到 dist/
npm run preview    # 预览构建产物
```

## 模块结构

| 文件 | 职责 |
| --- | --- |
| `src/types.ts` | 材质、扫描、天气、点云记录等类型与阈值常量 |
| `src/materials.ts` | 八类材质默认反射率/粗糙度，四档天气（含 σ=0.02/0.08/0.2） |
| `src/scene.ts` | 城市几何（道路、建筑、车辆、路牌、护栏、植被等），按材质合并为 8 个网格并各自构建 BVH |
| `src/scanner.ts` | 线束/角分辨率射线生成、BVH 最近命中求交、法线与入射角、强度合成、雾衰减与丢点 |
| `src/pointcloud.ts` | 点云渲染：蓝→青→绿→黄→红色阶，法线近垂直强回波白色加亮层 |
| `src/panel.ts` | 控制面板：材质滑块、扫描档位、雾档、显示开关、统计 |
| `src/exporter.ts` | xyz + intensity 文本导出，文件名带线束数与雾档 |
| `src/main.ts` | 装配 three.js 场景、OrbitControls、扫描编排与防抖重算 |

## 强度模型

```
I_raw = ρ · ( cosθ·漫反射 + (1-α)·镜面项 + 掠射Fresnel补偿 ) · R_ref² / max(R, R_knee)²
I     = clamp(I_raw · exp(-σ·R), 0, 1)
```

- `ρ` 材质反射率（面板 0.05–0.9 可调），`α` 粗糙度（越小镜面峰越尖锐）
- `cosθ` 射线与面法线夹角余弦；`cosθ ≥ 0.95` 且强度足够时标记为强回波高亮
- 距离平方衰减以 20 m 为参考距离、2 m 软拐点防近距发散
- 雨雾按 Beer–Lambert `T=exp(-σR)` 衰减，并按透射率做确定性随机丢点，点云实时变稀

## 关键档位

- 线束：16 / 32 / 64 / 128；水平角分辨率：0.1° / 0.2° / 0.4° / 0.8°
- 128 线 + 0.1° 对应 460,800 条射线/帧
- 雾消光系数：轻雾 0.02、中雾 0.08、浓雾 0.2（1/m），另含晴天档

## 导出

文本格式，头部注释记录参数，每行四列 `x y z intensity`：

```
# LiDAR intensity simulation export
# channels=128 horizontal_resolution_deg=0.1 max_range_m=100
# weather=mediumFog extinction_per_m=0.08
# point_count=...
# columns: x y z intensity
x y z intensity
...
```

文件名形如 `lidar_128ch_mediumFog_20261121_040539.txt`。

## 测试

`tests/smoke_test.py` 使用 Playwright 驱动无头 Chromium 做端到端冒烟测试
（射线数、八类材质覆盖、强度范围、雾档丢点、反射率重算、128 线档位、导出格式）。
无头环境需软件渲染，脚本已内置 `--disable-gpu` + SwiftShader 参数。
