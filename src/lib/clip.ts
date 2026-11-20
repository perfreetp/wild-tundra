// 剖切控制器:
// - 实体:StandardMaterial,由 scene.clipPlane 裁掉剖切平面以上部分
// - 半透明"幽灵"壳:自定义 ShaderMaterial(不受 scene.clipPlane 影响),
//   在着色器中丢弃剖切平面以下部分,只显示被裁掉的区域
// - 剖切面:自定义着色器绘制的网格线平面
import {
  Color3,
  Mesh,
  MeshBuilder,
  Plane,
  Scene,
  ShaderLanguage,
  ShaderMaterial,
  ShaderStore,
  Vector3,
  Vector4,
} from "@babylonjs/core";
import type { BuiltModel } from "./model";
import { CATEGORY_COLORS } from "./model";
import type { BuildingCategory, SectionState } from "./types";

const GHOST_ALPHA = 0.16;
const GRID_EXTENT = 150; // 剖切面网格半径(米)

export class ClipController {
  private scene: Scene;
  private ghostMaterials: ShaderMaterial[] = [];
  private gridMaterial: ShaderMaterial;
  private gridMesh: Mesh;

  constructor(scene: Scene, lang: ShaderLanguage, model: BuiltModel) {
    this.scene = scene;
    registerShaders(lang);

    // 每类建筑一个幽灵材质
    for (const cat of Object.keys(CATEGORY_COLORS) as BuildingCategory[]) {
      const mat = new ShaderMaterial(
        `ghost-${cat}`,
        scene,
        { vertex: "ghost", fragment: "ghost" },
        {
          attributes: ["position", "normal"],
          uniforms: ["world", "viewProjection", "clipPlaneVec", "baseColor", "alpha"],
          shaderLanguage: lang,
          needAlphaBlending: true,
        },
      );
      mat.setColor3("baseColor", CATEGORY_COLORS[cat]);
      mat.setFloat("alpha", GHOST_ALPHA);
      mat.backFaceCulling = false;
      mat.disableDepthWrite = true;
      this.ghostMaterials.push(mat);

      // 为该类所有实体网格创建幽灵克隆(共享几何体)
      for (const mesh of model.solidMeshes) {
        const info = mesh.metadata?.floor as { category?: BuildingCategory } | undefined;
        const meshCat = info?.category ?? (mesh.name.startsWith("STA") ? "station" : null);
        if (meshCat !== cat) continue;
        const ghost = mesh.clone(`${mesh.name}-ghost`, null);
        if (!ghost) continue;
        ghost.material = mat;
        ghost.isPickable = false;
        ghost.alwaysSelectAsActiveMesh = true;
      }
    }

    // 剖切面网格线
    this.gridMaterial = new ShaderMaterial(
      "clipGrid",
      scene,
      { vertex: "grid", fragment: "grid" },
      {
        attributes: ["position"],
        uniforms: ["worldViewProjection", "lineColor", "gridSize", "majorEvery"],
        shaderLanguage: lang,
        needAlphaBlending: true,
      },
    );
    this.gridMaterial.setColor3("lineColor", new Color3(0.35, 0.85, 1.0));
    this.gridMaterial.setFloat("gridSize", 2); // 次网格 2m
    this.gridMaterial.setFloat("majorEvery", 5); // 每 5 条一条主线(10m)
    this.gridMaterial.backFaceCulling = false;
    this.gridMaterial.disableDepthWrite = true;

    this.gridMesh = MeshBuilder.CreatePlane(
      "clipGridPlane",
      { size: GRID_EXTENT * 2 },
      scene,
    );
    this.gridMesh.material = this.gridMaterial;
    this.gridMesh.isPickable = false;
    this.gridMesh.alwaysSelectAsActiveMesh = true;
    this.gridMesh.renderingGroupId = 1; // 在幽灵壳之后绘制
  }

  /** 由状态计算剖切平面。
   *  注意:Babylon 的 clipPlane 保留 n·p+d < 0 一侧(片元距离为正即丢弃)。 */
  computePlane(s: SectionState): Plane {
    if (s.direction === "horizontal") {
      // 保留 y <= clipHeight:y - h < 0
      return new Plane(0, 1, 0, -s.clipHeight);
    }
    // 垂直:法向在 XZ 平面内,过场景中心,保留 n·p < 0 一侧
    const rad = (s.clipAngle * Math.PI) / 180;
    const n = new Vector3(Math.cos(rad), 0, Math.sin(rad));
    return new Plane(n.x, n.y, n.z, 0); // 过原点(场景中心)
  }

  /** 应用剖切状态 */
  update(s: SectionState): void {
    const plane = this.computePlane(s);
    this.scene.clipPlane = plane;

    const vec = new Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.d);
    for (const m of this.ghostMaterials) {
      m.setVector4("clipPlaneVec", vec);
    }

    // 剖切面网格的位置与朝向
    if (s.direction === "horizontal") {
      this.gridMesh.rotation.set(Math.PI / 2, 0, 0);
      this.gridMesh.position.set(0, s.clipHeight, 0);
    } else {
      const rad = (s.clipAngle * Math.PI) / 180;
      this.gridMesh.rotation.set(0, Math.PI / 2 - rad, 0);
      this.gridMesh.position.set(0, 60, 0); // 垂直面居中于 0-120m 高度带
    }
  }
}

/** 注册 GLSL / WGSL 双语言着色器 */
function registerShaders(lang: ShaderLanguage): void {
  if (lang === ShaderLanguage.WGSL) {
    Object.assign(ShaderStore.ShadersStoreWGSL, WGSL_SHADERS);
  } else {
    Object.assign(ShaderStore.ShadersStore, GLSL_SHADERS);
  }
}

// ---------------- GLSL ----------------

const GLSL_SHADERS: Record<string, string> = {
  // 幽灵壳:裁剪平面以下丢弃,以上半透明
  ghostVertexShader: `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 world;
uniform mat4 viewProjection;
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
  gl_Position = viewProjection * wp;
}`,
  ghostFragmentShader: `
precision highp float;
uniform vec4 clipPlaneVec;
uniform vec3 baseColor;
uniform float alpha;
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main(void) {
  // 实体保留 n·p + d < 0 一侧,幽灵壳只显示被裁掉的一侧(距离为正)
  if (dot(clipPlaneVec.xyz, vWorldPos) + clipPlaneVec.w <= 0.0) discard;
  float rim = abs(normalize(vNormalW).y);
  vec3 col = baseColor * (0.7 + 0.3 * rim);
  gl_FragColor = vec4(col, alpha);
}`,

  // 剖切面网格线
  gridVertexShader: `
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec2 vLocal;
void main(void) {
  vLocal = position.xy;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`,
  gridFragmentShader: `
precision highp float;
uniform vec3 lineColor;
uniform float gridSize;
uniform float majorEvery;
varying vec2 vLocal;
float gridLine(vec2 p, float size) {
  vec2 q = p / size;
  vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
  return 1.0 - min(min(g.x, g.y), 1.0);
}
void main(void) {
  float minor = gridLine(vLocal, gridSize);
  float major = gridLine(vLocal, gridSize * majorEvery);
  float a = max(minor * 0.35, major * 0.9);
  vec3 col = mix(lineColor * 0.6, lineColor, major);
  // 轻微底色,便于看清剖切面范围
  gl_FragColor = vec4(col, a + 0.08);
}`,

  // 无光照纯色(地面等,不受剖切影响)
  unlitVertexShader: `
attribute vec3 position;
uniform mat4 worldViewProjection;
void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`,
  unlitFragmentShader: `
precision highp float;
uniform vec3 baseColor;
void main(void) {
  gl_FragColor = vec4(baseColor, 1.0);
}`,
};

// ---------------- WGSL ----------------

const WGSL_SHADERS: Record<string, string> = {
  ghostVertexShader: `
attribute position: vec3f;
attribute normal: vec3f;
uniform world: mat4x4f;
uniform viewProjection: mat4x4f;
varying vWorldPos: vec3f;
varying vNormalW: vec3f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
  let wp = uniforms.world * vec4f(vertexInputs.position, 1.0);
  vertexOutputs.vWorldPos = wp.xyz;
  vertexOutputs.vNormalW = normalize((uniforms.world * vec4f(vertexInputs.normal, 0.0)).xyz);
  vertexOutputs.position = uniforms.viewProjection * wp;
}`,
  ghostFragmentShader: `
uniform clipPlaneVec: vec4f;
uniform baseColor: vec3f;
uniform alpha: f32;
varying vWorldPos: vec3f;
varying vNormalW: vec3f;

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
  if (dot(uniforms.clipPlaneVec.xyz, fragmentInputs.vWorldPos) + uniforms.clipPlaneVec.w <= 0.0) {
    discard;
  }
  let rim = abs(normalize(fragmentInputs.vNormalW).y);
  let col = uniforms.baseColor * (0.7 + 0.3 * rim);
  fragmentOutputs.color = vec4f(col, uniforms.alpha);
}`,

  gridVertexShader: `
attribute position: vec3f;
uniform worldViewProjection: mat4x4f;
varying vLocal: vec2f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
  vertexOutputs.vLocal = vertexInputs.position.xy;
  vertexOutputs.position = uniforms.worldViewProjection * vec4f(vertexInputs.position, 1.0);
}`,
  gridFragmentShader: `
uniform lineColor: vec3f;
uniform gridSize: f32;
uniform majorEvery: f32;
varying vLocal: vec2f;

fn gridLine(p: vec2f, size: f32) -> f32 {
  let q = p / size;
  let g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
  return 1.0 - min(min(g.x, g.y), 1.0);
}

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
  let minor = gridLine(fragmentInputs.vLocal, uniforms.gridSize);
  let major = gridLine(fragmentInputs.vLocal, uniforms.gridSize * uniforms.majorEvery);
  let a = max(minor * 0.35, major * 0.9);
  let col = mix(uniforms.lineColor * 0.6, uniforms.lineColor, major);
  fragmentOutputs.color = vec4f(col, a + 0.08);
}`,

  unlitVertexShader: `
attribute position: vec3f;
uniform worldViewProjection: mat4x4f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
  vertexOutputs.position = uniforms.worldViewProjection * vec4f(vertexInputs.position, 1.0);
}`,
  unlitFragmentShader: `
uniform baseColor: vec3f;

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
  fragmentOutputs.color = vec4f(uniforms.baseColor, 1.0);
}`,
};
