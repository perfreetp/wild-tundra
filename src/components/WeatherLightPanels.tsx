import { useAppStore } from '../store/appStore';
import { Section, Slider, Toggle } from './controls';

/** 雨雾天气：叠加层开关 + 能见度 50–500m + 雨量强度 */
export function WeatherPanel() {
  const weather = useAppStore((s) => s.weather);
  const patchWeather = useAppStore((s) => s.patchWeather);

  return (
    <Section title="雨雾天气（叠加层）">
      <Toggle
        label="雾天"
        checked={weather.fog}
        onChange={(v) => patchWeather({ fog: v })}
      />
      <Toggle
        label="雨天"
        checked={weather.rain}
        onChange={(v) => patchWeather({ rain: v })}
      />
      <Slider
        label="能见度"
        value={weather.visibility}
        min={50}
        max={500}
        step={5}
        unit=" m"
        onChange={(v) => patchWeather({ visibility: v, fog: true })}
      />
      <Slider
        label="雨量强度"
        value={weather.rainIntensity}
        min={0}
        max={1}
        step={0.05}
        disabled={!weather.rain}
        onChange={(v) => patchWeather({ rainIntensity: v })}
      />
      <p className="hint">
        能见度同时驱动场景线性雾 far 平面与叠加层朦胧度，范围限定 50–500m。
      </p>
    </Section>
  );
}

/** 灯光强度 0–3 档滑条 */
export function LightPanel() {
  const lightLevel = useAppStore((s) => s.lightLevel);
  const setLightLevel = useAppStore((s) => s.setLightLevel);

  return (
    <Section title="灯光">
      <div className="light-levels">
        {[0, 1, 2, 3].map((lv) => (
          <button
            key={lv}
            className={`level-pill ${lightLevel === lv ? 'active' : ''}`}
            onClick={() => setLightLevel(lv as 0 | 1 | 2 | 3)}
          >
            {lv === 0 ? '灭灯' : `${lv} 档`}
          </button>
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={lightLevel}
        className="light-slider"
        onChange={(e) => setLightLevel(Number(e.target.value) as 0 | 1 | 2 | 3)}
      />
      <p className="hint">联动环境光、方向光与隧道点光源，0 档仅保留微弱环境光。</p>
    </Section>
  );
}
