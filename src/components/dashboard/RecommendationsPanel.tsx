import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useLogistics } from "../../state/LogisticsContext";
import { computeRecommendations } from "../../lib/recommendations";

export function RecommendationsPanel() {
  const { inputs, derived } = useLogistics();
  const recommendations = useMemo(
    () => computeRecommendations(inputs, derived),
    [inputs, derived],
  );

  return (
    <AnimatePresence>
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35 }}
          className="glass-panel overflow-hidden p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-orange-300" strokeWidth={2} />
            <h3 className="font-display text-sm font-semibold text-slate-100">
              Recommandations pour rester dans la capacité
            </h3>
          </div>
          <ul className="space-y-1.5">
            {recommendations.map((rec) => (
              <li key={rec.id} className="flex gap-2 text-xs text-slate-400">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-orange-300/70" />
                {rec.text}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
