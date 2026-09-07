import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Fresh util instance wired to a controllable mysql connection + sftp stub.
// Covers the agency SQL wrappers and the sftp upload success path.
let queryHandler = (sql, cb) => cb(null, [], []);

vi.mock('mysql', () => ({
  default: {
    createConnection: () => ({
      query: (sql, valuesOrCb, maybeCb) => {
        const cb = typeof valuesOrCb === 'function' ? valuesOrCb : maybeCb;
        queryHandler(sql, cb);
      },
      connect: (cb) => cb && cb(null),
      end: (cb) => cb && cb(null),
    }),
  },
}));

vi.mock('ssh2-sftp-client', () => ({
  default: class FakeSftp {
    connect(cfg) { return Promise.resolve(cfg); }
    put(local, remote) {
      if (String(remote).includes('boom')) return Promise.reject(new Error('sftp put failed'));
      return Promise.resolve();
    }
    end() { return Promise.resolve(); }
  },
}));

import * as util from '../../helpers/util.ts';

describe('helpers/util agency SQL wrappers (mocked connection)', () => {
  it('findOnAgency resolves rows', async () => {
    queryHandler = (sql, cb) => cb(null, [{ maid_ID: '00000000001' }], []);
    const rows = await util.findOnAgency('maid', 'maid_ID', 'maid_ID');
    expect(rows).toEqual([{ maid_ID: '00000000001' }]);
  });

  it('findOnAgency rejects when empty', async () => {
    queryHandler = (sql, cb) => cb(null, [], []);
    await expect(util.findOnAgency('maid', 'maid_ID', 'maid_ID')).rejects.toHaveProperty('message');
  });

  it('createOnAgency resolves on success and rejects on error', async () => {
    queryHandler = (sql, cb) => cb(null, [], []);
    await expect(util.createOnAgency('maid', { name: 'x' })).resolves.toBe(true);
    queryHandler = (sql, cb) => cb(new Error('insert failed'), null, []);
    await expect(util.createOnAgency('maid', { name: 'x' })).rejects.toThrow('insert failed');
  });

  it('updateOnAgency / removeOnAgency resolve and reject', async () => {
    queryHandler = (sql, cb) => cb(null, [], []);
    await expect(util.updateOnAgency('maid', 'name = :n', 'maid_ID = 1', { n: 'x' })).resolves.toBe(true);
    await expect(util.removeOnAgency('maid', 'maid_ID = 1', {})).resolves.toBe(true);
    queryHandler = (sql, cb) => cb(new Error('update failed'), null, []);
    await expect(util.updateOnAgency('maid', 'name = :n', 'maid_ID = 1', {})).rejects.toThrow('update failed');
    queryHandler = (sql, cb) => cb(new Error('delete failed'), null, []);
    await expect(util.removeOnAgency('maid', 'maid_ID = 1', {})).rejects.toThrow('delete failed');
  });

  it('bulkCreateOnAgency resolves after all inserts and rejects mid-failure', async () => {
    queryHandler = (sql, cb) => cb(null, [], []);
    await expect(util.bulkCreateOnAgency('maid', [{ name: 'a' }, { name: 'b' }])).resolves.toBe(true);
    queryHandler = (sql, cb) => cb(new Error('batch failed'), null, []);
    await expect(util.bulkCreateOnAgency('maid', [{ name: 'a' }])).rejects.toHaveProperty('message');
  });

  it('uploadSupporterProfileImage succeeds through the mocked sftp', async () => {
    await expect(util.uploadSupporterProfileImage('ok.jpg')).resolves.toBe(true);
  });
});
