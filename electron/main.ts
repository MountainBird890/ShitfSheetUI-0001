import electron from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const { app, BrowserWindow } = electron;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serverProcess: ReturnType<typeof spawn> | null = null;

function startServer() {
  const serverPath = path.join(
    app.isPackaged ? process.resourcesPath : path.join(__dirname, ".."),
    "src/backend/domain/utils/server.ts"
  );

  const tsxPath = path.join(
    app.isPackaged ? process.resourcesPath : path.join(__dirname, ".."),
    "node_modules/.bin/tsx"
  );

  // ログファイルに書き出す
  const logPath = path.join(app.getPath("userData"), "debug.log");
  fs.writeFileSync(logPath, `serverPath: ${serverPath}\ntsxPath: ${tsxPath}\n`);

  serverProcess = spawn(tsxPath, [serverPath], {
    stdio: "inherit",
    shell: true,
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  serverProcess?.kill();
  if (process.platform !== "darwin") app.quit();
});