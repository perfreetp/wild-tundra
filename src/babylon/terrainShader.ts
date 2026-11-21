/** 地形着色器：自然地表 + 挖填方顶点着色 + 工程网格线 + 距离雾。 */
const VERTEX = `attribute position: vec3f;
attribute normal: vec3f;
attribute color: vec4f;
uniform world: mat4x4f;
uniform worldViewProjection: mat4x4f;
varying vWorld: vec3f;
varying vNormal: vec3f;
varying vTint: vec4f;
@vertex
fn main(input : VertexInputs)->FragmentInputs {
    let wp: vec4f = uniforms.world * vec4f(vertexInputs.position, 1.0);
    vertexOutputs.position = uniforms.worldViewProjection * vec4f(vertexInputs.position, 1.0);
    vertexOutputs.vWorld = wp.xyz;
    vertexOutputs.vNormal = normalize((uniforms.world * vec4f(vertexInputs.normal, 0.0)).xyz);
    vertexOutputs.vTint = vertexInputs.color;
}`;

const FRAGMENT = `varying vWorld: vec3f;
varying vNormal: vec3f;
varying vTint: vec4f;
uniform sunDir: vec3f;
uniform cameraPosition: vec3f;
uniform heightRange: vec2f;
uniform showZones: f32;
uniform boundaryColor: vec4f;
uniform fillColor: vec3f;
uniform cutColor: vec3f;

fn hash21(p: vec2f) -> f32 {
    var q: vec2f = fract(p * vec2f(123.34, 456.21));
    q = q + dot(q, q + 45.32);
    return fract(q.x * q.y);
}
fn noise21(p: vec2f) -> f32 {
    let i: vec2f = floor(p);
    let f: vec2f = fract(p);
    let u: vec2f = f * f * (3.0 - 2.0 * f);
    let a: f32 = hash21(i);
    let b: f32 = hash21(i + vec2f(1.0, 0.0));
    let c: f32 = hash21(i + vec2f(0.0, 1.0));
    let d: f32 = hash21(i + vec2f(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

@fragment
fn main(input : FragmentInputs)->FragmentOutputs {
    let n: vec3f = normalize(input.vNormal);
    let sun: vec3f = normalize(uniforms.sunDir);
    let viewDir: vec3f = normalize(uniforms.cameraPosition - input.vWorld);

    let hn: f32 = clamp((input.vWorld.y - uniforms.heightRange.x) / max(uniforms.heightRange.y - uniforms.heightRange.x, 0.001), 0.0, 1.0);
    let slope: f32 = 1.0 - clamp(n.y, 0.0, 1.0);

    let lowland: vec3f = vec3f(0.352, 0.416, 0.318);
    let midland: vec3f = vec3f(0.452, 0.447, 0.341);
    let highland: vec3f = vec3f(0.494, 0.469, 0.424);
    let rock: vec3f = vec3f(0.451, 0.439, 0.424);
    var base: vec3f = mix(lowland, midland, smoothstep(0.12, 0.5, hn));
    base = mix(base, highland, smoothstep(0.5, 0.9, hn));
    base = mix(base, rock, smoothstep(0.2, 0.6, slope));

    let grain: f32 = noise21(input.vWorld.xz * 0.22) * 0.55 + noise21(input.vWorld.xz * 1.1) * 0.25;
    base = base * (0.9 + 0.22 * grain);

    // 20 m 工程网格
    let gc: vec2f = input.vWorld.xz / 20.0;
    let gd: vec2f = abs(fract(gc - 0.5) - 0.5) / max(fwidth(gc), vec2f(1e-5));
    let gridLine: f32 = 1.0 - clamp(min(gd.x, gd.y), 0.0, 1.0);
    base = mix(base, base * 1.22 + vec3f(0.02), gridLine * 0.3);

    // 顶点色：r = 填方覆盖，g = 挖方覆盖，b = 边界，a = 遮罩
    let t: vec4f = input.vTint;
    let showz: f32 = uniforms.showZones * t.a;
    base = mix(base, mix(base, uniforms.fillColor, 0.84), clamp(t.r, 0.0, 1.0) * showz);
    base = mix(base, mix(base, uniforms.cutColor, 0.84), clamp(t.g, 0.0, 1.0) * showz);
    let ndl: f32 = max(dot(n, sun), 0.0);
    let sky: f32 = 0.5 + 0.5 * n.y;
    let lit: f32 = 0.32 + 0.68 * (0.36 * sky + 0.80 * ndl);
    let halfV: vec3f = normalize(sun + viewDir);
    let spec: f32 = pow(max(dot(n, halfV), 0.0), 24.0) * 0.045;
    var c: vec3f = base * lit + spec;

    // 挖填分界线由独立的贴地描边带绘制，这里不再用顶点色画线，
    // 避免在地形网格上出现锯齿。


    let dist: f32 = length(uniforms.cameraPosition - input.vWorld);
    let fog: f32 = clamp((dist - 620.0) / 1700.0, 0.0, 0.7);
    c = mix(c, vec3f(0.106, 0.129, 0.165), fog);

    fragmentOutputs.color = vec4f(c, 1.0);
}`;

export const TERRAIN_VERTEX_WGSL = VERTEX;
export const TERRAIN_FRAGMENT_WGSL = FRAGMENT;
