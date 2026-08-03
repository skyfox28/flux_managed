import type { ReactNode } from "react";

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon?: ReactNode;
  onChange: (value: number) => void;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  icon,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          {icon}
          {label}
        </label>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 bg-transparent text-right font-display text-sm font-semibold tabular-nums text-electric-300 outline-none"
          />
          {unit && <span className="text-[11px] text-slate-500">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
