const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

let serverProcess = null;

// ★ logPathをグローバルで定義（起動直後から使えるように）
let logPath;

function startServer() {
  logPath = path.join(app.getPath("userData"), "debug.log");

  // ★ まず現在の全パス情報を書き出す
  fs.writeFileSync(logPath, [
    `isPackaged: ${app.isPackaged}`,
    `__dirname: ${__dirname}`,
    `resourcesPath: ${process.resourcesPath}`,
    `execPath: ${process.execPath}`,
    `cwd: ${process.cwd()}`,
  ].join("\n") + "\n");

  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, "server.cjs")
    : path.join(__dirname, "../src/backend/domain/utils/server.ts");

  const [cmd, args] = app.isPackaged
    ? ["node", [serverPath]]
    : [(process.platform === "win32" ? "tsx.cmd" : "tsx"), [serverPath]];

  fs.appendFileSync(logPath, `cmd: ${cmd}\nargs: ${JSON.stringify(args)}\nserverPath exists: ${fs.existsSync(serverPath)}\n`);

  serverProcess = spawn(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],  // ★ pipeに変更してstdout/stderrをキャプチャ
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      RESOURCES_PATH: process.resourcesPath,
    }
  });

  // ★ サーバーの出力をログに記録
  serverProcess.stdout?.on("data", (d) => fs.appendFileSync(logPath, `[stdout] ${d}`));
  serverProcess.stderr?.on("data", (d) => fs.appendFileSync(logPath, `[stderr] ${d}`));
  serverProcess.on("error", (err) => fs.appendFileSync(logPath, `[spawn error] ${err.message}\n`));
  serverProcess.on("exit", (code) => fs.appendFileSync(logPath, `[exit] code: ${code}\n`));
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
  startServer();
  await waitForServer("http://localhost:3000/api/staff")
    .catch((err) => {
      if (logPath) fs.appendFileSync(logPath, `[waitForServer failed] ${err.message}\n`);
      console.error("Fastify起動タイムアウト");
    });
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});