import { Scene } from "@babylonjs/core/scene";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";
import { Color3 } from "@babylonjs/core/Maths/math.color";

const VERTEX = `attribute position: vec3f;
attribute normal: vec3f;
attribute color: vec4f;
uniform world: mat4x4f;
uniform worldViewProjection: mat4x4f;
varying vWorld: vec3f;
varying vNormal: vec3f;
varying vColor: vec4f;
@vertex
fn main(input : VertexInputs)->FragmentInputs {
    let wp: vec4f = uniforms.world * vec4f(vertexInputs.position, 1.0);
    vertexOutputs.position = uniforms.worldViewProjection * vec4f(vertexInputs.position, 1.0);
    vertexOutputs.vWorld = wp.xyz;
    vertexOutputs.vNormal = normalize((uniforms.world * vec4f(vertexInputs.normal, 0.0)).xyz);
    vertexOutputs.vColor = vertexInputs.color;
}`;

const FRAGMENT = `varying vWorld: vec3f;
varying vNormal: vec3f;
varying vColor: vec4f;
uniform sunDir: vec3f;
uniform tint: vec4f;
uniform opacity: f32;
uniform cameraPosition: vec3f;
uniform rimPower: f32;
uniform twoSided: f32;
@fragment
fn main(input : FragmentInputs)->FragmentOutputs {
    var n: vec3f = normalize(input.vNormal);
    let sun: vec3f = normalize(uniforms.sunDir);
    let viewDir: vec3f = normalize(uniforms.cameraPosition - input.vWorld);
    // 双面材质：背向观察者时翻转法线，避免边坡背面死黑
    if (uniforms.twoSided > 0.5 && dot(n, viewDir) < 0.0) {
        n = -n;
    }
    let ndl: f32 = max(dot(n, sun), 0.0);
    let sky: f32 = 0.5 + 0.5 * n.y;
    let halfV: vec3f = normalize(sun + viewDir);
    let spec: f32 = pow(max(dot(n, halfV), 0.0), 48.0) * 0.18;
    let rim: f32 = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0) * uniforms.rimPower;
    let lit: f32 = 0.26 + 0.74 * (0.34 * sky + 0.86 * ndl);
    var c: vec3f = input.vColor.rgb * uniforms.tint.rgb * lit + spec;
    c = c + vec3f(0.55, 0.68, 0.9) * rim;
    fragmentOutputs.color = vec4f(c, input.vColor.a * uniforms.opacity);
}`;

let registered = false;
function register() {
  if (registered) return;
  ShaderStore.ShadersStoreWGSL["studioVertexShader"] = VERTEX;
  ShaderStore.ShadersStoreWGSL["studioPixelShader"] = FRAGMENT;
  registered = true;
}

export interface StudioOptions {
  tint?: Color3;
  opacity?: number;
  sunDir?: [number, number, number];
  rimPower?: number;
  twoSided?: boolean;
}

export function createStudioMaterial(scene: Scene, name: string, opts: StudioOptions = {}) {
  register();
  const mat = new ShaderMaterial(name, scene, "studio", {
    attributes: ["position", "normal", "color"],
    uniforms: [
      "world",
      "worldViewProjection",
      "sunDir",
      "tint",
      "opacity",
      "cameraPosition",
      "rimPower",
      "twoSided",
    ],
    shaderLanguage: ShaderLanguage.WGSL,
    needAlphaBlending: (opts.opacity ?? 1) < 1,
  });
  const tint = opts.tint ?? new Color3(1, 1, 1);
  mat.setColor4("tint", { r: tint.r, g: tint.g, b: tint.b, a: 1 });
  mat.setFloat("opacity", opts.opacity ?? 1);
  const sun = opts.sunDir ?? [-0.55, 0.72, 0.42];
  mat.setVector3("sunDir", { x: sun[0], y: sun[1], z: sun[2] });
  mat.setFloat("rimPower", opts.rimPower ?? 0.08);
  mat.setFloat("twoSided", opts.twoSided ? 1 : 0);
  if (opts.twoSided) mat.backFaceCulling = false;
  return mat;
}
