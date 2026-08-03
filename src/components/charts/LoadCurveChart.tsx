import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { buildDayTimeline } from "../../lib/timeline";
import { AXIS_STYLE, CHART } from "./chartTheme";
import { ChartTooltip } from "./ChartTooltip";

export function LoadCurveChart() {
  const { derived } = useLogistics();
  const data = useMemo(() => buildDayTimeline(derived), [derived]);

  return (
    <GlassCard delay={0.05} className="col-span-full xl:col-span-2">
      <SectionTitle
        icon={<TrendingUp className="h-5 w-5" strokeWidth={2} />}
        title="Courbe de charge"
        subtitle="Charge estimée vs capacité disponible, par heure"
      />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="chargeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.seriesBlue} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART.seriesBlue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS_STYLE}
              axisLine={{ stroke: CHART.baseline }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={38}
              label={{
                value: "préparateur-h",
                angle: -90,
                position: "insideLeft",
                fill: CHART.muted,
                fontSize: 10,
              }}
            />
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
                    unit: "h",
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
              dataKey="charge"
              name="Charge"
              stroke={CHART.seriesBlue}
              strokeWidth={2}
              fill="url(#chargeFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: CHART.surface }}
            />
            <Line
              type="monotone"
              dataKey="capacity"
              name="Capacité"
              stroke={CHART.secondary}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: CHART.surface }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
