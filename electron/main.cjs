const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Single instance lock ──
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}

let mainWindow = null;
let backendProcess = null;
const isDev = !app.isPackaged;

// ── Start backend server ──
function startBackend() {
  const backendEntry = isDev
    ? path.join(__dirname, '..', 'server', 'dist', 'index.js')
    : path.join(process.resourcesPath, 'server', 'dist', 'index.js');

  console.log('[main] Backend path:', backendEntry);

  if (!fs.existsSync(backendEntry)) {
    const msg = isDev
      ? '后端未编译。请先运行: cd server && npm run build'
      : '后端文件缺失，请重新安装应用。';
    dialog.showErrorBox('启动失败', msg);
    app.quit();
    return;
  }

  try {
    backendProcess = spawn(process.execPath, [backendEntry], {
      cwd: path.dirname(backendEntry),
      env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    backendProcess.stdout.on('data', (data) => {
      console.log('[backend]', data.toString().trim());
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('[backend]', data.toString().trim());
    });

    backendProcess.on('error', (err) => {
      console.error('[main] Backend spawn error:', err.message);
      dialog.showErrorBox(
        '启动失败',
        `后端服务无法启动: ${err.message}\n\n请确保已安装依赖: cd server && npm install`
      );
      app.quit();
    });

    backendProcess.on('exit', (code) => {
      console.log('[main] Backend exited with code:', code);
      backendProcess = null;
    });
  } catch (err) {
    dialog.showErrorBox('启动失败', `无法启动后端: ${err.message}`);
    app.quit();
  }
}

// ── Wait for backend to be ready ──
function waitForBackend(retries = 10) {
  const http = require('http');
  let attempts = 0;

  function check() {
    attempts++;
    const req = http.get('http://127.0.0.1:5173/api/health', (res) => {
      if (res.statusCode === 200) {
        console.log('[main] Backend ready');
        createWindow();
      } else if (attempts < retries) {
        setTimeout(check, 500);
      } else {
        dialog.showErrorBox('启动超时', '后端服务启动超时，请重试。');
        app.quit();
      }
    });
    req.on('error', () => {
      if (attempts < retries) {
        setTimeout(check, 500);
      } else {
        dialog.showErrorBox('启动超时', '后端服务无响应。请确认已安装依赖: cd server && npm install');
        app.quit();
      }
    });
    req.setTimeout(2000, () => {
      req.destroy();
      if (attempts < retries) {
        setTimeout(check, 500);
      }
    });
  }

  check();
}

// ── Create main window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'AI Nexus 汇智',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load frontend
  const frontendPath = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;

  console.log('[main] Loading:', frontendPath);
  mainWindow.loadURL(frontendPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ──
app.on('second-instance', () => {
  // Someone tried to run a second instance — focus existing window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  startBackend();
  // Give backend a moment to start, then wait for health check
  setTimeout(waitForBackend, 1000);
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
});
