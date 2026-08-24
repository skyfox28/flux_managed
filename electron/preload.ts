import { contextBridge, ipcRenderer } from "electron";
import type { ExpeditionData, FileKind, FlowsSettings, ParseOutcome, ReceptionData } from "../src/types/flows";

const api = {
  getSettings: (): Promise<FlowsSettings> => ipcRenderer.invoke("settings:get"),
  setPath: (kind: FileKind, filePath: string | null): Promise<FlowsSettings> =>
    ipcRenderer.invoke("settings:setPath", kind, filePath),
  pickFile: (): Promise<string | null> => ipcRenderer.invoke("dialog:pickFile"),
  readReception: (): Promise<ParseOutcome<ReceptionData>> => ipcRenderer.invoke("data:read", "reception"),
  readExpedition: (): Promise<ParseOutcome<ExpeditionData>> => ipcRenderer.invoke("data:read", "expedition"),
  onDataChanged: (callback: (kind: FileKind) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, kind: FileKind) => callback(kind);
    ipcRenderer.on("data:changed", listener);
    return () => ipcRenderer.removeListener("data:changed", listener);
  },
};

contextBridge.exposeInMainWorld("flux", api);

export type FluxAPI = typeof api;
