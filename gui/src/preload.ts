import { ipcRenderer, contextBridge } from "electron";
import { Gahi } from "./types";

const gahi: Gahi = {
  chooseDirectory: () => {
    return ipcRenderer.invoke("choose-directory");
  },
  moveToTrash: (path: string) => {
    return ipcRenderer.invoke("move-to-trash", path);
  },
  deleteDialog: (
    message: string,
    detail: string,
    ok: string,
    cancel: string
  ) => {
    return ipcRenderer.invoke("delete-dialog", message, detail, ok, cancel);
  },
  cli: {
    start: (dirpath: string, algo: string) =>
      ipcRenderer.send("start-cli", dirpath, algo),
    addIntermListenser: (listener: (e: any, d: any) => void) =>
      ipcRenderer.on("cli-interm", listener),
    removeIntermListenser: (listener: (e: any, d: any) => void) =>
      ipcRenderer.removeListener("cli-interm", listener),
    addResultsListenser: (listener: (e: any, d: any) => void) =>
      ipcRenderer.on("cli-results", listener),
    removeResultsListenser: (listener: (e: any, d: any) => void) =>
      ipcRenderer.removeListener("cli-results", listener),
    addErrorListenser: (listener: (e: any, d: any) => void) =>
      ipcRenderer.on("cli-error", listener),
    removeErrorListenser: (listener: (e: any, d: any) => void) =>
      ipcRenderer.removeListener("cli-error", listener),
    fetchImagefiles: (offset: number, count: number) =>
      ipcRenderer.invoke("fetch-image-files", offset, count),
  },
};

contextBridge.exposeInMainWorld("gahi", gahi);
