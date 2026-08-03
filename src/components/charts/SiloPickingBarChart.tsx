import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { AXIS_STYLE, CHART } from "./chartTheme";
import { ChartTooltip } from "./ChartTooltip";

export function SiloPickingBarChart() {
  const { derived } = useLogistics();

  const data = useMemo(
    () => [
      {
        name: "SILO",
        temps: Number(derived.siloTimeHours.toFixed(2)),
        charge: Number(derived.siloChargeHours.toFixed(2)),
        fill: CHART.seriesBlueLight,
      },
      {
        name: "Picking",
        temps: Number(derived.pickingTimeHours.toFixed(2)),
        charge: Number(derived.pickingChargeHours.toFixed(2)),
        fill: CHART.seriesAqua,
      },
    ],
    [derived],
  );

  return (
    <GlassCard delay={0.1} className="col-span-full xl:col-span-1">
      <SectionTitle
        icon={<BarChart3 className="h-5 w-5" strokeWidth={2} />}
        title="SILO vs Picking"
        subtitle="Charge en préparateur-heures"
      />
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barGap={12}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={AXIS_STYLE}
              axisLine={{ stroke: CHART.baseline }}
              tickLine={false}
            />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={34} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={payload?.map((p) => ({
                    name: "Charge",
                    value: p.value as number,
                    color: (p.payload as { fill: string }).fill,
                    unit: "h",
                  }))}
                />
              )}
            />
            <Legend
              content={() => (
                <div
                  className="flex items-center justify-center gap-4 pt-2 text-xs"
                  style={{ color: CHART.secondary }}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CHART.seriesBlueLight }}
                    />
                    SILO
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CHART.seriesAqua }}
                    />
                    Picking
                  </span>
                </div>
              )}
            />
            <Bar dataKey="charge" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
