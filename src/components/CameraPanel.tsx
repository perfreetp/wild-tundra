import { useSimStore } from '../store';
import { Section, Segmented, Slider, Toggle } from './Controls';
import type { DistortionMode, TimeOfDay } from '../types';

const EV_PRESETS = [
  { label: '隧道入口 -3', stops: -3 },
  { label: '标准 0', stops: 0 },
  { label: '隧道出口 +3', stops: 3 },
];

export function CameraPanel() {
  const params = useSimStore((s) => s.params);
  const update = useSimStore((s) => s.updateParams);

  return (
    <div className="panel-body">
      <Section title="光照预设">
        <Segmented<TimeOfDay>
          value={params.timeOfDay}
          options={[
            { value: 'day', label: '白天' },
            { value: 'dusk', label: '黄昏' },
            { value: 'night', label: '夜间' },
          ]}
          onChange={(v) => update({ timeOfDay: v })}
        />
      </Section>

      <Section title="镜头模型">
        <Slider
          label="焦距（标注）"
          value={params.focalLength}
          min={2}
          max={50}
          step={0.5}
          unit="mm"
          onChange={(v) => update({ focalLength: v })}
        />
        <Slider
          label="垂直视场角 FOV"
          value={params.fov}
          min={30}
          max={120}
          step={1}
          unit="°"
          onChange={(v) => update({ fov: v })}
        />
        <Segmented<DistortionMode>
          label="畸变类型"
          value={params.distortionMode}
          options={[
            { value: 'off', label: '无' },
            { value: 'barrel', label: '桶形' },
            { value: 'pincushion', label: '枕形' },
          ]}
          onChange={(v) => update({ distortionMode: v })}
        />
        <Slider
          label="畸变强度"
          value={params.distortionAmount}
          min={0}
          max={1}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update({ distortionAmount: v })}
        />
      </Section>

      <Section title="曝光与动态范围">
        <Slider
          label="曝光补偿 EV"
          value={params.exposureStops}
          min={-6}
          max={6}
          step={1}
          unit="档"
          format={(v) => (v >= 0 ? `+${v}` : `${v}`)}
          onChange={(v) => update({ exposureStops: v })}
        />
        <div className="chip-row">
          {EV_PRESETS.map((p) => (
            <button
              key={p.label}
              className="chip"
              onClick={() => update({ exposureStops: p.stops })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Slider
          label="传感器动态范围"
          value={params.dynamicRange}
          min={6}
          max={20}
          step={1}
          unit="档"
          onChange={(v) => update({ dynamicRange: v })}
        />
        <p className="hint">
          巡航经过隧道时观察入口暗适应 / 出口高光截止；降低动态范围档可模拟低端传感器。
        </p>
      </Section>

      <Section title="夜间眩光与光晕">
        <Toggle
          label="启用眩光（Bloom）"
          checked={params.glareEnabled}
          onChange={(v) => update({ glareEnabled: v })}
        />
        <Slider
          label="光源强度触发阈值"
          value={params.glareThreshold}
          min={0.1}
          max={1.8}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(v) => update({ glareThreshold: v })}
        />
        <Slider
          label="光晕强度"
          value={params.glareIntensity}
          min={0}
          max={3}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(v) => update({ glareIntensity: v })}
        />
        <p className="hint">
          车灯、路灯、隧道灯条按光源强度越过阈值触发光晕；切到夜间预设效果最明显。
        </p>
      </Section>

      <Section title="滚动快门">
        <Slider
          label="卷帘倾斜量"
          value={params.rollingShutterTilt}
          min={0}
          max={1}
          step={0.01}
          format={(v) =>
            v < 0.001 ? '全局快门' : `${Math.round(v * 100)}%`
          }
          onChange={(v) => update({ rollingShutterTilt: v })}
        />
        <p className="hint">
          模拟 CMOS 逐行读出，巡航时画面出现剪切 / 果冻形变；调到 0 即全局快门。
        </p>
      </Section>

      <Section title="标定网格">
        <Toggle
          label="叠加网格线"
          checked={params.gridEnabled}
          onChange={(v) => update({ gridEnabled: v })}
        />
        <Slider
          label="网格间距"
          value={params.gridStep}
          min={0.02}
          max={0.5}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => update({ gridStep: v })}
        />
      </Section>

      <Section title="相机机位">
        <Slider
          label="安装高度"
          value={params.cameraHeight}
          min={0.8}
          max={4}
          step={0.05}
          unit="m"
          onChange={(v) => update({ cameraHeight: v })}
        />
        <Slider
          label="俯仰角"
          value={params.cameraPitch}
          min={-25}
          max={10}
          step={0.5}
          unit="°"
          onChange={(v) => update({ cameraPitch: v })}
        />
      </Section>
    </div>
  );
}
