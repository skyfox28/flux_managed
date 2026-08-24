import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExpeditionData, FileKind, FlowsSettings, ParseOutcome, ReceptionData } from "../types/flows";

interface FlowState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  lastReadAt: string | null;
}

interface FlowsContextValue {
  settings: FlowsSettings;
  reception: FlowState<ReceptionData>;
  expedition: FlowState<ExpeditionData>;
  pickAndSetPath: (kind: FileKind) => Promise<void>;
  clearPath: (kind: FileKind) => Promise<void>;
  refresh: (kind: FileKind) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const initialFlowState = <T,>(): FlowState<T> => ({ data: null, error: null, loading: false, lastReadAt: null });

const FlowsContext = createContext<FlowsContextValue | null>(null);

export function FlowsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<FlowsSettings>({ receptionPath: null, expeditionPath: null });
  const [reception, setReception] = useState<FlowState<ReceptionData>>(initialFlowState);
  const [expedition, setExpedition] = useState<FlowState<ExpeditionData>>(initialFlowState);

  const applyOutcome = useCallback(<T,>(setState: React.Dispatch<React.SetStateAction<FlowState<T>>>, outcome: ParseOutcome<T>) => {
    setState({
      data: outcome.ok ? outcome.data : null,
      error: outcome.ok ? null : outcome.error,
      loading: false,
      lastReadAt: new Date().toISOString(),
    });
  }, []);

  const refresh = useCallback(
    async (kind: FileKind) => {
      if (kind === "reception") {
        setReception((prev) => ({ ...prev, loading: true }));
        applyOutcome(setReception, await window.flux.readReception());
      } else {
        setExpedition((prev) => ({ ...prev, loading: true }));
        applyOutcome(setExpedition, await window.flux.readExpedition());
      }
    },
    [applyOutcome],
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh("reception"), refresh("expedition")]);
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    window.flux.getSettings().then((loaded) => {
      if (cancelled) return;
      setSettings(loaded);
      if (loaded.receptionPath) refresh("reception");
      if (loaded.expeditionPath) refresh("expedition");
    });
    const unsubscribe = window.flux.onDataChanged((kind) => {
      refresh(kind);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickAndSetPath = useCallback(
    async (kind: FileKind) => {
      const path = await window.flux.pickFile();
      if (!path) return;
      const nextSettings = await window.flux.setPath(kind, path);
      setSettings(nextSettings);
      await refresh(kind);
    },
    [refresh],
  );

  const clearPath = useCallback(async (kind: FileKind) => {
    const nextSettings = await window.flux.setPath(kind, null);
    setSettings(nextSettings);
    if (kind === "reception") setReception(initialFlowState());
    else setExpedition(initialFlowState());
  }, []);

  const value = useMemo<FlowsContextValue>(
    () => ({ settings, reception, expedition, pickAndSetPath, clearPath, refresh, refreshAll }),
    [settings, reception, expedition, pickAndSetPath, clearPath, refresh, refreshAll],
  );

  return <FlowsContext.Provider value={value}>{children}</FlowsContext.Provider>;
}

export function useFlows(): FlowsContextValue {
  const ctx = useContext(FlowsContext);
  if (!ctx) throw new Error("useFlows must be used within FlowsProvider");
  return ctx;
}
