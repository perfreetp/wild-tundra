import { useAppStore } from '../store/appStore';
import { ViewPanel } from './ViewPanel';
import { WeatherPanel, LightPanel } from './WeatherLightPanels';
import { MaterialPanel, DrivePanel } from './MaterialDrivePanels';
import { exportConfigFile, importConfigFile } from '../services/persistence';
import { useRef } from 'react';

/** 场景配置面板：视点 / 灯光 / 天气 / 材质 / 行驶 / 持久化 */
export function ConfigPanel() {
  const panelOpen = useAppStore((s) => s.panelOpen);
  const saveLocal = useAppStore((s) => s.saveLocal);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const pushToast = useAppStore((s) => s.pushToast);
  const configInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    try {
      const config = await importConfigFile(file);
      useAppStore.getState().applyConfig(config);
      pushToast('配置导入成功，视点与天气已还原', 'success');
    } catch (err) {
      pushToast(`配置导入失败：${(err as Error).message}`, 'error');
    } finally {
      if (configInputRef.current) configInputRef.current.value = '';
    }
  };

  return (
    <aside className={`config-panel ${panelOpen ? 'open' : 'closed'}`}>
      <div className="panel-scroll">
        <ViewPanel />
        <LightPanel />
        <WeatherPanel />
        <MaterialPanel />
        <DrivePanel />

        <section className="panel-section">
          <h3 className="section-title">场景配置</h3>
          <p className="hint">
            保存内容：三个视点的位置/朝向/FOV/近远裁面、灯光档位、雨雾天气、材质与行驶状态。
          </p>
          <div className="config-actions">
            <button className="btn block primary" onClick={saveLocal}>
              保存到浏览器本地
            </button>
            <button
              className="btn block"
              onClick={() => exportConfigFile(buildConfig())}
            >
              导出 JSON 文件
            </button>
            <button
              className="btn block"
              onClick={() => configInputRef.current?.click()}
            >
              导入 JSON 还原
            </button>
          </div>
          <input
            ref={configInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && void handleImport(e.target.files[0])}
          />
        </section>
      </div>
    </aside>
  );
}
