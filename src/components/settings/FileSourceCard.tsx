import { FileSpreadsheet, FolderOpen, RefreshCw, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";

interface FileSourceCardProps {
  title: string;
  description: string;
  path: string | null;
  loading: boolean;
  error: string | null;
  lastReadAt: string | null;
  onPick: () => void;
  onClear: () => void;
  onRefresh: () => void;
}

export function FileSourceCard({
  title,
  description,
  path,
  loading,
  error,
  lastReadAt,
  onPick,
  onClear,
  onRefresh,
}: FileSourceCardProps) {
  const status = error ? "error" : path ? "ok" : "empty";

  return (
    <GlassCard className="flex flex-col gap-4">
      <SectionTitle icon={<FileSpreadsheet className="h-5 w-5" />} title={title} subtitle={description} />

      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Fichier source</p>
        <p className="mt-1 truncate font-mono text-sm text-slate-200" title={path ?? undefined}>
          {path ?? "Aucun fichier sélectionné"}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {status === "ok" && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Lecture OK
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" /> Erreur de lecture
          </span>
        )}
        {status === "empty" && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-500">
            Non configuré
          </span>
        )}
        {lastReadAt && (
          <span className="text-slate-600">
            Actualisé à {new Date(lastReadAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={onPick}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {path ? "Changer de fichier" : "Choisir un fichier"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!path || loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
        {path && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-400/10 hover:text-rose-300"
          >
            <XCircle className="h-3.5 w-3.5" />
            Retirer
          </button>
        )}
      </div>
    </GlassCard>
  );
}
