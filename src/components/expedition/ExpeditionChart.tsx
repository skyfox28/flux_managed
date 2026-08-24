import { Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ExpeditionDayTotal } from "../../types/flows";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { chartAxis, chartGrid, CHART_COLORS, tooltipStyle } from "../../lib/chartTheme";
import { BarChart3 } from "lucide-react";

export function ExpeditionChart({ dayTotals }: { dayTotals: ExpeditionDayTotal[] }) {
  const chartData = dayTotals.map((day) => ({
    label: day.dateISO ?? day.label,
    "Pal SILO": day.palSilo,
    "Colis Picking": day.colisPicking,
  }));

  return (
    <GlassCard className="xl:col-span-2">
      <SectionTitle icon={<BarChart3 className="h-5 w-5" />} title="Activité de préparation" subtitle="Palettes SILO vs colis Picking par jour" />
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chartGrid.stroke} />
            <XAxis dataKey="label" stroke={chartAxis.stroke} tick={chartAxis.tick} />
            <YAxis stroke={chartAxis.stroke} tick={chartAxis.tick} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8296b8" }} />
            <Bar dataKey="Pal SILO" fill={CHART_COLORS.electric} radius={[6, 6, 0, 0]} />
            <Bar dataKey="Colis Picking" fill={CHART_COLORS.amber} radius={[6, 6, 0, 0]} />
            <Tooltip {...tooltipStyle} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
