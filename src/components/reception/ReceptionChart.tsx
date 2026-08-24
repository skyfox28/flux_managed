import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReceptionDay } from "../../types/flows";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { formatDayLabel } from "../../lib/format";
import { chartAxis, chartGrid, SITE_PALETTE, tooltipStyle, CHART_COLORS } from "../../lib/chartTheme";
import { BarChart3 } from "lucide-react";

export function ReceptionChart({ days, siteNames }: { days: ReceptionDay[]; siteNames: string[] }) {
  const chartData = days.map((day) => {
    const row: Record<string, number | string> = {
      date: formatDayLabel(day.dateISO),
      capacite: day.capacite ?? 0,
    };
    for (const site of siteNames) row[site] = day.sites[site]?.palettes ?? 0;
    row["Sous-Traitant"] = day.sousTraitant.palettes;
    row["Rapatriement"] = day.rapatriement.palettes;
    return row;
  });

  const stackedKeys = [...siteNames, "Sous-Traitant", "Rapatriement"];

  return (
    <GlassCard className="xl:col-span-2">
      <SectionTitle icon={<BarChart3 className="h-5 w-5" />} title="Palettes reçues par jour" subtitle="Répartition par site vs capacité de la zone" />
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chartGrid.stroke} />
            <XAxis dataKey="date" stroke={chartAxis.stroke} tick={chartAxis.tick} />
            <YAxis stroke={chartAxis.stroke} tick={chartAxis.tick} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8296b8" }} />
            <Line
              type="monotone"
              dataKey="capacite"
              name="Capacité"
              stroke={CHART_COLORS.rose}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            {stackedKeys.map((key, index) => (
              <Bar key={key} dataKey={key} stackId="palettes" fill={SITE_PALETTE[index % SITE_PALETTE.length]} radius={0} />
            ))}
            <Tooltip {...tooltipStyle} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
