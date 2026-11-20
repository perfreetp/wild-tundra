import { useAppStore } from '../store/appStore';
import { Section, Slider, Toggle } from './controls';
import { engineBridge } from './Viewport';

/** 材质：隧道内壁与列车车体分别设置颜色与表面参数 */
export function MaterialPanel() {
  const materials = useAppStore((s) => s.materials);
  const patchMaterials = useAppStore((s) => s.patchMaterials);

  return (
    <Section title="材质">
      <div className="material-group">
        <h4>隧道内壁</h4>
        <label className="color-row">
          <span>颜色</span>
          <input
            type="color"
            value={materials.tunnelColor}
            onChange={(e) => patchMaterials({ tunnelColor: e.target.value })}
          />
          <code>{materials.tunnelColor}</code>
        </label>
        <Slider
          label="粗糙度"
          value={materials.tunnelRoughness}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => patchMaterials({ tunnelRoughness: v })}
        />
      </div>

      <div className="material-group">
        <h4>列车车体</h4>
        <label className="color-row">
          <span>颜色</span>
          <input
            type="color"
            value={materials.trainColor}
            onChange={(e) => patchMaterials({ trainColor: e.target.value })}
          />
          <code>{materials.trainColor}</code>
        </label>
        <Slider
          label="粗糙度"
          value={materials.trainRoughness}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => patchMaterials({ trainRoughness: v })}
        />
        <Slider
          label="金属度"
          value={materials.trainMetalness}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => patchMaterials({ trainMetalness: v })}
        />
      </div>
    </Section>
  );
}

/** 行驶控制：自动行驶、速度、里程 */
export function DrivePanel() {
  const autoDrive = useAppStore((s) => s.autoDrive);
  const setAutoDrive = useAppStore((s) => s.setAutoDrive);
  const driveSpeed = useAppStore((s) => s.driveSpeed);
  const setDriveSpeed = useAppStore((s) => s.setDriveSpeed);
  const routeProgress = useAppStore((s) => s.routeProgress);
  const setRouteProgress = useAppStore((s) => s.setRouteProgress);
  const routeLength = useAppStore((s) => s.routeLength);

  return (
    <Section title="行驶控制">
      <Toggle label="自动行驶" checked={autoDrive} onChange={setAutoDrive} />
      <Slider
        label="行驶速度"
        value={driveSpeed}
        min={0}
        max={60}
        step={1}
        unit=" m/s"
        onChange={setDriveSpeed}
      />
      <Slider
        label="线路里程"
        value={Math.min(routeProgress, routeLength || routeProgress)}
        min={0}
        max={routeLength || 1}
        step={1}
        unit=" m"
        disabled={autoDrive}
        onChange={setRouteProgress}
      />
      <p className="hint">
        自动行驶时列车与自动机位沿轨道中心线同步推进；关闭后可手动拖动里程定位。
      </p>
      <button
        className="btn block"
        onClick={() => engineBridge.engineRef.current?.setRouteProgress(0)}
      >
        回到线路起点
      </button>
    </Section>
  );
}
