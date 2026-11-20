// 用 Babylon 真实的 WGSL 处理管线离线展开自定义着色器,验证生成的最终 WGSL
import { readFileSync } from "node:fs";
import { ShaderLanguage } from "@babylonjs/core";
import { Initialize, Process, Finalize } from "@babylonjs/core/Engines/Processors/shaderProcessor";
import { WebGPUShaderProcessorWGSL } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { WebGPUShaderProcessingContext } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessingContext";

// 从 clip.ts 源码中提取 WGSL_SHADERS 块
const src = readFileSync(new URL("../src/lib/clip.ts", import.meta.url), "utf8");
const wgslBlock = src.match(/const WGSL_SHADERS[^=]*= \{([\s\S]*?)\n\};/);
if (!wgslBlock) {
  console.error("WGSL_SHADERS block not found");
  process.exit(1);
}
const shaders: Record<string, string> = {};
const re = /(\w+):\s*`([\s\S]*?)`/g;
let m: RegExpExecArray | null;
while ((m = re.exec(wgslBlock[1])) !== null) shaders[m[1]] = m[2];

const pairs: Record<string, [string, string]> = {
  ghost: ["ghostVertexShader", "ghostFragmentShader"],
  grid: ["gridVertexShader", "gridFragmentShader"],
  unlit: ["unlitVertexShader", "unlitFragmentShader"],
};

let failed = 0;
for (const [pairName, [vName, fName]] of Object.entries(pairs)) {
  const processor = new WebGPUShaderProcessorWGSL();
  const context = new WebGPUShaderProcessingContext(ShaderLanguage.WGSL);
  const baseOptions = {
    defines: [] as string[],
    indexParameters: undefined,
    shouldUseHighPrecisionShader: false,
    supportsUniformBuffers: true,
    shadersRepository: "",
    includesShadersStore: {} as Record<string, string>,
    processor,
    version: "100",
    platformName: "WEBGPU",
    processingContext: context,
    isNDCHalfZRange: false,
    useReverseDepthBuffer: false,
  };
  try {
    let vertexCode = "";
    let fragmentCode = "";
    // Initialize 会重置处理器收集的 attribute/varying,整个 effect 只能调一次
    Initialize({ ...baseOptions, isFragment: false } as never);
    const vOptions = { ...baseOptions, isFragment: false };
    Process(shaders[vName], vOptions as never, (code) => (vertexCode = code));
    const fOptions = { ...baseOptions, isFragment: true };
    Process(shaders[fName], fOptions as never, (code) => (fragmentCode = code));
    const final = Finalize(vertexCode, fragmentCode, fOptions as never);

    const checks: Array<[string, string]> = [
      [final.vertexCode, "struct VertexInputs"],
      [final.vertexCode, "var<private> vertexInputs"],
      [final.vertexCode, "@vertex"],
      [final.fragmentCode, "struct FragmentInputs"],
      [final.fragmentCode, "var<private> fragmentInputs"],
      [final.fragmentCode, "@fragment"],
      [final.fragmentCode, "uniforms."],
    ];
    for (const [code, needle] of checks) {
      if (!code.includes(needle)) {
        console.error(`FAIL ${pairName}: final WGSL missing '${needle}'`);
        failed++;
      }
    }
    console.log(`OK   ${pairName}: vertex ${final.vertexCode.length} chars, fragment ${final.fragmentCode.length} chars`);
    if (process.env.VERBOSE) {
      console.log("----- vertex -----\n" + final.vertexCode);
      console.log("----- fragment -----\n" + final.fragmentCode);
    }
  } catch (e) {
    console.error(`FAIL ${pairName}:`, e instanceof Error ? e.message : e);
    failed++;
  }
}
console.log(failed ? `\n${failed} check(s) FAILED` : "\nALL WGSL SHADERS PROCESSED OK");
process.exit(failed ? 1 : 0);
