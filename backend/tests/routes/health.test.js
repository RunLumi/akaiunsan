import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import dbLoaded from '../../models/index.ts';
const db = dbLoaded.default ?? dbLoaded;

describe('GET /health', () => {
  it('reports status ok without requiring app_key auth when DB is up', async () => {
    vi.spyOn(db.sequelize, 'query').mockResolvedValueOnce([[{ 1: 1 }]]);
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      env: 'test',
      db: 'up',
    });
    expect(res.body.git).toBeDefined();
    expect(res.body.git.commit).toBeDefined();
    expect(res.body.build).toBeDefined();
    expect(res.body.build.timeAgo).toBeDefined();
    expect(res.body.uptime).toBeDefined();
    expect(res.body.uptime.human).toBeDefined();
  });

  it('reports status 503 with version metadata when DB is down', async () => {
    vi.spyOn(db.sequelize, 'query').mockImplementation(async (sql) => {
      if (typeof sql === 'string' && sql.includes('SELECT 1')) {
        throw new Error('Connection refused');
      }
      return [[{ 1: 1 }]];
    });
    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.db).toBe('down');
    expect(res.body.git).toBeDefined();
    expect(res.body.build).toBeDefined();
  });
});
