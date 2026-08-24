export const CHART_COLORS = {
  cyan: "#22e8ff",
  electric: "#38bdf8",
  amber: "#fb923c",
  emerald: "#34d399",
  rose: "#f8536a",
  violet: "#a78bfa",
  slate: "#64748b",
};

export const SITE_PALETTE = [
  CHART_COLORS.electric,
  CHART_COLORS.amber,
  CHART_COLORS.emerald,
  CHART_COLORS.violet,
  CHART_COLORS.rose,
  CHART_COLORS.cyan,
  "#f472b6",
  "#facc15",
];

export const chartGrid = {
  stroke: "rgba(148, 163, 184, 0.12)",
};

export const chartAxis = {
  stroke: "rgba(148, 163, 184, 0.35)",
  tick: { fill: "#8296b8", fontSize: 11 },
};

export const tooltipStyle = {
  contentStyle: {
    background: "rgba(10, 15, 28, 0.92)",
    border: "1px solid rgba(125, 211, 252, 0.25)",
    borderRadius: 12,
    color: "#e8f3ff",
    fontSize: 12,
    boxShadow: "0 8px 32px rgba(2,8,23,0.6)",
  },
  labelStyle: { color: "#7fd9ff", fontWeight: 600, marginBottom: 4 },
  cursor: { fill: "rgba(125, 211, 252, 0.06)" },
};
