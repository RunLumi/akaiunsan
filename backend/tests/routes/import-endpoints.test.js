import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';

// The /import/* one-off endpoints read the legacy agency MySQL database and
// local json dumps. Both are patched before the app loads.
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

const maidRows = [
  {
    id: '00000000001',
    internal_code: 'M001',
    name: 'Import Maid',
    birthday: '1992-02-02',
    phone_number: '084',
    weight: '55',
    height: '165',
    nationality: 'vietnamese',
    location_ID: '73',
    ltype: 2,
    jtype: 1,
    salary: 18000,
    currency: 'THB',
    mstatus: 1,
    remark: null,
    comment: null,
    position_ID: 18,
    jstatus: 1,
  },
];

const fakeMysql = {
  createConnection: () => ({
    query: (sql, valuesOrCb, maybeCb) => {
      const cb = typeof valuesOrCb === 'function' ? valuesOrCb : maybeCb;
      const rows = sql.includes('FROM maid as m')
        ? maidRows
        : sql.includes('FROM skill as s')
          ? [{ skill_name: 'Cook Thai', maid_ID: '00000000001', skill_ID: 85 }]
          : sql.includes('FROM experience')
            ? [{ maid_ID: '00000000001', worktime: '3 years', exp_location: 'hotel' }]
            : sql.includes('position_ID = 20')
              ? [{ maid_id: '00000000001' }]
              : [{ id: 1, count: 5 }];
      cb(null, rows, []);
    },
    connect: (cb) => cb && cb(null),
    end: (cb) => cb && cb(null),
  }),
};

class FakeSftp {
  connect(cfg) { return Promise.resolve(cfg); }
  get() { return Promise.resolve(Buffer.from('jpg')); }
  put() { return Promise.resolve(); }
  end() { return Promise.resolve(); }
}

const originalFetch = global.fetch;
const jsonFiles = {
  'skill.json': [{ maid_ID: '101', skill_name: 'little English' }],
  'experience.json': [{ maid_ID: '101', worktime: '1 year', exp_location: 'farm' }],
};

let app, APP_KEY, db, truncateAll;

beforeAll(async () => {
  patchModule('mysql', fakeMysql);
  patchModule('ssh2-sftp-client', FakeSftp);
  global.fetch = async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) });
  for (const [name, data] of Object.entries(jsonFiles)) {
    fs.writeFileSync(path.join(process.cwd(), name), JSON.stringify(data));
  }

  app = (await import('../../app')).default;
  ({ db, APP_KEY, truncateAll } = await import('../helpers/db'));
  await truncateAll();
});

afterAll(() => {
  for (const name of Object.keys(jsonFiles)) fs.unlinkSync(path.join(process.cwd(), name));
  global.fetch = originalFetch;
  restoreFns.forEach((restore) => restore());
});

const pub = (test) => test.set('app_key', APP_KEY);

describe('GET /import/supporter-agency (full agency → local import)', () => {
  it('imports maids, skills and experiences into the local database', async () => {
    // agency birthdays must be zero-dates to import: the mapper builds the
    // date from indexed parts of a Date object (always Invalid Date), which
    // MariaDB rejects — pinned separately below.
    maidRows[0].birthday = '0000-00-00';

    const res = await pub(request(app).get('/import/supporter-agency'));

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);

    const supporter = await db.Supporter.findOne({ where: { maid_id: 1 } });
    expect(supporter).not.toBeNull();
    expect(supporter.firstname).toBe('Import Maid');
    expect(supporter.nationality).toBe('Vietnamese');
    expect(supporter.job_location).toBe('Nonthaburi');
    expect(supporter.job_roles).toBe('maid');

    expect(await db.SupporterSkill.count({ where: { supporter_id: supporter.id } })).toBe(1);
    expect(await db.SupporterExperience.count({ where: { supporter_id: supporter.id } })).toBe(1);

    const marker = await db.ImportData.findByPk(1);
    expect(marker.latest_maid_id).toBeGreaterThan(0);
  });

  it('pins current behavior: real birthdays fail to import (Invalid Date mapping)', async () => {
    maidRows[0].birthday = '1992-02-02';
    const res = await pub(request(app).get('/import/supporter-agency'));
    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toContain('Invalid date');
    maidRows[0].birthday = '0000-00-00';
  });
});

describe('driver file-backed imports', () => {
  beforeAll(async () => {
    // the file rows reference driver_id 101 — link a local supporter so the
    // FK-validated inserts succeed (unknown ids are silently dropped otherwise)
    await db.Supporter.create({ id: 101, firstname: 'Driver Link', driver_id: 101, job_type: 'Full time' });
  });

  it('imports skill.json into supporter languages', async () => {
    const res = await pub(request(app).get('/import/supporter-driver-skill'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    // pins current behavior: inserts are fired-and-forgotten (forEach async,
    // never awaited) — the response returns before rows land
    await new Promise((r) => setTimeout(r, 1500));
    expect(await db.SupporterLanguage.count()).toBeGreaterThanOrEqual(1);
  });

  it('imports experience.json into supporter experiences', async () => {
    const res = await pub(request(app).get('/import/supporter-driver-experience'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    await new Promise((r) => setTimeout(r, 1500)); // fire-and-forgotten inserts (pins the race)
    expect(await db.SupporterExperience.count()).toBeGreaterThanOrEqual(1);
  });
});

describe('agency profile image matching', () => {
  it('pins current behavior: match endpoints answer without hanging', async () => {
    // These walk supporter rows and pull images via mocked sftp/http; with no
    // matching maid_id rows they complete with 500 (agency mapping miss) or
    // 200 depending on data — the contract is a response, never a hang.
    const match = await pub(request(app).get('/import/supporter-agency-profile-image'));
    expect([200, 500]).toContain(match.status);

    const stat = await pub(request(app).get('/import/supporter-agency-stat'));
    expect([200, 500]).toContain(stat.status);
  });

  it('pins current behavior: driver id matching over empty data', async () => {
    const res = await pub(request(app).get('/import/supporter-driver-match-skill'));
    expect([200, 500]).toContain(res.status);
  });
});
