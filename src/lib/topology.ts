import type { LeakPoint, NetworkData } from '../types';

/**
 * 受影响楼栋判定：在泄漏同侧的管网图上，泄漏管段“切开”后，
 * 无法绕过该管段到达热源的全部 building 节点。
 * 供/回水是两套独立拓扑，不能混图（否则楼栋会经另一套管网绕回热源）。
 */
export function computeAffectedBuildings(
  network: NetworkData,
  leaks: LeakPoint[],
): Set<string> {
  const out = new Set<string>();
  if (!leaks.length) return out;

  const source = network.nodes.find((n) => n.type === 'source');
  if (!source) return out;

  for (const side of ['supply', 'return'] as const) {
    const sidePipes =
      side === 'supply' ? network.supplyPipes : network.returnPipes;
    const sideLeaks = leaks.filter((l) => l.side === side);
    if (!sideLeaks.length) continue;
    const leakPipeIds = new Set(sideLeaks.map((l) => l.pipeId));

    const adj = new Map<string, string[]>();
    network.nodes.forEach((n) => adj.set(n.id, []));
    for (const p of sidePipes) {
      if (leakPipeIds.has(p.id)) continue; // 泄漏管段切断
      adj.get(p.from)?.push(p.to);
      adj.get(p.to)?.push(p.from);
    }

    // 从热源 BFS，所有可达节点之外的楼栋即受影响
    const reachable = new Set<string>([source.id]);
    const queue = [source.id];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nxt of adj.get(cur) ?? []) {
        if (!reachable.has(nxt)) {
          reachable.add(nxt);
          queue.push(nxt);
        }
      }
    }
    for (const n of network.nodes) {
      if (n.type === 'building' && !reachable.has(n.id)) out.add(n.id);
    }
  }
  return out;
}

/** 拓扑校验：每个节点从热源可达、无悬空管段 */
export function validateTopology(network: NetworkData): string[] {
  const warnings: string[] = [];
  const ids = new Set(network.nodes.map((n) => n.id));
  for (const p of [...network.supplyPipes, ...network.returnPipes]) {
    if (!ids.has(p.from) || !ids.has(p.to)) {
      warnings.push(`管段 ${p.id} 端点缺失`);
    }
  }
  const source = network.nodes.find((n) => n.type === 'source');
  if (!source) {
    warnings.push('缺少热源节点');
    return warnings;
  }
  const adj = new Map<string, string[]>();
  network.nodes.forEach((n) => adj.set(n.id, []));
  for (const p of network.supplyPipes) {
    adj.get(p.from)?.push(p.to);
    adj.get(p.to)?.push(p.from);
  }
  const seen = new Set<string>([source.id]);
  const queue = [source.id];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nxt of adj.get(cur) ?? []) {
      if (!seen.has(nxt)) {
        seen.add(nxt);
        queue.push(nxt);
      }
    }
  }
  for (const n of network.nodes) {
    if (!seen.has(n.id)) warnings.push(`节点 ${n.id} 从热源不可达`);
  }
  return warnings;
}
