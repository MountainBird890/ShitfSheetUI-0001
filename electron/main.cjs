const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

let serverProcess = null;

function startServer() {
  const base = app.isPackaged ? process.resourcesPath : path.join(__dirname, "..");  // ✅ ビルド済みJSを node で実行
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, "server.cjs")   // ビルド後
    : path.join(__dirname, "../src/backend/domain/utils/server.ts"); // 開発時

  const command = app.isPackaged
    ? process.execPath.replace("介護勤務管理.exe", "resources/node/node.exe")
    : (process.platform === "win32" ? "tsx.cmd" : "tsx");

  // パッケージ済みはnodeで直接実行、開発時はtsxで実行
  const [cmd, args] = app.isPackaged
    ? ["node", [serverPath]]
    : [(process.platform === "win32" ? "tsx.cmd" : "tsx"), [serverPath]];


  const logPath = path.join(app.getPath("userData"), "debug.log");
  fs.writeFileSync(logPath, `cmd: ${cmd}\nargs: ${args}\nbase: ${base}\n`);

  serverProcess = spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      RESOURCES_PATH: process.resourcesPath,
    }
  });

  serverProcess.on("error", (err) => {
    fs.appendFileSync(logPath, `\nserver error: ${err.message}`);
  });
}

// サーバー起動を待ってからウィンドウを開く
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
  await waitForServer("http://localhost:3000/api/staff")  // 起動待ち
    .catch(() => console.error("Fastify起動タイムアウト"));

  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});