# 站城一体化三维剖切展示工具

基于 **TypeScript + Svelte + Babylon.js(WebGPU 优先,WebGL 自动回退)** 的站城一体化建筑群三维展示与分层剖切工具。

## 功能

- **建筑群模型**:程序化生成"站房 + 商业裙楼 + 住宅塔楼"站城一体化场景,三类建筑以不同材质颜色区分(站房·钢蓝 / 商业·暖橙 / 住宅·浅绿)
- **分层剖切**:
  - 水平剖切:高度滑条 0–120 m 控制水平剖切平面,平面以下显示实体、以上显示半透明"幽灵"壳
  - 垂直剖切:角度滑条 0–180° 控制垂直剖切平面朝向
  - 剖切面以自定义着色器(GLSL / WGSL 双语言)绘制网格线
- **楼层分组高亮**:楼层按建筑分组,点击楼层高亮并显示该层**高度区间**与**剖切后网格投影面积**(三角形裁剪 + 平面投影计算)
- **视图模式**:环绕 / 俯视一键切换
- **状态持久化**:剖切高度、方向、角度与视角自动保存到 localStorage;可导出 JSON 分享,导入后完整还原剖切状态与相机视角

## 运行

```bash
npm install
npm run dev      # 开发
npm run build    # 构建
npm run check    # 类型检查
```

## 技术要点

| 模块 | 说明 |
| --- | --- |
| `src/lib/scene.ts` | WebGPUEngine 初始化(失败回退 WebGL)、相机、视图模式 |
| `src/lib/model.ts` | 程序化建筑群,每楼层一个网格并携带 `FloorInfo` 元数据 |
| `src/lib/clip.ts` | 剖切控制:`scene.clipPlane` 裁实体 + 幽灵壳着色器反向裁剪 + 网格线剖切面 |
| `src/lib/area.ts` | 剖切面积:Sutherland–Hodgman 单平面裁剪三角形 → 投影到剖切平面求面积 |
| `src/lib/state.ts` | 状态校验、localStorage 持久化、JSON 导入导出 |

WebGPU 下自定义着色器使用 WGSL,WebGL 下使用 GLSL,两套着色器在 `clip.ts` 中按引擎能力自动注册。
