import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LogisticsInputs, TeamConfig } from "../types/logistics";
import { computeLogistics } from "../lib/calculations";
import type { LogisticsDerived } from "../types/logistics";

const DEFAULT_TEAMS: TeamConfig[] = [
  { id: "matin", label: "Équipe Matin", start: "05:00", end: "12:36", headcount: 8 },
  {
    id: "apresmidi",
    label: "Équipe Après-midi",
    start: "12:24",
    end: "20:00",
    headcount: 7,
  },
  { id: "journee", label: "Équipe Journée", start: "07:00", end: "15:36", headcount: 4 },
];

export const DEFAULT_INPUTS: LogisticsInputs = {
  siloPalettes: 420,
  siloCadence: 18,
  pickingColis: 8200,
  pickingCadence: 400,
  teams: DEFAULT_TEAMS,
};

interface LogisticsContextValue {
  inputs: LogisticsInputs;
  derived: LogisticsDerived;
  setSiloPalettes: (v: number) => void;
  setSiloCadence: (v: number) => void;
  setPickingColis: (v: number) => void;
  setPickingCadence: (v: number) => void;
  setTeamHeadcount: (id: TeamConfig["id"], headcount: number) => void;
  reset: () => void;
}

const LogisticsContext = createContext<LogisticsContextValue | null>(null);

export function LogisticsProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<LogisticsInputs>(DEFAULT_INPUTS);

  const derived = useMemo(() => computeLogistics(inputs), [inputs]);

  const value: LogisticsContextValue = {
    inputs,
    derived,
    setSiloPalettes: (v) =>
      setInputs((prev) => ({ ...prev, siloPalettes: Math.max(0, v) })),
    setSiloCadence: (v) =>
      setInputs((prev) => ({ ...prev, siloCadence: Math.max(0, v) })),
    setPickingColis: (v) =>
      setInputs((prev) => ({ ...prev, pickingColis: Math.max(0, v) })),
    setPickingCadence: (v) =>
      setInputs((prev) => ({ ...prev, pickingCadence: Math.max(0, v) })),
    setTeamHeadcount: (id, headcount) =>
      setInputs((prev) => ({
        ...prev,
        teams: prev.teams.map((t) =>
          t.id === id ? { ...t, headcount: Math.max(0, headcount) } : t,
        ),
      })),
    reset: () => setInputs(DEFAULT_INPUTS),
  };

  return (
    <LogisticsContext.Provider value={value}>{children}</LogisticsContext.Provider>
  );
}

export function useLogistics(): LogisticsContextValue {
  const ctx = useContext(LogisticsContext);
  if (!ctx) throw new Error("useLogistics must be used within LogisticsProvider");
  return ctx;
}
