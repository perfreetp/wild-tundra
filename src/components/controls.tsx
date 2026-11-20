import type { ReactNode } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled,
  onChange,
}: SliderProps) {
  return (
    <label className={`slider-row ${disabled ? 'disabled' : ''}`}>
      <span className="slider-label">
        {label}
        <em className="slider-value">
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {unit}
        </em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className={`switch ${checked ? 'on' : ''}`}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </label>
  );
}

export function Section({
  title,
  children,
  extra,
}: {
  title: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <section className="panel-section">
      <h3 className="section-title">
        {title}
        {extra}
      </h3>
      {children}
    </section>
  );
}
