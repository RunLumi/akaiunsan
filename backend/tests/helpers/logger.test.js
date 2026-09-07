import { describe, it, expect } from 'vitest';
import { Writable } from 'stream';

// helpers/logger.ts — pino instance with redaction of auth material.
import { logger, makeLogger } from '../../helpers/logger.ts';

function capture(loggerInstance) {
  const lines = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(JSON.parse(chunk.toString()));
      cb();
    },
  });
  return { lines, stream };
}

describe('helpers/logger', () => {
  it('default logger is a pino instance writing JSON lines to stdout', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.child).toBe('function');
    expect(logger.level).toBeTruthy();
  });

  it('redacts authorization and app_key headers from logged objects', async () => {
    const { lines, stream } = capture();
    const testLogger = makeLogger({ level: 'info', stream });
    testLogger.info({ req: { headers: { authorization: 'Bearer topsecret', app_key: 'k' } } }, 'req');
    await new Promise((r) => stream.end(r));
    const raw = lines.map((l) => JSON.stringify(l)).join('\n');
    expect(raw).not.toContain('topsecret');
    expect(raw).toContain('[Redacted]');
  });

  it('respects the configured level (debug suppressed at info)', async () => {
    const { lines, stream } = capture();
    const testLogger = makeLogger({ level: 'info', stream });
    testLogger.debug('should not appear');
    testLogger.info('should appear');
    await new Promise((r) => stream.end(r));
    expect(lines).toHaveLength(1);
    expect(lines[0].msg).toBe('should appear');
  });

  it('makeLogger child loggers carry bindings', async () => {
    const { lines, stream } = capture();
    const base = makeLogger({ level: 'info', stream });
    const child = base.child({ module: 'auth' });
    child.warn('hi');
    await new Promise((r) => stream.end(r));
    expect(lines[0].module).toBe('auth');
  });
});
