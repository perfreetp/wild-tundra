import { useRef } from 'react';
import { useStore } from '../store';
import { parseImportFile, ImportError } from '../lib/io';
import {
  buildExportEnvelope,
  downloadJSON,
} from '../lib/storage';

export default function Toolbar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const network = useStore((s) => s.network);
  const scheme = useStore((s) => s.scheme);
  const leaks = useStore((s) => s.leaks);
  const side = useStore((s) => s.side);
  const colorMode = useStore((s) => s.colorMode);
  const showLabels = useStore((s) => s.showLabels);
  const setSide = useStore((s) => s.setSide);
  const setColorMode = useStore((s) => s.setColorMode);
  const toggleLabels = useStore((s) => s.toggleLabels);
  const setNetwork = useStore((s) => s.setNetwork);
  const setScheme = useStore((s) => s.setScheme);
  const showToast = useStore((s) => s.showToast);
  const resetAll = useStore((s) => s.resetAll);

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseImportFile(text);
      if (parsed.network) setNetwork(parsed.network);
      if (parsed.scheme) setScheme(parsed.scheme);
      const parts: string[] = [];
      if (parsed.network) parts.push('管网');
      if (parsed.scheme) parts.push('色带');
      if (parsed.leaks) parts.push('泄漏点');
      showToast(`导入成功：${parts.join('、')}`);
    } catch (e) {
      const msg = e instanceof ImportError ? e.message : '导入失败';
      showToast(`导入失败：${msg}`);
    }
  };

  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand-mark">热力</span>
        热网水力工况三维着色系统
        <span className="network-name">{network.name}</span>
      </div>

      <div className="tool-group">
        <div className="seg">
          <button
            className={side === 'supply' ? 'active' : ''}
            onClick={() => setSide('supply')}
          >
            供水视图
          </button>
          <button
            className={side === 'return' ? 'active' : ''}
            onClick={() => setSide('return')}
          >
            回水视图
          </button>
        </div>
        <div className="seg">
          <button
            className={colorMode === 'pressure' ? 'active' : ''}
            onClick={() => setColorMode('pressure')}
          >
            压力着色
          </button>
          <button
            className={colorMode === 'temperature' ? 'active' : ''}
            onClick={() => setColorMode('temperature')}
          >
            温度着色
          </button>
        </div>
        <button className={`btn ${showLabels ? 'on' : ''}`} onClick={toggleLabels}>
          标签
        </button>
      </div>

      <div className="tool-group">
        <button className="btn" onClick={() => fileRef.current?.click()}>
          导入 JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
        <div className="dropdown">
          <button className="btn primary">导出 ▾</button>
          <div className="dropdown-menu">
            <button
              onClick={() =>
                downloadJSON(
                  `${network.name}-管网.json`,
                  buildExportEnvelope('network', { network }),
                )
              }
            >
              管网数据（含供/回水拓扑）
            </button>
            <button
              onClick={() =>
                downloadJSON(
                  '着色方案.json',
                  buildExportEnvelope('scheme', { scheme }),
                )
              }
            >
              着色方案（8 级色带 + 阈值）
            </button>
            <button
              onClick={() =>
                downloadJSON(
                  '热网完整工程包.json',
                  buildExportEnvelope('full', { network, scheme, leaks }),
                )
              }
            >
              完整工程包（管网+色带+泄漏）
            </button>
          </div>
        </div>
        <button className="btn ghost" onClick={resetAll}>
          重置示例
        </button>
      </div>
    </header>
  );
}
