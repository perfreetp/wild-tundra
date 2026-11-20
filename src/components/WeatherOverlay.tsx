import { useAppStore } from '../store/appStore';

/**
 * 雨雾天气叠加层（DOM/CSS）：
 * - 雾：按能见度 50–500m 映射朦胧遮罩不透明度
 * - 雨：CSS 动画雨幕 + 随雨量强度变化
 * 与 three.js 场景内雾/粒子协同，提供屏幕空间的天气观感。
 */
export function WeatherOverlay() {
  const weather = useAppStore((s) => s.weather);

  // 能见度 50→0.55 朦胧，500→0.05
  const fogOpacity = weather.fog
    ? 0.05 + (1 - (weather.visibility - 50) / 450) * 0.5
    : 0;
  const rainOpacity = weather.rain ? 0.2 + weather.rainIntensity * 0.55 : 0;

  return (
    <div className="weather-overlay" aria-hidden>
      {weather.fog && (
        <div
          className="fog-layer"
          style={{
            opacity: fogOpacity,
            backdropFilter: `blur(${Math.round(fogOpacity * 6)}px)`,
          }}
        />
      )}
      {weather.rain && (
        <div
          className="rain-layer"
          style={{
            opacity: rainOpacity,
            animationDuration: `${0.9 - weather.rainIntensity * 0.45}s`,
          }}
        />
      )}
    </div>
  );
}
