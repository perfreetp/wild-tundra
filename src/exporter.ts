import { WEATHER_MAP } from './materials';
import type { PointRecord, ScanConfig, WeatherLevel } from './types';

/**
 * 导出当前点云为 xyz + intensity 文本：
 *   头部注释记录扫描参数，每行 "x y z intensity"（空格分隔，保留 4 位小数）。
 *   文件名带线束数与雾档，如 lidar_64ch_mediumFog_20261121_153012.txt
 */
export function buildPointCloudText(
  points: PointRecord[],
  config: ScanConfig,
  weather: WeatherLevel,
): string {
  const header = [
    '# LiDAR intensity simulation export',
    `# channels=${config.channels} horizontal_resolution_deg=${config.horizontalResolutionDeg} max_range_m=${config.maxRange}`,
    `# weather=${weather} extinction_per_m=${WEATHER_MAP[weather].extinction}`,
    '# point_count=' + points.length,
    '# columns: x y z intensity',
  ].join('\n');

  const lines = points.map(
    (p) =>
      `${p.x.toFixed(4)} ${p.y.toFixed(4)} ${p.z.toFixed(4)} ${p.intensity.toFixed(4)}`,
  );
  return header + '\n' + lines.join('\n') + '\n';
}

function timestamp(d: Date): string {
  const pad = (v: number): string => String(v).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export function exportFileName(config: ScanConfig, weather: WeatherLevel): string {
  return `lidar_${config.channels}ch_${weather}_${timestamp(new Date())}.txt`;
}

export function downloadTextFile(fileName: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 延迟释放，确保下载已启动
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
