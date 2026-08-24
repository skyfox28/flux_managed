import { app } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { FlowsSettings } from "../src/types/flows";

const DEFAULT_SETTINGS: FlowsSettings = {
  receptionPath: null,
  expeditionPath: null,
};

function settingsFilePath(): string {
  return path.join(app.getPath("userData"), "flux-settings.json");
}

export function loadSettings(): FlowsSettings {
  const file = settingsFilePath();
  if (!existsSync(file)) return { ...DEFAULT_SETTINGS };
  try {
    const raw = JSON.parse(readFileSync(file, "utf-8"));
    return {
      receptionPath: typeof raw.receptionPath === "string" ? raw.receptionPath : null,
      expeditionPath: typeof raw.expeditionPath === "string" ? raw.expeditionPath : null,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: FlowsSettings): void {
  const dir = app.getPath("userData");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(settingsFilePath(), JSON.stringify(settings, null, 2), "utf-8");
}
