import type { ReactNode } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** 自定义显示格式（如 EV 档位带 + 号） */
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
}: SliderProps) {
  return (
    <label className="ctrl">
      <span className="ctrl-label">
        {label}
        <span className="ctrl-value">
          {format ? format(value) : value}
          {unit ? ` ${unit}` : ''}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

interface SegProps<T extends string> {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegProps<T>) {
  return (
    <div className="ctrl">
      {label && <span className="ctrl-label">{label}</span>}
      <div className="segmented">
        {options.map((o) => (
          <button
            key={o.value}
            className={o.value === value ? 'seg active' : 'seg'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="ctrl toggle-row">
      <span className="ctrl-label">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
