import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('GET /health', () => {
  it('reports status ok without requiring app_key auth', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.env).toBe('test');
    expect(res.body.db).toBe('up');
  });
});
