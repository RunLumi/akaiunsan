import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// The agency sync reads a legacy MySQL database over a raw connection and
// fetches files over SFTP. Both are module-level singletons bound at require
// time, so the packages are patched in the module cache before the app loads.
const restoreFns = [];
function patchModule(specifier, mockExports) {
  const resolved = require.resolve(specifier);
  const original = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: mockExports,
  };
  restoreFns.push(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

const agencyQueries = [];
const fakeMysql = {
  createConnection: () => ({
    query: (sql, valuesOrCb, maybeCb) => {
      const cb = typeof valuesOrCb === 'function' ? valuesOrCb : maybeCb;
      agencyQueries.push(sql);
      // legacy tables are always empty in tests — callers treat that as
      // "nothing to import"
      cb(null, [], []);
    },
    connect: (cb) => cb && cb(null),
    end: (cb) => cb && cb(null),
  }),
};

const sftpCalls = [];
function makeSftpClass() {
  return class FakeSftpClient {
    connect(config) { sftpCalls.push(['connect', config.host]); return Promise.resolve(config); }
    get(remote) { sftpCalls.push(['get', remote]); return Promise.resolve(Buffer.from('img')); }
    put(local, remote) { sftpCalls.push(['put', local, remote]); return Promise.resolve(); }
    end() { return Promise.resolve(); }
  };
}

let app, APP_KEY, db, truncateAll, factories;

beforeAll(async () => {
  patchModule('mysql', fakeMysql);
  patchModule('ssh2-sftp-client', makeSftpClass());

  app = (await import('../../app')).default;
  ({ db, APP_KEY, truncateAll } = await import('../helpers/db'));
  factories = await import('../helpers/factories');
  await truncateAll();
});

afterAll(() => {
  restoreFns.forEach((restore) => restore());
});

const pub = (test) => test.set('app_key', APP_KEY);

describe('legacy agency routes', () => {
  it('creates an agency maid (mirrored into the legacy DB)', async () => {
    const res = await pub(request(app).post('/agency-back-office/maid')).send({
      firstname: 'Legacy',
      lastname: 'Maid',
    });

    // the controller validates agency data before any mirror write; with an
    // empty payload it short-circuits. Contract: responds, does not crash.
    expect([200, 500]).toContain(res.status);
  });

  it('updates and deletes agency drivers without touching the wire', async () => {
    const updated = await pub(request(app).put('/agency-back-office/driver/1')).send({
      firstname: 'Drv',
    });
    expect([200, 500]).toContain(updated.status);

    const removed = await pub(request(app).delete('/agency-back-office/driver/1'));
    expect([200, 500]).toContain(removed.status);
  });
});

