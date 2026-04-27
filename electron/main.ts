import { app, BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serverProcess: ReturnType<typeof spawn> | null = null;

function startServer() {
  // Fastifyサーバーを子プロセスとして起動
  serverProcess = spawn("node", [
    path.join(__dirname, "../src/backend/domain/services/calenadr/server.ts")
  ], { stdio: "inherit" });
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

  // 開発時はViteのdev server、本番はビルド済みHTMLを開く
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
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