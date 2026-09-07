import fs from 'fs';
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
      // stat/list queries need rows; everything else reads as "nothing to import"
      const rows = sql.includes('view_summary')
        ? [{ id: 1, count: 5 }]
        : sql.includes('position_ID = 20')
          ? [{ maid_id: '00000000001' }]
          : [];
      cb(null, rows, []);
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
  const maidPayload = {
    maid_id: 501,
    internal_code: 'A501',
    name: 'Agency Maid',
    job_roles: 'maid',
    phone_number: '085',
    nationality: 'thai',
    job_location: 'Bangkok',
    job_type: 'Full time',
    job_live: 'Live in',
    marriage_status: 'Single',
    active: true,
    remark: 'has work-permit',
    skill_array: [{ skill_ID: 85 }, { skill_ID: 79 }],
    experience_array: [{ worktime: '2y', exp_location: 'Thai family' }],
  };

  it('creates an agency maid with skills, languages and experiences', async () => {
    const res = await pub(request(app).post('/agency-back-office/maid')).send(maidPayload);

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);

    const supporter = await db.Supporter.findOne({ where: { maid_id: 501 } });
    expect(supporter).not.toBeNull();
    expect(supporter.nationality).toBe('Thai');
    expect(supporter.work_permit).toBe(true); // from the remark

    expect(await db.SupporterSkill.count({ where: { supporter_id: supporter.id } })).toBe(1);
    expect(await db.SupporterLanguage.count({ where: { supporter_id: supporter.id } })).toBe(1);
    expect(await db.SupporterExperience.count({ where: { supporter_id: supporter.id } })).toBe(1);
  });

  it('updates an existing agency maid instead of duplicating', async () => {
    const res = await pub(request(app).post('/agency-back-office/maid')).send({
      ...maidPayload,
      name: 'Agency Maid Renamed',
    });

    expect(res.status).toBe(200);
    const rows = await db.Supporter.findAll({ where: { maid_id: 501 } });
    expect(rows).toHaveLength(1);
    expect(rows[0].firstname).toBe('Agency Maid Renamed');
  });

  it('updates an agency maid by route param', async () => {
    const res = await pub(request(app).put('/agency-back-office/maid/501')).send({
      ...maidPayload,
      name: 'Route Updated',
    });
    expect(res.status).toBe(200);
    expect(
      (await db.Supporter.findOne({ where: { maid_id: 501 } })).firstname
    ).toBe('Route Updated');
  });

  it('uploads an agency maid profile image over sftp', async () => {
    const res = await pub(request(app).put('/agency-back-office/maid/501/profile-pic'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    expect(
      (await db.Supporter.findOne({ where: { maid_id: 501 } })).profile_image_url
    ).toBe('maid_501.jpg');
  });

  it('applies agency view stats onto supporters', async () => {
    await db.Supporter.update({ maid_id: 1 }, { where: { maid_id: 501 } });
    const res = await pub(request(app).get('/import/supporter-agency-stat'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    expect(
      (await db.Supporter.findOne({ where: { maid_id: 1 } })).interest
    ).toBe(5); // from the mocked view_summary
  });

  it('removes a childless agency maid', async () => {
    await db.Supporter.create({ maid_id: 502, firstname: 'Childless', job_type: 'Full time' });
    const res = await pub(request(app).delete('/agency-back-office/maid/502'));
    expect(res.status).toBe(200);
    expect(await db.Supporter.findOne({ where: { maid_id: 502 } })).toBeNull();
  });

  it('removes a maid that still has skill/language/experience rows', async () => {
    const res = await pub(request(app).delete('/agency-back-office/maid/1'));
    expect(res.status).toBe(200);
    expect(await db.Supporter.findOne({ where: { maid_id: 1 } })).toBeNull();
  });

  it('updates and deletes agency drivers', async () => {
    await db.Supporter.create({ id: 202, firstname: 'Drv', driver_id: 202, job_type: 'Full time' });

    const updated = await pub(request(app).put('/agency-back-office/driver/202')).send({
      driver_id: 202,
      name: 'Driver Renamed',
      job_type: 'Full time',
    });
    expect(updated.status).toBe(200);

    const removed = await pub(request(app).delete('/agency-back-office/driver/202'));
    expect(removed.status).toBe(200);
    expect(await db.Supporter.findByPk(202)).toBeNull();
  });
});

