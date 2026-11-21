import { For, Show, createMemo } from 'solid-js';
import {
  versions, compareIds, toggleCompare, applyVersion, deleteVersion,
  clearVersions, shadowLength,
} from '../store.js';

const PARAM_ROWS = [
  ['elevation', '高度角', (v) => `${v}°`],
  ['azimuth', '方位角', (v) => `${v}°`],
  ['mapSize', '阴影分辨率', (v) => `${v}px`],
  ['bias', '偏移量', (v) => v.toFixed(4)],
  ['normalBias', '法线偏移', (v) => v.toFixed(2)],
  ['kernel', '柔边采样核', (v) => v.toFixed(1)],
  ['groundRough', '地面粗糙度', (v) => v.toFixed(2)],
  ['wallRough', '墙面粗糙度', (v) => v.toFixed(2)],
  ['lamps', '路灯', (v) => v.map((on, i) => `${i + 1}号${on ? '开' : '关'}`).join(' / ')],
];

// 小示意图:太阳 + 小人 + 影子(侧视)
function ShadowDiagram(props) {
  const p = () => props.version.params;
  const len = () => props.version.shadowLen;
  const elevRad = () => (p().elevation * Math.PI) / 180;
  // 画布 150x90,小人在 x=40,影子往右画,长度按比例压缩
  const px = 40, groundY = 74, personH = 26;
  const shadowPx = () => Math.min(100, len() * 14);
  const sunX = () => px - Math.cos(elevRad()) * 55;
  const sunY = () => groundY - Math.sin(elevRad()) * 55;
  return (
    <svg viewBox="0 0 150 90" class="shadow-diagram">
      <line x1="0" y1={groundY} x2="150" y2={groundY} stroke="currentColor" stroke-width="1.5" />
      {/* 影子 */}
      <line x1={px} y1={groundY} x2={px + shadowPx()} y2={groundY}
        stroke="#333" stroke-width="5" stroke-linecap="round" opacity="0.55" />
      {/* 小人 */}
      <line x1={px} y1={groundY} x2={px} y2={groundY - personH} stroke="#c0392b" stroke-width="5" stroke-linecap="round" />
      <circle cx={px} cy={groundY - personH - 5} r="5" fill="#c0392b" />
      {/* 太阳光线 */}
      <line x1={sunX()} y1={sunY()} x2={px} y2={groundY - personH}
        stroke="#e6a817" stroke-width="1.5" stroke-dasharray="4 3" />
      <circle cx={sunX()} cy={sunY()} r="8" fill="#f5c542" stroke="#e6a817" stroke-width="2" />
      <text x={px + shadowPx() / 2} y={groundY + 12} text-anchor="middle" font-size="9" fill="currentColor">
        影长 {len().toFixed(2)}m
      </text>
    </svg>
  );
}

function VersionCard(props) {
  return (
    <div class="compare-card">
      <div class="compare-card-head">
        <b>{props.version.name}</b>
        <span>{new Date(props.version.time).toLocaleTimeString()}</span>
      </div>
      <ShadowDiagram version={props.version} />
      <table class="compare-table">
        <tbody>
          <For each={PARAM_ROWS}>
            {([key, label, fmt]) => {
              const other = props.other;
              const mine = props.version.params[key];
              const differs = other && JSON.stringify(mine) !== JSON.stringify(other.params[key]);
              return (
                <tr classList={{ diff: !!differs }}>
                  <td>{label}</td>
                  <td>{fmt(mine)}</td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
}

export default function VersionsPanel() {
  const compareVersions = createMemo(() => {
    const [a, b] = compareIds();
    const list = versions();
    return [list.find((v) => v.id === a) ?? null, list.find((v) => v.id === b) ?? null];
  });

  return (
    <div class="panel-sections">
      <section>
        <h3>📼 版本记录</h3>
        <p class="hint">每次调整都会自动存成一个版本。点「对比」挑两个版本,左右比较影长和光源参数。</p>
        <div class="version-actions">
          <button class="dbg-btn" onClick={clearVersions} disabled={versions().length === 0}>
            清空全部
          </button>
        </div>
        <ul class="version-list">
          <For each={[...versions()].reverse()} fallback={<li class="hint">还没有版本,动一动滑块试试!</li>}>
            {(v) => {
              const picked = () => compareIds().includes(v.id);
              return (
                <li classList={{ 'version-item': true, picked: picked() }}>
                  <span class="version-name">{v.name}</span>
                  <span class="version-meta">
                    {new Date(v.time).toLocaleTimeString()} · 影长 {v.shadowLen.toFixed(2)}m
                  </span>
                  <span class="version-btns">
                    <button onClick={() => toggleCompare(v.id)}>
                      {picked() ? '取消' : '对比'}
                    </button>
                    <button onClick={() => applyVersion(v)}>应用</button>
                    <button onClick={() => deleteVersion(v.id)}>删</button>
                  </span>
                </li>
              );
            }}
          </For>
        </ul>
      </section>

      <Show when={compareVersions()[0] && compareVersions()[1]}>
        <section>
          <h3>⚖️ 左右对比</h3>
          <div class="compare-grid">
            <VersionCard version={compareVersions()[0]} other={compareVersions()[1]} />
            <VersionCard version={compareVersions()[1]} other={compareVersions()[0]} />
          </div>
          <p class="hint">黄色高亮的行是两个版本不一样的参数。</p>
        </section>
      </Show>
      <Show when={compareVersions().filter(Boolean).length === 1}>
        <p class="hint">再挑一个版本,就能左右对比啦。</p>
      </Show>
    </div>
  );
}
