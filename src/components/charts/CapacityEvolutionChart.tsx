import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { buildDayTimeline } from "../../lib/timeline";
import { AXIS_STYLE, CHART } from "./chartTheme";
import { ChartTooltip } from "./ChartTooltip";

export function CapacityEvolutionChart() {
  const { derived } = useLogistics();
  const data = useMemo(() => buildDayTimeline(derived), [derived]);

  return (
    <GlassCard delay={0.2} className="col-span-full xl:col-span-3">
      <SectionTitle
        icon={<Activity className="h-5 w-5" strokeWidth={2} />}
        title="Évolution de la capacité"
        subtitle="Cumul journalier — charge vs capacité disponible"
      />
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="capFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.seriesAqua} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART.seriesAqua} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.seriesBlue} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART.seriesBlue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS_STYLE}
              axisLine={{ stroke: CHART.baseline }}
              tickLine={false}
              interval={1}
            />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: CHART.baseline, strokeWidth: 1 }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={payload?.map((p) => ({
                    name: p.name as string,
                    value: p.value as number,
                    color: p.color as string,
                    unit: "h cumul.",
                  }))}
                />
              )}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: CHART.secondary }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="cumulativeCapacity"
              name="Capacité cumulée"
              stroke={CHART.seriesAqua}
              strokeWidth={2}
              fill="url(#capFill)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="cumulativeCharge"
              name="Charge cumulée"
              stroke={CHART.seriesBlue}
              strokeWidth={2}
              fill="url(#loadFill)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
