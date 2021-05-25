import {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  dialog,
  session,
  shell,
} from "electron";
import * as path from "path";
import * as child_process from "child_process";
import split2 from "split2";
import * as iconv from "iconv-lite";
import * as fs from "fs";
import { ImageFile } from "./types";
import pstree from "ps-tree";

function transformCliResults(results: string[][]): Promise<ImageFile[][]> {
  return Promise.all(
    results.map(
      (rr) =>
        Promise.all(
          rr.map(async (p): Promise<ImageFile | null> => {
            const nImg = nativeImage.createFromPath(p);
            const size = nImg.getSize();
            try {
              const stats = await fs.promises.stat(p);
              return {
                path: process.env.DEV_MODE === "server" ? nImg.toDataURL() : p,
                name: path.basename(p),
                width: size.width,
                height: size.height,
                birthtime: stats.birthtime,
                mtime: stats.mtime,
                size: stats.size,
              };
            } catch (e) {
              if (e.code === "ENOENT") {
                return null;
              }
              throw e;
            }
          })
        ).then((rr) => rr.filter((p) => p !== null)) as Promise<ImageFile[]>
    )
  );
}

function safeSetProgressBar(w: BrowserWindow, progress: number) {
  if (!w.isDestroyed()) {
    w.setProgressBar(progress);
  }
}

const cpCode = child_process
  .execSync("chcp", { encoding: "utf-8" })
  .match(/(\d+)/)![0];
let cli: child_process.ChildProcessWithoutNullStreams | null = null;
let cliChildren: readonly pstree.PS[] = [];
let results: string[][] = [];
ipcMain.on("start-cli", async (ev, dirPath, algo) => {
  try {
    const stat = await fs.promises.stat(dirPath);
    if (!stat.isDirectory()) {
      ev.reply("cli-error", { code: "isnotdirectory" });
      return;
    }
  } catch (e) {
    if (e.code === "ENOENT") {
      ev.reply("cli-error", { code: "enoent" });
    } else {
      ev.reply("cli-error", { code: "internal", error: e });
    }
    return;
  }

  let basepath = path.join(__dirname, "..");
  if (path.basename(basepath) === "app.asar") {
    basepath = path.join(basepath, "../../");
  }
  const cmd = path.join(basepath, "/cli/bin/gahi-cli.bat");
  console.log(cmd);
  cli = child_process.spawn("cmd.exe", ["/C", cmd, "dup", "-a", algo, dirPath]);
  setTimeout(() => {
    if (cli === null || cli.exitCode !== null) return;
    pstree(cli.pid, (err, children) => {
      if (err) {
        console.error(err);
        return;
      }
      cliChildren = children;
    });
  }, 1000);
  let errStr = "";
  let finished = 0;
  cli.stdout
    .pipe(iconv.decodeStream(`cp${cpCode}`))
    .pipe(split2())
    .on("data", (rd) => {
      let d;
      try {
        d = JSON.parse(rd);
      } catch (e) {
        errStr += rd;
        console.error(rd);
        return;
      }
      if (d.type === "index_creating") {
        finished++;
        d.finished = finished;
        ev.reply("cli-interm", d);
        safeSetProgressBar(mainWindow, d.finished / d.total);
      } else if (d.type === "finish") {
        results = d.results;
        ev.reply("cli-results", {
          imageFileCount: results.length,
          dirPath,
        });
        safeSetProgressBar(mainWindow, -1);
      } else {
        console.log(d);
      }
    })
    .on("error", (e) => console.error(e));
  cli.stderr.pipe(split2()).on("data", (d) => {
    errStr += d;
    console.error(d);
  });
  cli.on("exit", (code, signal) => {
    if (code !== 0) {
      if (errStr.includes("ERROR: JAVA_HOME")) {
        ev.reply("cli-error", { code: "javaisnotinstalled" });
      } else {
        ev.reply("cli-error", { code: "internal", error: errStr });
      }
      console.error(`code: ${code}\nsignal: ${signal}`);
      safeSetProgressBar(mainWindow, -1);
    }
  });
});

ipcMain.handle("fetch-image-files", (_e, offset: any, count: any) => {
  if (offset + 1 > results.length) {
    return [];
  }
  const r: string[][] = [];
  for (let i = offset; i < offset + count && i < results.length; i++) {
    r.push(results[i]);
  }
  return transformCliResults(r);
});

ipcMain.handle("choose-directory", () => {
  return dialog.showOpenDialog({ properties: ["openDirectory"] });
});

ipcMain.handle("move-to-trash", (_e, path: any) => {
  return shell.moveItemToTrash(path);
});

ipcMain.handle(
  "delete-dialog",
  (_e, message: any, detail: any, ok: any, cancel: any) => {
    const res = dialog.showMessageBoxSync({
      type: "none",
      title: "gahi",
      message,
      detail,
      buttons: [ok, cancel],
    });
    return res === 0;
  }
);

let mainWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
    height: 768,
    width: 1024,
  });
  mainWindow.setMenuBarVisibility(false);

  // mainWindow.loadURL("http://localhost:8080/index.html");
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  session
    .fromPartition("default")
    .setPermissionRequestHandler((_webContents, _permission, permCallback) => {
      permCallback(false);
    });
}

app.on("web-contents-created", (event) => {
  event.preventDefault();
});

app.on("before-quit", () => {
  if (cli !== null && cli.exitCode === null) {
    cliChildren.forEach((p) => {
      process.kill(parseInt(p.PID));
    });
    process.kill(cli.pid);
  }
});

// Template for Mac OS
app.on("ready", () => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
