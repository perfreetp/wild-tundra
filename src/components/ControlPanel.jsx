import { Show } from 'solid-js';
import { params, setParams, scheduleSave, applyPreset, shadowLength, PRESETS } from '../store.js';
import Slider from './Slider.jsx';

export default function ControlPanel() {
  const set = (key) => (v) => {
    setParams(key, v);
    scheduleSave();
  };

  return (
    <div class="panel-sections">
      <section>
        <h3>🌞 太阳的位置</h3>
        <Slider
          label="高度角" min={10} max={80} step={1} value={params.elevation}
          onChange={set('elevation')} format={(v) => `${v}°`}
        />
        <Slider
          label="方位角" min={0} max={360} step={1} value={params.azimuth}
          onChange={set('azimuth')} format={(v) => `${v}°`}
        />
        <div class="preset-row">
          <For each={Object.entries(PRESETS)}>
            {([key, p]) => (
              <button class="preset-btn" onClick={() => applyPreset(key)}>{p.label}</button>
            )}
          </For>
        </div>
        <p class="hint">
          现在小人的影子大约长 <b>{shadowLength(params).toFixed(2)} 米</b>
          (小人身高 1.2 米)
        </p>
      </section>

      <section>
        <h3>🌑 阴影质量</h3>
        <Slider
          label="分辨率" min={512} max={2048} step={256} value={params.mapSize}
          onChange={set('mapSize')} format={(v) => `${v}px`}
        />
        <Slider
          label="偏移量" min={-0.005} max={0.005} step={0.0001} value={params.bias}
          onChange={set('bias')} format={(v) => v.toFixed(4)}
        />
        <Slider
          label="法线偏移" min={0} max={2} step={0.01} value={params.normalBias}
          onChange={set('normalBias')} format={(v) => v.toFixed(2)}
        />
        <Slider
          label="柔边采样核" min={0} max={12} step={0.5} value={params.kernel}
          onChange={set('kernel')} format={(v) => v.toFixed(1)}
        />
        <p class="hint">阴影出现一道道条纹(阴影痤疮)时,调大偏移量试试。</p>
      </section>

      <section>
        <h3>🔍 调试视图</h3>
        <div class="btn-grid">
          <For each={[
            ['none', '正常'],
            ['shadowmap', '阴影贴图'],
            ['cascades', '级联染色'],
            ['depth', '深度'],
          ]}>
            {([key, label]) => (
              <button
                classList={{ 'dbg-btn': true, active: params.debugView === key }}
                onClick={() => set('debugView')(key)}
              >
                {label}
              </button>
            )}
          </For>
        </div>
        <Show when={params.debugView === 'shadowmap'}>
          <div class="preset-row">
            <For each={['第1级(近)', '第2级(中)', '第3级(远)']}>
              {(label, i) => (
                <button
                  classList={{ 'dbg-btn': true, active: params.debugCascade === i() }}
                  onClick={() => set('debugCascade')(i())}
                >
                  {label}
                </button>
              )}
            </For>
          </div>
          <p class="hint">右下角小窗:从那一级阳光相机看出去的深度,就是阴影贴图看到的世界。</p>
        </Show>
        <Show when={params.debugView === 'cascades'}>
          <p class="hint">🔴 近处一级最清晰,🟢 中间一级次之,🔵 远处一级最省(精度最低)。</p>
        </Show>
      </section>

      <section>
        <h3>🧱 材质粗糙度</h3>
        <Slider
          label="地面" min={0} max={1} step={0.01} value={params.groundRough}
          onChange={set('groundRough')} format={(v) => v.toFixed(2)}
        />
        <Slider
          label="墙面" min={0} max={1} step={0.01} value={params.wallRough}
          onChange={set('wallRough')} format={(v) => v.toFixed(2)}
        />
        <p class="hint">地面越粗糙,影子边缘越散(和柔边采样核一起作用)。</p>
      </section>

      <section>
        <h3>💡 路灯(点光源)</h3>
        <div class="preset-row">
          <For each={params.lamps}>
            {(on, i) => (
              <button
                classList={{ 'lamp-btn': true, off: !on }}
                onClick={() => {
                  setParams('lamps', i(), !on);
                  scheduleSave();
                }}
              >
                {on ? `🔆 ${i() + 1}号灯 开` : `🌑 ${i() + 1}号灯 关`}
              </button>
            )}
          </For>
        </div>
        <p class="hint">关掉一盏灯,它那一片影子就消失啦。路灯的阴影存在立方体贴图里。</p>
      </section>

      <section>
        <h3>🧍 小人</h3>
        <p class="hint">直接在画面上<b>拖动小人</b>,把两个小人拖到一起,看看影子会不会交叠!</p>
      </section>
    </div>
  );
}
