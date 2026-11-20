import type {
  ColorScheme,
  ExportEnvelope,
  LeakPoint,
  NetworkData,
  NetworkNode,
  Pipe,
} from '../types';
import { BAND_COUNT, DEFAULT_SCHEME } from './scheme';

export class ImportError extends Error {}

/** 宽松校验导入的管网数据 */
export function validateNetwork(raw: unknown): NetworkData {
  if (typeof raw !== 'object' || raw === null) {
    throw new ImportError('文件内容不是 JSON 对象');
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !obj.nodes.length) {
    throw new ImportError('缺少 nodes 节点数组');
  }
  if (!Array.isArray(obj.supplyPipes) || !Array.isArray(obj.returnPipes)) {
    throw new ImportError('缺少 supplyPipes / returnPipes 管段数组');
  }
  const nodeIds = new Set<string>();
  const nodes: NetworkNode[] = obj.nodes.map((nRaw, i) => {
    const n = nRaw as Record<string, unknown>;
    if (typeof n.id !== 'string' || typeof n.name !== 'string') {
      throw new ImportError(`第 ${i + 1} 个节点缺少 id/name`);
    }
    if (nodeIds.has(n.id)) throw new ImportError(`节点 id 重复: ${n.id}`);
    nodeIds.add(n.id);
    return {
      id: n.id,
      name: n.name,
      type: (['source', 'junction', 'building'].includes(n.type as string)
        ? n.type
        : 'junction') as NetworkNode['type'],
      x: Number(n.x) || 0,
      y: Number(n.y) || 0,
      z: Number(n.z) || 0,
      diameter: Number(n.diameter) || 100,
      demand: Number(n.demand) || 0,
    };
  });

  const pipeIds = new Set<string>();
  const mapPipes = (arr: unknown[], tag: string): Pipe[] =>
    arr.map((pRaw, i) => {
      const p = pRaw as Record<string, unknown>;
      if (typeof p.id !== 'string') {
        throw new ImportError(`${tag} 第 ${i + 1} 根管段缺少 id`);
      }
      if (pipeIds.has(p.id)) throw new ImportError(`管段 id 重复: ${p.id}`);
      pipeIds.add(p.id);
      if (typeof p.from !== 'string' || typeof p.to !== 'string') {
        throw new ImportError(`管段 ${p.id} 缺少 from/to`);
      }
      if (!nodeIds.has(p.from) || !nodeIds.has(p.to)) {
        throw new ImportError(`管段 ${p.id} 的端点不存在于 nodes 中`);
      }
      const polyline = Array.isArray(p.polyline)
        ? (p.polyline as unknown[]).map((t) => {
            const v = t as unknown[];
            return [
              Number(v[0]) || 0,
              Number(v[1]) || 0,
              Number(v[2]) || 0,
            ] as [number, number, number];
          })
        : undefined;
      return {
        id: p.id,
        name: typeof p.name === 'string' ? p.name : p.id,
        from: p.from,
        to: p.to,
        diameter: Number(p.diameter) || 100,
        polyline,
      };
    });

  const supplyPipes = mapPipes(obj.supplyPipes as unknown[], '供水管');
  const returnPipes = mapPipes(obj.returnPipes as unknown[], '回水管');

  if (!nodes.some((n) => n.type === 'source')) {
    throw new ImportError('管网中必须包含一个 source 热源节点');
  }

  return {
    version: Number(obj.version) || 1,
    name: typeof obj.name === 'string' ? obj.name : '导入管网',
    nodes,
    supplyPipes,
    returnPipes,
  };
}

export function validateScheme(raw: unknown): ColorScheme {
  if (typeof raw !== 'object' || raw === null) {
    throw new ImportError('色带文件内容无效');
  }
  const obj = raw as Record<string, unknown>;
  const fallback = DEFAULT_SCHEME;
  const readBands = (v: unknown) => {
    if (!Array.isArray(v)) return fallback.pressureBands;
    return v.slice(0, BAND_COUNT).map((b) => {
      const r = b as Record<string, unknown>;
      return { min: Number(r.min) || 0, color: String(r.color ?? '#888888') };
    });
  };
  return {
    id: typeof obj.id === 'string' ? obj.id : `scheme-${Date.now()}`,
    name: typeof obj.name === 'string' ? obj.name : '导入色带',
    pressureBands: readBands(obj.pressureBands),
    temperatureBands: readBands(obj.temperatureBands),
    lossThreshold: Number(obj.lossThreshold) || fallback.lossThreshold,
  };
}

/** 兼容完整导出包与单实体文件 */
export function parseImportFile(text: string): {
  network?: NetworkData;
  scheme?: ColorScheme;
  leaks?: LeakPoint[];
} {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('JSON 解析失败');
  }
  const env = raw as ExportEnvelope;
  if (env && typeof env === 'object' && 'kind' in env) {
    return {
      network: env.network ? validateNetwork(env.network) : undefined,
      scheme: env.scheme ? validateScheme(env.scheme) : undefined,
      leaks: Array.isArray(env.leaks) ? (env.leaks as LeakPoint[]) : undefined,
    };
  }
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.supplyPipes)) {
    return { network: validateNetwork(raw) };
  }
  if (Array.isArray(obj.pressureBands)) {
    return { scheme: validateScheme(raw) };
  }
  throw new ImportError('未识别的文件结构（需要管网或色带 JSON）');
}
