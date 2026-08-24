import type { FluxAPI } from "../../electron/preload";

declare global {
  interface Window {
    flux: FluxAPI;
  }
}

export {};
