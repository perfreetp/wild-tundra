import { useRef, useState } from 'react';
import { useSimStore } from '../store';
import { Section } from './Controls';

export function PresetPanel() {
  const presets = useSimStore((s) => s.presets);
  const params = useSimStore((s) => s.params);
  const saveCurrentAsPreset = useSimStore((s) => s.saveCurrentAsPreset);
  const applyPreset = useSimStore((s) => s.applyPreset);
  const deletePreset = useSimStore((s) => s.deletePreset);
  const exportPresetFile = useSimStore((s) => s.exportPresetFile);
  const importPresetFile = useSimStore((s) => s.importPresetFile);
  const resetParams = useSimStore((s) => s.resetParams);

  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2600);
  };

  const onImport = async (file: File) => {
    try {
      const imported = await importPresetFile(file);
      flash(`已导入并应用：${imported}`);
    } catch (err) {
      flash(`导入失败：${(err as Error).message}`);
    }
  };

  return (
    <div className="panel-body">
      <Section title="保存到浏览器">
        <div className="save-row">
          <input
            type="text"
            placeholder="配置名称，如：隧道广角-夜间"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="btn primary"
            onClick={() => {
              saveCurrentAsPreset(name);
              setName('');
              flash('配置已保存到浏览器 localStorage');
            }}
          >
            保存
          </button>
        </div>
        <p className="hint">
          配置持久化在浏览器本地，刷新页面不丢失；可导出 JSON 文件分享给同事。
        </p>
        {presets.length === 0 && <p className="hint empty">暂无已保存配置</p>}
        <ul className="preset-list">
          {presets.map((p) => (
            <li key={p.id} className="preset-item">
              <div className="preset-info">
                <span className="preset-name">{p.name}</span>
                <span className="preset-meta">
                  FOV {p.params.fov}° · EV {p.params.exposureStops >= 0 ? '+' : ''}
                  {p.params.exposureStops} ·{' '}
                  {p.params.distortionMode === 'off'
                    ? '无畸变'
                    : p.params.distortionMode === 'barrel'
                      ? '桶形'
                      : '枕形'}
                </span>
              </div>
              <div className="preset-actions">
                <button
                  className="mini"
                  title="应用"
                  onClick={() => {
                    applyPreset(p);
                    flash(`已应用：${p.name}`);
                  }}
                >
                  应用
                </button>
                <button
                  className="mini"
                  title="导出 JSON"
                  onClick={() => exportPresetFile(p.id)}
                >
                  导出
                </button>
                <button
                  className="mini danger"
                  title="删除"
                  onClick={() => deletePreset(p.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="文件与分享">
        <div className="btn-col">
          <button
            className="btn"
            onClick={() => exportPresetFile(null)}
          >
            导出当前参数 JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            导入参数文件
          </button>
          <button className="btn ghost" onClick={resetParams}>
            恢复默认参数
          </button>
        </div>
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
        <p className="hint">
          当前参数指纹：FOV {params.fov}° /{' '}
          {params.distortionMode === 'off'
            ? '无畸变'
            : `${params.distortionMode === 'barrel' ? '桶形' : '枕形'} ${Math.round(
                params.distortionAmount * 100,
              )}%`}{' '}
          / DR {params.dynamicRange}档 / 卷帘{' '}
          {Math.round(params.rollingShutterTilt * 100)}%
        </p>
        {message && <div className="toast-inline">{message}</div>}
      </Section>
    </div>
  );
}
