const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

let serverProcess = null;

function startServer() {
  const base = app.isPackaged ? process.resourcesPath : path.join(__dirname, "..");
  const tsxBin = process.platform === "win32" ? "tsx.cmd" : "tsx";
  const tsxPath = path.join(base, "node_modules/.bin", tsxBin);
  const serverPath = path.join(base, "src/backend/domain/utils/server.ts");

  const logPath = path.join(app.getPath("userData"), "debug.log");
  fs.writeFileSync(logPath, `base: ${base}\ntsxPath: ${tsxPath}\nserverPath: ${serverPath}\n`);

  serverProcess = spawn(tsxPath, [serverPath], { stdio: "inherit", shell: true });
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

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    win.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});