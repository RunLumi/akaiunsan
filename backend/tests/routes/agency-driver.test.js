import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import * as utilNS from '../../helpers/util.ts';
const util = utilNS.default ?? utilNS;
import fs from 'node:fs';
import path from 'node:path';

// agency driver endpoints: sftp + fetch mocked before app import
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

class FakeSftp {
  connect(cfg) { return Promise.resolve(cfg); }
  get() { return Promise.resolve(Buffer.from('img')); }
  put() { return Promise.resolve(); }
  end() { return Promise.resolve(); }
}

const originalFetch = global.fetch;

let app, db, truncateAll;

beforeAll(async () => {
  patchModule('ssh2-sftp-client', FakeSftp);
  global.fetch = async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) });

  app = (await import('../../app')).default;
  ({ db, truncateAll } = await import('../helpers/db'));
  await truncateAll();
});

afterAll(() => {
  global.fetch = originalFetch;
  restoreFns.forEach((r) => r());
});

const pub = (t) => t;

const driverPayload = {
  driver_id: 601,
  internal_code: 'D601',
  name: 'Agency Driver',
  job_roles: 'driver',
  phone_number: '086',
  nationality: 'lao',

  expected_salary: 20000,
  currency: 'THB',
  job_location_id: 11,
  job_type: 'Full time',
  job_live: 'Live out',
  marriage_status: 'Single',
  active: true,
  remark: 'has work-permit',
  skill_array: [{ skill_ID: 79 }, { skill_ID: 85 }],
  experience_array: [{ worktime: '4 years', exp_location: 'Thai family' }],
};

describe('POST /agency-back-office/driver', () => {
  it('creates a driver with skills, languages, experiences and mapped fields', async () => {
    const res = await pub(request(app).post('/agency-back-office/driver')).send(driverPayload);

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);

    const supporter = await db.Supporter.findOne({ where: { driver_id: 601 } });
    expect(supporter).not.toBeNull();
    expect(supporter.firstname).toBe('Agency Driver');
    expect(supporter.nationality).toBe('Lao');
    expect(supporter.job_location).toBe('Sukhumvit'); // job_location_id 11
    expect(supporter.work_permit ?? false).toBe(false); // drivers don't set work_permit

    expect(await db.SupporterSkill.count({ where: { supporter_id: supporter.id } })).toBe(1);
    expect(await db.SupporterLanguage.count({ where: { supporter_id: supporter.id } })).toBe(1);
    expect(await db.SupporterExperience.count({ where: { supporter_id: supporter.id } })).toBe(1);
  });

  it('imports real birthdays (Invalid Date mapping fixed)', async () => {
    const res = await pub(request(app).post('/agency-back-office/driver')).send({
      ...driverPayload, driver_id: 602, birthday: '1991/03/03',
    });
    // the mapper shadowed the split array with `new Date()`, producing an
    // Invalid Date for every real birthday; the inner variable is renamed
    expect(res.status).toBe(200);
    const supporter = await db.Supporter.findOne({ where: { driver_id: 602 } });
    expect(supporter.birthday).toBeTruthy();
    expect(new Date(supporter.birthday).getFullYear()).toBe(1991);
  });

  it('updates the same driver instead of duplicating on re-post', async () => {
    await pub(request(app).post('/agency-back-office/driver')).send({
      ...driverPayload,
      name: 'Driver Renamed',
    });

    const rows = await db.Supporter.findAll({ where: { driver_id: 601 } });
    expect(rows).toHaveLength(1);
    expect(rows[0].firstname).toBe('Driver Renamed');
  });
});

describe('PUT /agency-back-office/driver/:driver_id', () => {
  it('updates by route param', async () => {
    const res = await pub(request(app).put('/agency-back-office/driver/601')).send({
      ...driverPayload,
      name: 'Param Updated',
    });
    expect(res.status).toBe(200);
    expect((await db.Supporter.findOne({ where: { driver_id: 601 } })).firstname).toBe('Param Updated');
  });
});

describe('PUT /agency-back-office/driver/:driver_id/profile-pic', () => {
  it('downloads and links a driver profile picture', async () => {
    const res = await pub(request(app).put('/agency-back-office/driver/601/profile-pic'));
    expect(res.status).toBe(200);
    expect((await db.Supporter.findOne({ where: { driver_id: 601 } })).profile_image_url).toBe('driver_601.jpg');
  });
});

describe('DELETE /agency-back-office/driver/:driver_id', () => {
  it('removes a driver and their child rows', async () => {
    const res = await pub(request(app).delete('/agency-back-office/driver/601'));
    expect(res.status).toBe(200);
    expect(await db.Supporter.findOne({ where: { driver_id: 601 } })).toBeNull();
  });

  it('removing an unknown driver answers 404 (null deref fixed)', async () => {
    const res = await pub(request(app).delete('/agency-back-office/driver/999999'));
    expect(res.status).toBe(404); // supporter.id was accessed without a null check
    expect(res.body.message).toBe('Driver not found');
  });
});

describe('helpers/util remaining exports', () => {
  it('genAgencyData maps a supporter to the legacy agency shape', async () => {
    const agency = await util.genAgencyData(77, {
      internal_code: 'A1',
      job_roles: 'maid,nanny',
      firstname: 'Map',
      birthday: '1993-03-03',
      phone_number: '087',
      weight: 55,
      height: 165,
      nationality: 'Vietnamese',
      job_location: 'Bangkok',
      job_live: 'Live in',
      job_type: 'Full time',
      expected_salary: 18000,
      marriage_status: 'Single',
      active: true,
      remark: 'r',
      comment: 'c',
      profile_image_url: 'p.jpg',
    });

    expect(agency).toMatchObject({
      position_ID: 20, // maid+nanny
      location_ID: 72, // Bangkok
      ltype: 1,
      jtype: 1,
      mstatus: 1,

      maid_backoffice_id: 77,
    });
    expect(agency.birthday).toBe('1993-03-03');
  });

  it('genAgencyData handles missing optional fields', async () => {

    const agency = await util.genAgencyData(78, {
      firstname: 'Bare',
      job_roles: 'driver',
      job_live: 'Live out',
      job_type: 'Part time',
      marriage_status: 'Married',
    });
    expect(agency.position_ID).toBe(0); // driver not in the position map
    expect(agency.location_ID).toBe(''); // no location
    expect(agency.currency).toBe(''); // no currency
  });

  it('bulkCreateOnAgency resolves immediately for empty input', async () => {

    await expect(util.bulkCreateOnAgency('maid', [])).resolves.toBe(true);
  });
});
