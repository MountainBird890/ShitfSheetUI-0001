const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

let LOG_PATH;  // ★ 宣言だけ先にする

function log(msg) {
  if (!LOG_PATH) return;
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
}

let serverProcess = null;

function startServer() {
  // ★ app.whenReady()後なのでここで初期化
  LOG_PATH = path.join(
    process.env.PORTABLE_EXECUTABLE_DIR ?? app.getPath("userData"),
    "debug.log"
  );

  fs.writeFileSync(LOG_PATH, `=== START ===\n`);
  log(`isPackaged: ${app.isPackaged}`);
  log(`__dirname: ${__dirname}`);
  log(`resourcesPath: ${process.resourcesPath}`);
  log(`PORTABLE_EXECUTABLE_DIR: ${process.env.PORTABLE_EXECUTABLE_DIR}`);
  log(`execPath: ${process.execPath}`);

  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, "server.cjs")
    : path.join(__dirname, "../src/backend/domain/utils/server.ts");

  log(`serverPath: ${serverPath}`);
  log(`serverPath exists: ${fs.existsSync(serverPath)}`);

  const [cmd, args] = app.isPackaged
    ? ["node", [serverPath]]
    : [(process.platform === "win32" ? "tsx.cmd" : "tsx"), [serverPath]];

  log(`cmd: ${cmd}`);

  serverProcess = spawn(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, NODE_ENV: "production", RESOURCES_PATH: process.resourcesPath },
  });

  serverProcess.stdout?.on("data", (d) => log(`[stdout] ${d.toString().trim()}`));
  serverProcess.stderr?.on("data", (d) => log(`[stderr] ${d.toString().trim()}`));
  serverProcess.on("error", (err) => log(`[spawn error] ${err.message}`));
  serverProcess.on("exit", (code, signal) => log(`[exit] code=${code} signal=${signal}`));
}

function waitForServer(url, retries = 20, interval = 500) {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      http.get(url, (res) => { resolve(); })
        .on("error", () => {
          if (n <= 0) reject(new Error("Server did not start"));
          else setTimeout(() => check(n - 1), interval);
        });
    };
    check(retries);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  win.webContents.openDevTools();
  if (app.isPackaged) {
    win.loadURL(`file://${path.join(__dirname, "../dist/index.html").replace(/\\/g, "/")}`);
  } else {
    win.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(async () => {
  startServer();  // ★ LOG_PATH初期化はここで行われる
  log("startServer called, waiting for port 3000...");
  await waitForServer("http://localhost:3000/api/staff")
    .catch((err) => log(`[waitForServer failed] ${err.message}`));
  log("createWindow");
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});