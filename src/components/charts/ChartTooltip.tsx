interface Payload {
  name: string;
  value: number;
  color: string;
  unit?: string;
}

export function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: Payload[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1020]/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <p className="mb-1 font-medium text-slate-300">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-slate-400">{p.name}</span>
          <span className="ml-auto font-display font-semibold tabular-nums text-slate-100">
            {p.value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
            {p.unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}
