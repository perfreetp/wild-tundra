# 腔镜器械操作训练台

基于 TypeScript + Svelte + Babylon.js(WebGPU 优先,自动回退 WebGL)的腔镜抓钳操作仿真训练台。

## 运行

```bash
npm install
npm run dev        # 开发
npm run build      # 生产构建
npm run check      # 类型检查
```

浏览器打开 http://localhost:5173(WebGPU 需要 Chrome/Edge 113+;不支持时自动回退 WebGL,顶栏显示当前引擎)。

## 操作

| 功能 | 左钳 | 右钳 |
|---|---|---|
| 手柄移动(水平面) | W A S D | I J K L |
| 插入 / 退出 | Q / E | U / O |
| 钳口 闭 / 开 | Z / X | N / M |
| 杆自转 | C / V | , / . |
| 相机 | 左键旋转 · **中键平移** · **滚轮缩放** | |

## 功能对照

- **杠杆约束**:手柄移动经戳卡点(支点)映射为钳尖反向旋转 —— `src/lib/instrument.ts` 的 `moveHandle`,由手柄目标点反解杆轴方向。
- **钳口开合**:双侧钳口对称角度控制,限位 0–35°。
- **吸附抓取**:钳尖距物体 < 阈值且钳口收拢时吸附跟随;钳口张开按钳尖当前速度抛出,随后走弹道 + 器官/地面碰撞(`src/lib/graspables.ts`、`simulation.ts` 的 `updateGrasp`)。
- **器官碰撞**:射线-椭球求交限制插入深度以约束穿透量,接触时器官高亮并在面板标记(`src/lib/world.ts`)。
- **三个训练任务**:顶部切换 夹取 / 放置 / 穿孔环(`src/lib/tasks.ts`)。
- **读数面板**:右侧实时显示两把器械末端三维位置(mm)与关节链各级角度。
- **关节链解算**:戳卡偏航 → 俯仰 → 插入移动副 → 杆自转 → 钳口,逐级写入场景节点。
- **记录回放**:30 Hz 采样器械运动学状态,导出 JSON;导入 JSON 线性插值回放(`src/lib/recorder.ts`)。

## 目录

```
src/
  lib/
    engine.ts      WebGPU/WebGL 引擎创建
    world.ts       场景、相机、器官、戳卡点、目标区、立柱
    instrument.ts  抓钳运动学(杠杆约束 + 关节链)
    graspables.ts  可抓取物体(吸附/抛出/简易物理)
    tasks.ts       训练任务判定
    recorder.ts    操作记录与回放
    simulation.ts  主循环:输入、抓取、碰撞、UI 同步
  components/      TopBar / SidePanel
```
