const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// ── Single instance lock ──
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); return; }

let mainWindow = null;
let backendProcess = null;
let frontendServer = null;
const isDev = !app.isPackaged;
const FRONTEND_PORT = 3456;

// ── Simple static file server (for production, avoids file:// CORS) ──
function startFrontendServer() {
  const distDir = path.join(__dirname, '..', 'dist');
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.json': 'application/json', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
  };

  frontendServer = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  frontendServer.listen(FRONTEND_PORT, '127.0.0.1', () => {
    console.log(`[main] Frontend server http://127.0.0.1:${FRONTEND_PORT}`);
  });
}

// ── Start backend server ──
function startBackend() {
  const backendEntry = isDev
    ? path.join(__dirname, '..', 'server', 'dist', 'index.js')
    : path.join(process.resourcesPath, 'server', 'dist', 'index.js');

  if (!fs.existsSync(backendEntry)) {
    dialog.showErrorBox('启动失败', isDev ? '请先: cd server && npm run build' : '后端文件缺失');
    app.quit(); return;
  }

  backendProcess = spawn('node', [backendEntry], {
    cwd: path.dirname(backendEntry),
    env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (d) => console.log('[backend]', d.toString().trim()));
  backendProcess.stderr.on('data', (d) => console.error('[backend]', d.toString().trim()));
  backendProcess.on('error', (err) => {
    dialog.showErrorBox('启动失败', `后端无法启动: ${err.message}\ncd server && npm install`);
    app.quit();
  });
  backendProcess.on('exit', (code) => { console.log('[main] Backend exit:', code); backendProcess = null; });
}

// ── Wait for backend ──
function waitForBackend(retries = 15) {
  let attempts = 0;
  function check() {
    attempts++;
    http.get('http://127.0.0.1:5173/api/health', (res) => {
      if (res.statusCode === 200) { console.log('[main] Backend ready'); createWindow(); }
      else if (attempts < retries) setTimeout(check, 600);
      else { dialog.showErrorBox('启动超时', '后端启动超时'); app.quit(); }
    }).on('error', () => {
      if (attempts < retries) setTimeout(check, 600);
      else { dialog.showErrorBox('启动超时', '后端无响应\ncd server && npm install'); app.quit(); }
    }).setTimeout(3000, function() { this.destroy(); if (attempts < retries) setTimeout(check, 600); });
  }
  check();
}

// ── Create window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    title: 'AI Nexus 汇智', show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const url = isDev ? 'http://localhost:3000' : `http://127.0.0.1:${FRONTEND_PORT}`;
  mainWindow.loadURL(url);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ──
app.on('second-instance', () => {
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
});

app.whenReady().then(() => {
  if (!isDev) startFrontendServer();
  startBackend();
  setTimeout(waitForBackend, 1500);
});

app.on('window-all-closed', () => {
  if (frontendServer) { frontendServer.close(); frontendServer = null; }
  if (backendProcess) { backendProcess.kill('SIGTERM'); backendProcess = null; }
  app.quit();
});

app.on('before-quit', () => {
  if (frontendServer) { frontendServer.close(); frontendServer = null; }
  if (backendProcess) { backendProcess.kill('SIGTERM'); backendProcess = null; }
});
