import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { watchFile, unwatchFile } from "node:fs";
import { loadSettings, saveSettings } from "./settingsStore";
import { parseReceptionFile } from "./parsers/receptionParser";
import { parseExpeditionFile } from "./parsers/expeditionParser";
import type { FileKind, FlowsSettings } from "../src/types/flows";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

let mainWindow: BrowserWindow | null = null;
const watchedFiles = new Map<FileKind, string>();

function readData(kind: FileKind) {
  const settings = loadSettings();
  const filePath = kind === "reception" ? settings.receptionPath : settings.expeditionPath;
  if (!filePath) {
    return { ok: false, data: null, error: "Aucun fichier configuré." };
  }
  return kind === "reception" ? parseReceptionFile(filePath) : parseExpeditionFile(filePath);
}

function watch(kind: FileKind, filePath: string | null) {
  const previous = watchedFiles.get(kind);
  if (previous) unwatchFile(previous);
  watchedFiles.delete(kind);
  if (!filePath) return;

  watchedFiles.set(kind, filePath);
  watchFile(filePath, { interval: 1500 }, (curr, prev) => {
    if (curr.mtimeMs === prev.mtimeMs) return;
    mainWindow?.webContents.send("data:changed", kind);
  });
}

function registerIpcHandlers() {
  ipcMain.handle("settings:get", () => loadSettings());

  ipcMain.handle("settings:setPath", (_event, kind: FileKind, filePath: string | null) => {
    const settings = loadSettings();
    const next: FlowsSettings = {
      ...settings,
      [kind === "reception" ? "receptionPath" : "expeditionPath"]: filePath,
    };
    saveSettings(next);
    watch(kind, filePath);
    return next;
  });

  ipcMain.handle("dialog:pickFile", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "Fichiers Excel", extensions: ["xlsb", "xlsx", "xlsm", "xls", "csv"] },
        { name: "Tous les fichiers", extensions: ["*"] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("data:read", (_event, kind: FileKind) => readData(kind));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#05070d",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const settings = loadSettings();
  watch("reception", settings.receptionPath);
  watch("expedition", settings.expeditionPath);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
