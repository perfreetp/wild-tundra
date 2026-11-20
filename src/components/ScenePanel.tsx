import { useSimStore, nextId } from '../store';
import { Section, Slider } from './Controls';
import { getEngine } from './Viewer';
import type { SceneObject } from '../types';

const VEHICLE_COLORS = [0xc0392b, 0x2c6fbb, 0xf2f2f2, 0x222222, 0xd8a027];

export function ScenePanel() {
  const objects = useSimStore((s) => s.objects);
  const selectedId = useSimStore((s) => s.selectedId);
  const select = useSimStore((s) => s.select);
  const addObject = useSimStore((s) => s.addObject);
  const updateObject = useSimStore((s) => s.updateObject);
  const removeObject = useSimStore((s) => s.removeObject);
  const cruising = useSimStore((s) => s.cruising);
  const setCruising = useSimStore((s) => s.setCruising);
  const cruiseSpeed = useSimStore((s) => s.cruiseSpeed);
  const setCruiseSpeed = useSimStore((s) => s.setCruiseSpeed);

  const selected = objects.find((o) => o.id === selectedId) ?? null;

  const addVehicle = () => {
    const obj: SceneObject = {
      id: nextId('veh'),
      type: 'vehicle',
      name: `车辆 ${objects.filter((o) => o.type === 'vehicle').length + 1}`,
      position: [(Math.random() - 0.5) * 5, 0, -30 - Math.random() * 60],
      rotationY: 0,
      color: VEHICLE_COLORS[objects.length % VEHICLE_COLORS.length],
    };
    addObject(obj);
  };

  const addLane = () => {
    const obj: SceneObject = {
      id: nextId('lane'),
      type: 'lane',
      name: `车道线 ${objects.filter((o) => o.type === 'lane').length + 1}`,
      position: [1.75, 0.02, -60],
      rotationY: 0,
      length: 100,
      width: 0.15,
    };
    addObject(obj);
  };

  return (
    <div className="panel-body">
      <Section title="巡航（隧道明暗过渡）">
        <label className="ctrl toggle-row">
          <span className="ctrl-label">相机自动巡航</span>
          <input
            type="checkbox"
            checked={cruising}
            onChange={(e) => setCruising(e.target.checked)}
          />
        </label>
        <Slider
          label="巡航速度"
          value={cruiseSpeed}
          min={2}
          max={30}
          step={1}
          unit="m/s"
          onChange={setCruiseSpeed}
        />
      </Section>

      <Section title="场景对象">
        <div className="chip-row">
          <button className="chip primary" onClick={addVehicle}>
            + 虚拟车辆
          </button>
          <button className="chip primary" onClick={addLane}>
            + 车道线
          </button>
        </div>
        <ul className="obj-list">
          {objects.map((o) => (
            <li
              key={o.id}
              className={o.id === selectedId ? 'obj-item active' : 'obj-item'}
              onClick={() => select(o.id)}
            >
              <span className="obj-icon">{o.type === 'vehicle' ? '🚗' : '▭'}</span>
              <span className="obj-name">{o.name}</span>
              <button
                className="obj-del"
                title="删除"
                onClick={(e) => {
                  e.stopPropagation();
                  removeObject(o.id);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {selected && (
        <Section title={`编辑：${selected.name}`}>
          <div className="chip-row">
            <button
              className="chip"
              onClick={() => getEngine()?.setTransformMode('translate')}
            >
              移动模式
            </button>
            <button
              className="chip"
              onClick={() => getEngine()?.setTransformMode('rotate')}
            >
              旋转模式
            </button>
          </div>
          <Slider
            label="位置 X（横向）"
            value={selected.position[0]}
            min={-8}
            max={8}
            step={0.1}
            unit="m"
            onChange={(v) =>
              updateObject(selected.id, {
                position: [v, selected.position[1], selected.position[2]],
              })
            }
          />
          <Slider
            label="位置 Z（纵向）"
            value={selected.position[2]}
            min={-360}
            max={30}
            step={0.5}
            unit="m"
            onChange={(v) =>
              updateObject(selected.id, {
                position: [selected.position[0], selected.position[1], v],
              })
            }
          />
          <Slider
            label="朝向"
            value={radToDeg(selected.rotationY)}
            min={-180}
            max={180}
            step={1}
            unit="°"
            onChange={(v) =>
              updateObject(selected.id, {
                rotationY: (v * Math.PI) / 180,
              })
            }
          />
          {selected.type === 'vehicle' && (
            <div className="ctrl">
              <span className="ctrl-label">车身颜色</span>
              <div className="chip-row">
                {VEHICLE_COLORS.map((c) => (
                  <button
                    key={c}
                    className="color-swatch"
                    style={{
                      background: `#${c.toString(16).padStart(6, '0')}`,
                      outline:
                        selected.color === c ? '2px solid var(--accent)' : 'none',
                    }}
                    onClick={() => updateObject(selected.id, { color: c })}
                  />
                ))}
              </div>
            </div>
          )}
          {selected.type === 'lane' && (
            <>
              <Slider
                label="标线长度"
                value={selected.length ?? 60}
                min={10}
                max={200}
                step={5}
                unit="m"
                onChange={(v) => updateObject(selected.id, { length: v })}
              />
              <Slider
                label="标线宽度"
                value={selected.width ?? 0.15}
                min={0.05}
                max={0.6}
                step={0.01}
                unit="m"
                onChange={(v) => updateObject(selected.id, { width: v })}
              />
            </>
          )}
        </Section>
      )}
    </div>
  );
}

function radToDeg(rad: number) {
  return (rad * 180) / Math.PI;
}
