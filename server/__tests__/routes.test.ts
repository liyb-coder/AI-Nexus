import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import { getDatabase, closeDatabase } from '../src/db/database.js';

// Initialize the database ONCE before importing routes
// This ensures the DB is ready before any route handler tries to use it
getDatabase();

import authRoutes from '../src/routes/auth.js';
import modelRoutes from '../src/routes/models.js';
import skillRoutes from '../src/routes/skills.js';
import taskRoutes from '../src/routes/tasks.js';
import materialRoutes from '../src/routes/materials.js';
import mcpRoutes from '../src/routes/mcp.js';

import request from 'supertest';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/models', modelRoutes);
  app.use('/api/skills', skillRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/materials', materialRoutes);
  app.use('/api/mcp', mcpRoutes);
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('API Routes', () => {
  const app = createTestApp();

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /api/health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return auth status with accounts', async () => {
      const res = await request(app).get('/api/auth/status');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('accounts');
      expect(res.body.data).toHaveProperty('authenticated');
      expect(res.body.data).toHaveProperty('keyFound');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.accounts)).toBe(true);
    });
  });

  describe('GET /api/models', () => {
    it('should return model list', async () => {
      const res = await request(app).get('/api/models');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('PATCH /api/models/:id/toggle', () => {
    it('should toggle model enabled state', async () => {
      const res = await request(app).patch('/api/models/kimi/toggle');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('GET /api/skills', () => {
    it('should return skill list', async () => {
      const res = await request(app).get('/api/skills');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return task list (empty initially)', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/materials', () => {
    it('should create a material', async () => {
      const res = await request(app)
        .post('/api/materials')
        .send({
          content: 'Test material content',
          sourceModel: 'test-model',
          sourceModelColor: '#ff0000',
        });
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.content).toBe('Test material content');
    });

    it('should reject empty content', async () => {
      const res = await request(app)
        .post('/api/materials')
        .send({ content: '' });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('GET /api/mcp', () => {
    it('should return MCP server list', async () => {
      const res = await request(app).get('/api/mcp');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const entry = res.body.data[0];
        expect(Array.isArray(entry.args)).toBe(true);
        expect(typeof entry.env).toBe('object');
        expect(Array.isArray(entry.tools)).toBe(true);
      }
    });
  });

  describe('POST /api/skills', () => {
    it('should create a new skill', async () => {
      const res = await request(app)
        .post('/api/skills')
        .send({
          id: 'test_skill_001',
          name: '测试技能',
          prompt: '这是一个测试技能的提示词',
          category: 'custom',
          tags: ['test', 'demo'],
        });
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe('测试技能');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/skills')
        .send({ name: 'No ID' });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });
});
