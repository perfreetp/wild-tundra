/**
 * 材质预设：四类典型工况 + 用户自己保存的材质。
 * 内置预设在每次启动时合并进来，不写入 localStorage。
 */
import { defaultParams } from "../core/nodeDefs";
import type { GraphNode, MaterialGraph, NodeKind, ParamValue } from "../core/types";

export interface MaterialPreset {
  id: string;
  name: string;
  description: string;
  graph: MaterialGraph;
  /** 预览面板的初始粗糙度缩放，用来贴近工艺状态。 */
  previewRoughness: number;
  builtIn?: boolean;
}

function node(
  id: string,
  kind: NodeKind,
  x: number,
  y: number,
  params: Record<string, ParamValue> = {},
): GraphNode {
  return { id, kind, x, y, params: { ...defaultParams(kind), ...params } };
}

export function builtInPresets(): MaterialPreset[] {
  return [
    {
      id: "hotdip-galvanized",
      name: "热镀锌（新镀层）",
      description: "连续锌层，结晶花纹细密，金属度高、反射干净，边缘菲涅尔轻微提亮。",
      previewRoughness: 0.55,
      builtIn: true,
      graph: {
        nodes: [
          node("n1", "constant", 40, 400, { value: 0.92, color: "#c3ccd2" }),
          node("n2", "noise", 40, 60, {
            type: "cells",
            scale: 22,
            octaves: "2",
            contrast: 0.22,
            threshold: 0.5,
            edge: 0.06,
            baseColor: "#c8d1d6",
            tint: "#9aa7ad",
          }),
          node("n3", "constant", 380, 420, { value: 0.28 }),
          node("n4", "fresnel", 380, 120, { scale: 0.6, power: 2.4 }),
          node("n5", "normalNoise", 60, 700, { scale: 26, strength: 0.014, octaves: "1" }),
          node("n6", "output", 760, 300),
        ],
        edges: [
          { id: "e1", fromNode: "n2", fromPort: "color", toNode: "n6", toPort: "baseColor" },
          { id: "e2", fromNode: "n1", fromPort: "scalar", toNode: "n6", toPort: "metallic" },
          { id: "e3", fromNode: "n3", fromPort: "scalar", toNode: "n6", toPort: "roughness" },
          { id: "e4", fromNode: "n5", fromPort: "normal", toNode: "n6", toPort: "normal" },
          { id: "e5", fromNode: "n4", fromPort: "value", toNode: "n6", toPort: "specular" },
        ],
      },
    },
    {
      id: "zinc-damaged",
      name: "锌层破损（露基材）",
      description: "镀层局部剥落露出钢基体，破损边缘菲涅尔增强，用噪波遮罩做过渡。",
      previewRoughness: 0.85,
      builtIn: true,
      graph: {
        nodes: [
          node("n1", "noise", 40, 60, {
            type: "ridged",
            scale: 6.5,
            octaves: "4",
            contrast: 0.55,
            threshold: 0.62,
            edge: 0.12,
            baseColor: "#c0c9cf",
            tint: "#6b6257",
          }),
          node("n2", "constant", 40, 440, { value: 0.55 }),
          node("n3", "fresnel", 380, 140, { scale: 1.05, power: 2.0 }),
          node("n4", "gradient", 380, 430, {
            mode: "y",
            start: -0.4,
            end: 0.7,
            smooth: 0.6,
            colorA: "#5d5852",
            colorB: "#a8b0b5",
          }),
          node("n5", "normalNoise", 60, 700, { scale: 16, strength: 0.09, octaves: "3" }),
          node("n6", "output", 780, 300),
        ],
        edges: [
          { id: "e1", fromNode: "n1", fromPort: "color", toNode: "n6", toPort: "baseColor" },
          { id: "e2", fromNode: "n2", fromPort: "scalar", toNode: "n6", toPort: "metallic" },
          { id: "e3", fromNode: "n4", fromPort: "value", toNode: "n6", toPort: "roughness" },
          { id: "e4", fromNode: "n5", fromPort: "normal", toNode: "n6", toPort: "normal" },
          { id: "e5", fromNode: "n3", fromPort: "value", toNode: "n6", toPort: "specular" },
        ],
      },
    },
    {
      id: "polluted-dust",
      name: "污秽积灰（工业粉尘）",
      description: "表面积灰压低金属感、抬高粗糙度，低频团块噪波，菲涅尔被削弱。",
      previewRoughness: 1.05,
      builtIn: true,
      graph: {
        nodes: [
          node("n1", "noise", 40, 60, {
            type: "fbm",
            scale: 3.4,
            octaves: "5",
            contrast: 0.45,
            threshold: 0.45,
            edge: 0.2,
            baseColor: "#8e8b84",
            tint: "#5f5a50",
          }),
          node("n2", "gradient", 40, 470, {
            mode: "y",
            start: -0.8,
            end: 0.5,
            smooth: 0.8,
            colorA: "#4f4b45",
            colorB: "#8d8a82",
          }),
          node("n3", "constant", 380, 440, { value: 0.22 }),
          node("n4", "fresnel", 380, 700, { scale: 0.3, power: 4.0 }),
          node("n5", "normalNoise", 40, 800, { scale: 30, strength: 0.05, octaves: "4" }),
          node("n6", "output", 780, 320),
        ],
        edges: [
          { id: "e1", fromNode: "n1", fromPort: "color", toNode: "n6", toPort: "baseColor" },
          { id: "e2", fromNode: "n3", fromPort: "scalar", toNode: "n6", toPort: "metallic" },
          { id: "e3", fromNode: "n2", fromPort: "value", toNode: "n6", toPort: "roughness" },
          { id: "e4", fromNode: "n5", fromPort: "normal", toNode: "n6", toPort: "normal" },
          { id: "e5", fromNode: "n4", fromPort: "value", toNode: "n6", toPort: "specular" },
        ],
      },
    },
    {
      id: "corroded",
      name: "锈蚀（红锈层）",
      description: "锈层疏松多孔，深色斑块与红褐混合，法线扰动强，高光发散。",
      previewRoughness: 1.25,
      builtIn: true,
      graph: {
        nodes: [
          node("n1", "noise", 40, 60, {
            type: "ridged",
            scale: 5.2,
            octaves: "5",
            contrast: 0.6,
            threshold: 0.42,
            edge: 0.16,
            baseColor: "#7c3f24",
            tint: "#3a2216",
          }),
          node("n2", "gradient", 400, 570, {
            mode: "y",
            start: -0.6,
            end: 0.8,
            smooth: 0.7,
            colorA: "#3c2a20",
            colorB: "#8f5a36",
          }),
          node("n3", "constant", 400, 420, { value: 0.08 }),
          node("n4", "normalNoise", 40, 760, { scale: 20, strength: 0.32, octaves: "4" }),
          node("n5", "fresnel", 400, 120, { scale: 0.5, power: 2.8 }),
          node("n6", "output", 800, 320),
        ],
        edges: [
          { id: "e1", fromNode: "n1", fromPort: "color", toNode: "n6", toPort: "baseColor" },
          { id: "e2", fromNode: "n3", fromPort: "scalar", toNode: "n6", toPort: "metallic" },
          { id: "e3", fromNode: "n2", fromPort: "value", toNode: "n6", toPort: "roughness" },
          { id: "e4", fromNode: "n4", fromPort: "normal", toNode: "n6", toPort: "normal" },
          { id: "e5", fromNode: "n5", fromPort: "value", toNode: "n6", toPort: "specular" },
        ],
      },
    },
  ];
}

export function blankPreset(): MaterialPreset {
  return {
    id: "blank",
    name: "空白材质",
    description: "只有一个材质输出节点，从零开始搭。",
    previewRoughness: 1,
    builtIn: true,
    graph: {
      nodes: [node("n1", "output", 420, 260)],
      edges: [],
    },
  };
}
