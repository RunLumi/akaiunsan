import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Empty legacy agency DB: every getter takes its reject branch. vi.mock the
// mysql package BEFORE importing the helper so this file gets its own
// instance wired to an always-empty connection.
const queries = [];
vi.mock('mysql', () => ({
  default: {
    createConnection: () => ({
      query: (sql, valuesOrCb, maybeCb) => {
        const cb = typeof valuesOrCb === 'function' ? valuesOrCb : maybeCb;
        queries.push(sql);
        cb(null, [], []);
      },
      connect: (cb) => cb && cb(null),
      end: (cb) => cb && cb(null),
    }),
  },
}));

// force the reject branches of the fetch-based driver picture download
const originalFetch = global.fetch;

import * as agencyData from '../../helpers/agencyData.ts';

beforeAll(() => {
  global.fetch = async () => ({ ok: false, status: 404 });
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('agencyData reject branches (empty legacy DB)', () => {
  it('getSuppoterFromAgency rejects with no rows', async () => {
    await expect(agencyData.getSuppoterFromAgency(1, 2)).rejects.toHaveProperty('message');
  });

  it('getSkillFromAgency rejects with no rows', async () => {
    await expect(agencyData.getSkillFromAgency(1, 2)).rejects.toHaveProperty('message');
  });

  it('getExperienceFromAgency rejects with no rows', async () => {
    await expect(agencyData.getExperienceFromAgency(1, 2)).rejects.toHaveProperty('message');
  });

  it('getMaidNannyList rejects with no rows', async () => {
    await expect(agencyData.getMaidNannyList()).rejects.toHaveProperty('message');
  });

  it('getAllStat rejects with no rows', async () => {
    await expect(agencyData.getAllStat()).rejects.toHaveProperty('message');
  });

  it('getDriverProfile rejects when the picture is missing', async () => {
    await expect(agencyData.getDriverProfile(999)).rejects.toHaveProperty('message');
  });
});
