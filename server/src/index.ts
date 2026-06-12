import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config.js';
import { getDatabase, initAutoSave, closeDatabase, getDbPath } from './db/database.js';
import { createWSServer } from './ws/handler.js';

// Routes
import authRoutes from './routes/auth.js';
import modelRoutes from './routes/models.js';
import skillRoutes from './routes/skills.js';
import taskRoutes from './routes/tasks.js';
import materialRoutes from './routes/materials.js';
import mcpRoutes from './routes/mcp.js';
import settingsRoutes from './routes/settings.js';

import { detectorRegistry } from './detectors/index.js';

// ===== Startup =====

console.log('╔══════════════════════════════════════╗');
console.log('║        AI Nexus — Server v1.0.0      ║');
console.log('║   多 AI 协作操作工作台 · 后端服务     ║');
console.log('╚══════════════════════════════════════╝');

// 1. Initialize database (async — sql.js loads WASM)
const db = await getDatabase();
initAutoSave(db);
console.log(`[init] 数据库: ${getDbPath()}`);

// 2. Express app
const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// 3. API routes
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', settingsRoutes); // also mount at /api for CLI execute etc.

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now(), uptime: process.uptime() });
});

// 4. HTTP + WebSocket server
const server = createServer(app);
const wss = createWSServer(server);

// 5. Run auth detection on startup
detectorRegistry.scanAll().then((accounts) => {
  const authenticated = accounts.filter((a) => a.status === 'authenticated').length;
  const keyFound = accounts.filter((a) => a.status === 'key_found').length;
  const notFound = accounts.filter((a) => a.status === 'not_found').length;

  console.log(`[auth] 账号检测完成:`);
  console.log(`  ✅ 已认证: ${authenticated}`);
  console.log(`  🔑 检测到 API Key: ${keyFound}`);
  console.log(`  ❌ 未找到: ${notFound}`);

  for (const acc of accounts) {
    if (acc.status === 'authenticated' || acc.status === 'key_found') {
      console.log(`  · ${acc.provider} — ${acc.source}${acc.displayName ? ` (${acc.displayName})` : ''}`);
    }
  }
});

// 6. Start listening
server.listen(config.port, config.host, () => {
  console.log(`\n[init] 服务已启动: http://${config.host}:${config.port}`);
  console.log(`[init] WebSocket: ws://${config.host}:${config.port}/ws`);
  console.log(`[init] 按 Ctrl+C 停止服务\n`);
});

// 7. Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[shutdown] 正在关闭...');
  wss.close();
  server.close();
  closeDatabase();
  console.log('[shutdown] 已关闭');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[shutdown] 收到 SIGTERM，正在关闭...');
  wss.close();
  server.close();
  closeDatabase();
  process.exit(0);
});
