import type {
  ColorScheme,
  ExportEnvelope,
  LeakPoint,
  NetworkData,
} from '../types';
import { DEFAULT_SCHEME } from './scheme';

const KEY_NETWORK = 'hnet.network.v1';
const KEY_SCHEME = 'hnet.scheme.v1';
const KEY_LEAKS = 'hnet.leaks.v1';
const KEY_UI = 'hnet.ui.v1';

export interface UIPrefs {
  side: 'supply' | 'return';
  colorMode: 'pressure' | 'temperature';
  showLabels: boolean;
}

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('本地存储失败', e);
  }
}

export const storage = {
  loadNetwork(): NetworkData | null {
    return safeGet<NetworkData>(KEY_NETWORK);
  },
  saveNetwork(n: NetworkData) {
    safeSet(KEY_NETWORK, n);
  },
  loadScheme(): ColorScheme {
    return safeGet<ColorScheme>(KEY_SCHEME) ?? DEFAULT_SCHEME;
  },
  saveScheme(s: ColorScheme) {
    safeSet(KEY_SCHEME, s);
  },
  loadLeaks(): LeakPoint[] {
    return safeGet<LeakPoint[]>(KEY_LEAKS) ?? [];
  },
  saveLeaks(l: LeakPoint[]) {
    safeSet(KEY_LEAKS, l);
  },
  loadUI(): UIPrefs | null {
    return safeGet<UIPrefs>(KEY_UI);
  },
  saveUI(p: UIPrefs) {
    safeSet(KEY_UI, p);
  },
};

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildExportEnvelope(
  kind: ExportEnvelope['kind'],
  payload: Partial<Pick<ExportEnvelope, 'network' | 'scheme' | 'leaks'>>,
): ExportEnvelope {
  return {
    kind,
    exportedAt: new Date().toISOString(),
    ...payload,
  };
}
