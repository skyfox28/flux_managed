import { CalendarDays, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLogistics } from "../../state/LogisticsContext";
import { addDaysISO } from "../../lib/storage";
import { formatDayLabel } from "../../lib/format";

const STATUS_DOT: Record<string, string> = {
  ok: "bg-emerald-400",
  warning: "bg-orange-400",
  critical: "bg-rose-400",
};

export function DayBar() {
  const { savedDays, selectedDate, selectDate, deleteDay } = useLogistics();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
          <CalendarDays className="h-4 w-4" strokeWidth={2} />
        </div>
        <div>
          <label htmlFor="day-picker" className="block text-xs text-slate-500">
            Journée planifiée
          </label>
          <input
            id="day-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && selectDate(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="bg-transparent font-display text-sm font-semibold text-slate-100 outline-none"
          />
        </div>
      </div>

      <div className="flex flex-1 items-center gap-2 overflow-x-auto sm:justify-end">
        {savedDays.map(({ date, status }) => (
          <button
            key={date}
            onClick={() => selectDate(date)}
            className={`group relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
              date === selectedDate
                ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
            {formatDayLabel(date)}
            {savedDays.length > 1 && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDay(date);
                }}
                className="ml-0.5 rounded-full p-0.5 text-slate-500 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100"
                title="Supprimer cette journée"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => {
            let iso = selectedDate;
            do {
              iso = addDaysISO(iso, 1);
            } while (savedDays.some((s) => s.date === iso));
            selectDate(iso);
          }}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-white/15 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-cyan-300/30 hover:text-cyan-300"
        >
          <Plus className="h-3 w-3" />
          Jour suivant
        </button>
      </div>
    </motion.div>
  );
}
