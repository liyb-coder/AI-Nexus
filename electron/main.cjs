/**
 * AI Nexus — Electron Main Process
 *
 * Responsibilities:
 * 1. Start the Node.js backend server as a child process
 * 2. Create the main BrowserWindow loading the React frontend
 * 3. Handle app lifecycle (dock, tray, quit)
 */

const { app, BrowserWindow, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// ===== Configuration =====
const BACKEND_PORT = 5173;
const FRONTEND_PORT = 3000;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;
let backendProcess = null;

// ===== Backend Process Management =====

function startBackend() {
  const backendScript = path.join(__dirname, '..', 'server', 'src', 'index.ts');

  if (isDev) {
    // Dev: run with tsx
    backendProcess = spawn('npx', ['tsx', backendScript], {
      cwd: path.join(__dirname, '..', 'server'),
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    // Prod: run compiled JS
    const backendDist = path.join(process.resourcesPath, 'server', 'index.js');
    backendProcess = spawn(process.execPath, [backendDist], {
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[backend:err] ${data.toString().trim()}`);
  });

  backendProcess.on('exit', (code) => {
    console.log(`[backend] Exited with code ${code}`);
    backendProcess = null;
  });
}

function waitForBackend(maxRetries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error('Backend failed to start'));
        return;
      }
      setTimeout(check, interval);
    };

    check();
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

// ===== Window Management =====

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'AI Nexus — 汇智台',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'fullscreen-ui',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Load built frontend
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ===== App Lifecycle =====

app.whenReady().then(async () => {
  console.log('[electron] Starting AI Nexus...');

  // 1. Start backend
  startBackend();

  // 2. Wait for backend to be ready
  try {
    await waitForBackend();
    console.log('[electron] Backend is ready');
  } catch (err) {
    console.error('[electron] Backend startup failed:', err.message);
    dialog.showErrorBox('启动失败', '后端服务未能启动，请检查是否已安装依赖。\n\ncd server && npm install');
    app.quit();
    return;
  }

  // 3. Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});
