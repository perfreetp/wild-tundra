/** 全局共享样式（以构造样式表形式注入每个 Shadow Root） */
export const SHARED_CSS = /* css */ `
  :host {
    --bg: #0b0f14;
    --bg-panel: #121920;
    --bg-panel-2: #0f151c;
    --bg-raised: #18212b;
    --bg-input: #0a1016;
    --line: #24303c;
    --line-soft: #1a232d;
    --text: #dbe4ed;
    --text-dim: #8a99a8;
    --text-faint: #5f6e7d;
    --accent: #f3ac3c;
    --accent-soft: rgba(243, 172, 60, 0.14);
    --cyan: #5ec8dc;
    --danger: #e5665a;
    --ok: #62c08a;
    --radius: 10px;
    --shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
    font-family: 'Segoe UI', 'Microsoft YaHei UI', 'PingFang SC', system-ui, sans-serif;
    color: var(--text);
    font-size: 13px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }

  *, *::before, *::after { box-sizing: border-box; }

  .mono {
    font-family: 'Cascadia Mono', 'JetBrains Mono', Consolas, 'SFMono-Regular', monospace;
    font-variant-numeric: tabular-nums;
  }

  button {
    font: inherit;
    color: inherit;
    background: var(--bg-raised);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease, color 120ms ease, transform 80ms ease;
  }
  button:hover { background: #1e2a36; border-color: #33424f; }
  button:active { transform: translateY(1px); }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  button[disabled] { opacity: 0.45; cursor: not-allowed; }
  button.primary {
    background: linear-gradient(180deg, #f7b84d, #e39a24);
    color: #1a1206;
    border-color: #b97c16;
    font-weight: 600;
  }
  button.primary:hover { background: linear-gradient(180deg, #ffc55f, #eea52c); }
  button.ghost { background: transparent; }
  button.icon { width: 28px; height: 28px; padding: 0; display: inline-grid; place-items: center; }

  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 18px;
    background: transparent;
    cursor: pointer;
    margin: 0;
  }
  input[type='range']::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent) 0%, var(--accent) var(--fill, 50%), #2a3540 var(--fill, 50%), #2a3540 100%);
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -5px;
    border-radius: 50%;
    background: #f6f9fc;
    border: 2px solid #b9822a;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    transition: transform 100ms ease;
  }
  input[type='range']:hover::-webkit-slider-thumb { transform: scale(1.12); }
  input[type='range']:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 999px; }

  input[type='number'], input[type='text'] {
    font: inherit;
    color: var(--text);
    background: var(--bg-input);
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 4px 6px;
    width: 100%;
  }
  input[type='number']:focus, input[type='text']:focus { outline: 1px solid var(--cyan); border-color: var(--cyan); }

  ::selection { background: rgba(94, 200, 220, 0.3); }

  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
`;
