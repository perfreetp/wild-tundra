import { useState } from "react";
import type { MaterialPreset } from "../core/presets";

interface PresetBarProps {
  presets: MaterialPreset[];
  onApply: (preset: MaterialPreset) => void;
  onSaveAsPreset: (name: string) => void;
}

export function PresetBar({ presets, onApply, onSaveAsPreset }: PresetBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="preset-bar" data-testid="preset-bar">
      <span className="preset-label">起始预设</span>
      <div className="preset-chips">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-chip"
            onClick={() => onApply(preset)}
            title={preset.description}
            data-testid={`preset-${preset.id}`}
          >
            {preset.name}
          </button>
        ))}
      </div>
      <span className="preset-grow" />
      <button
        type="button"
        className="ghost-button"
        onClick={() => setMenuOpen((prev) => !prev)}
        data-testid="save-preset-toggle"
      >
        保存为预设
      </button>
      {menuOpen ? (
        <div className="preset-save">
          <input
            autoFocus
            placeholder="预设名称，例如 沿海盐雾锈蚀"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSaveAsPreset(name);
                setName("");
                setMenuOpen(false);
              }
              if (event.key === "Escape") setMenuOpen(false);
            }}
            data-testid="preset-name-input"
          />
          <button
            type="button"
            className="primary-button small"
            onClick={() => {
              onSaveAsPreset(name);
              setName("");
              setMenuOpen(false);
            }}
            disabled={name.trim().length === 0}
            data-testid="preset-save-confirm"
          >
            保存
          </button>
        </div>
      ) : null}
    </div>
  );
}
