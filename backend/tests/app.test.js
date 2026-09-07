import { describe, it, expect, afterAll } from 'vitest';
import { Writable } from 'stream';
import request from 'supertest';
import app from '../app';

// startServer: exported so pm2/dev entry and tests share one code path.
describe('startServer', () => {
  const servers = [];

  afterAll(() => {
    for (const s of servers) {
      try { s.close(); } catch { /* already closed */ }
    }
  });

  it('startServer binds the port and emits the structured boot line', async () => {
    const lines = [];
    const stream = new Writable({
      write(chunk, _enc, cb) { lines.push(JSON.parse(chunk.toString())); cb(); },
    });

    const { makeLogger } = await import('../helpers/logger.ts');
    const bootLogger = makeLogger({ level: 'info', stream });

    const { startServer } = await import('../app');
    const server = startServer(0, bootLogger); // ephemeral port, injected logger
    servers.push(server);

    await new Promise((resolve) => server.on('listening', resolve));
    await new Promise((r) => setTimeout(r, 20)); // pino flushes async

    expect(lines.length).toBeGreaterThanOrEqual(1);
    const msg = lines[0].msg;
    expect(msg).toContain('backend started');
    expect(msg).toContain('port: 0');
    expect(msg).toContain(`env: ${process.env.NODE_ENV}`);
    server.close();
  });

  it('exports the express app for supertest', () => {
    expect(typeof app).toBe('function');
    expect(typeof app.listen).toBe('function');
  });
});
