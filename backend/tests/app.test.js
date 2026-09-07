import { describe, it, expect, vi, afterAll } from 'vitest';
import app from '../app';

// startServer: exported so pm2/dev entry and tests share one code path.
describe('startServer', () => {
  const servers = [];

  afterAll(() => {
    for (const s of servers) {
      try { s.close(); } catch { /* already closed */ }
    }
  });

  it('binds the requested port, prints the banner and env, and closes', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { startServer } = await import('../app');

    const server = startServer(0); // ephemeral port
    servers.push(server);

    // wait for the listen callback
    await new Promise((resolve) => server.on('listening', resolve));

    const logged = logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(logged).toContain('port: 0');
    expect(logged).toContain(`env: ${process.env.NODE_ENV}`);
    expect(logged).toContain('run datetime:');
    logSpy.mockRestore();
  });

  it('exports the express app for supertest', async () => {
    expect(typeof app).toBe('function');
    expect(typeof app.listen).toBe('function');
  });
});
