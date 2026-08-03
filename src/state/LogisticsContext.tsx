import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LogisticsInputs, TeamConfig } from "../types/logistics";
import { BREAK_HOURS_PER_SHIFT, computeLogistics } from "../lib/calculations";
import type { LogisticsDerived } from "../types/logistics";
import { loadDays, nowDecimalHours, saveDays, todayISO, type DaysStore } from "../lib/storage";

const DEFAULT_TEAMS: TeamConfig[] = [
  { id: "matin", label: "Équipe Matin", start: "05:00", end: "12:36", headcount: 0 },
  {
    id: "apresmidi",
    label: "Équipe Après-midi",
    start: "12:24",
    end: "20:00",
    headcount: 0,
  },
  { id: "journee", label: "Équipe Journée", start: "07:00", end: "15:36", headcount: 0 },
];

// Seules les cadences sont préremplies (valeurs machine/process typiques) ;
// volumes du jour et effectifs démarrent à 0, à saisir pour chaque journée.
// Fenêtre silo par défaut : 2 équipes de 7h36 (matin + après-midi), pauses déduites
// (10 + 20 min par équipe) — le cas le plus courant. Ajustable si le silo tourne
// davantage (2×8h, 3×8h, samedi en plus...).
export const SILO_SHIFT_HOURS = 7.6;
export const DEFAULT_SILO_WINDOW_HOURS = 2 * (SILO_SHIFT_HOURS - BREAK_HOURS_PER_SHIFT);

export const DEFAULT_INPUTS: LogisticsInputs = {
  siloPalettes: 0,
  siloCadence: 18,
  siloEfficiencyPct: 100,
  siloDowntimeHours: 0,
  siloWindowHours: DEFAULT_SILO_WINDOW_HOURS,
  pickingColis: 0,
  pickingCadence: 400,
  pickingEfficiencyPct: 100,
  teams: DEFAULT_TEAMS,
};

function cloneInputs(inputs: LogisticsInputs): LogisticsInputs {
  return { ...inputs, teams: inputs.teams.map((t) => ({ ...t })) };
}

interface LogisticsContextValue {
  inputs: LogisticsInputs;
  derived: LogisticsDerived;
  setSiloPalettes: (v: number) => void;
  setSiloCadence: (v: number) => void;
  setSiloEfficiencyPct: (v: number) => void;
  setSiloDowntimeHours: (v: number) => void;
  setSiloWindowHours: (v: number) => void;
  setPickingColis: (v: number) => void;
  setPickingCadence: (v: number) => void;
  setPickingEfficiencyPct: (v: number) => void;
  setTeamHeadcount: (id: TeamConfig["id"], headcount: number) => void;
  reset: () => void;
  /** Journées enregistrées, triées chronologiquement, avec leur statut calculé. */
  savedDays: { date: string; status: LogisticsDerived["status"] }[];
  /** Saisie brute de toutes les journées (clé = date ISO), pour les vues de projection. */
  store: DaysStore;
  selectedDate: string;
  selectDate: (date: string) => void;
  deleteDay: (date: string) => void;
}

const LogisticsContext = createContext<LogisticsContextValue | null>(null);

export function LogisticsProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(() => todayISO());
  const [store, setStore] = useState<DaysStore>(() => {
    const loaded = loadDays();
    const today = todayISO();
    if (!loaded[today]) loaded[today] = cloneInputs(DEFAULT_INPUTS);
    return loaded;
  });

  useEffect(() => {
    saveDays(store);
  }, [store]);

  const inputs = store[selectedDate] ?? DEFAULT_INPUTS;
  // Sur la journée en cours (date du jour réelle), on ne compte que les heures encore
  // disponibles à partir de maintenant : ce que ça ne suffit pas à absorber devient un
  // report sur demain (cf. lib/backlog.ts), exactement comme si on saisissait en direct
  // à 14h avec seulement l'après-midi restant pour traiter la charge du jour.
  const derived = useMemo(
    () => computeLogistics(inputs, selectedDate === todayISO() ? nowDecimalHours() : null),
    [inputs, selectedDate],
  );

  const updateCurrent = (updater: (prev: LogisticsInputs) => LogisticsInputs) => {
    setStore((prev) => ({
      ...prev,
      [selectedDate]: updater(prev[selectedDate] ?? cloneInputs(DEFAULT_INPUTS)),
    }));
  };

  const savedDays = useMemo(
    () =>
      Object.keys(store)
        .sort()
        .map((date) => ({ date, status: computeLogistics(store[date]).status })),
    [store],
  );

  const value: LogisticsContextValue = {
    inputs,
    derived,
    setSiloPalettes: (v) => updateCurrent((prev) => ({ ...prev, siloPalettes: Math.max(0, v) })),
    setSiloCadence: (v) => updateCurrent((prev) => ({ ...prev, siloCadence: Math.max(0, v) })),
    setSiloEfficiencyPct: (v) =>
      updateCurrent((prev) => ({ ...prev, siloEfficiencyPct: Math.max(0, v) })),
    setSiloDowntimeHours: (v) =>
      updateCurrent((prev) => ({ ...prev, siloDowntimeHours: Math.max(0, v) })),
    setSiloWindowHours: (v) =>
      updateCurrent((prev) => ({ ...prev, siloWindowHours: Math.max(0, v) })),
    setPickingColis: (v) => updateCurrent((prev) => ({ ...prev, pickingColis: Math.max(0, v) })),
    setPickingCadence: (v) =>
      updateCurrent((prev) => ({ ...prev, pickingCadence: Math.max(0, v) })),
    setPickingEfficiencyPct: (v) =>
      updateCurrent((prev) => ({ ...prev, pickingEfficiencyPct: Math.max(0, v) })),
    setTeamHeadcount: (id, headcount) =>
      updateCurrent((prev) => ({
        ...prev,
        teams: prev.teams.map((t) =>
          t.id === id ? { ...t, headcount: Math.max(0, headcount) } : t,
        ),
      })),
    reset: () => updateCurrent(() => cloneInputs(DEFAULT_INPUTS)),
    savedDays,
    store,
    selectedDate,
    selectDate: (date) => {
      setStore((prev) => {
        if (prev[date]) return prev;
        // Nouvelle journée : on part de la saisie courante (cadences/effectifs
        // restent généralement stables d'un jour à l'autre, seuls les volumes changent).
        return { ...prev, [date]: cloneInputs(inputs) };
      });
      setSelectedDate(date);
    },
    deleteDay: (date) => {
      setStore((prev) => {
        if (Object.keys(prev).length <= 1) return prev; // toujours garder au moins un jour
        const next = { ...prev };
        delete next[date];
        if (date === selectedDate) {
          const remaining = Object.keys(next).sort();
          setSelectedDate(remaining[remaining.length - 1]);
        }
        return next;
      });
    },
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
