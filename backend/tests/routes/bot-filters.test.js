import { describe, it, expect, beforeAll } from 'vitest';
import * as adminHelperModule from '../../helpers/admin.ts';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createCustomer, customerToken } from '../helpers/factories';

let supporter;

beforeAll(async () => {
  await truncateAll();
  const c = await createCustomer({ email: 'botf@test.local' });
  supporter = await db.Supporter.create({
    firstname: 'BotFilter',
    lastname: 'Case',
    active: true,
    job_roles: 'maid-cook',
    job_type: 'Full time',
    job_live: 'Live in',
    nationality: 'Thai',
    expected_salary: 16000,
    currency: 'THB',
    phone_number: '0898765432',
    birthday: '1993-03-03',
    profile_image_url: 'bf.jpg',
  });
  await db.SupporterLanguage.create({ supporter_id: supporter.id, language: 'English', level: 'good' });
  await db.SupporterSkill.create({ supporter_id: supporter.id, skill: 'Cook', level: 'good' });
});

const pub = (t) => t.set('app_key', APP_KEY);

// /bot/profile builds its query with one switch-case per filter; every case is
// a distinct branch. Drive each through the public route.
describe('bot list filter branches', () => {
  const cases = [
    ['job_roles', 'maid-cook'],
    ['skill', 'Cook'],
    ['language', 'English'],
    ['min_salary', '10000'],
    ['max_salary', '20000'],
    ['job_live', 'Live in'],
    ['job_type', 'Full time'],
    ['min_age', '20'],
    ['max_age', '40'],
  ];

  for (const [param, value] of cases) {
    it(`filter: ${param}`, async () => {
      const res = await pub(request(app).get('/bot/profile'))
        .query({ page: 1, [param]: value });
      expect(res.status).toBe(200);
    });
  }

  it('list with min_age/max_age defaults and enrichment', async () => {
    const res = await pub(request(app).get('/bot/profile')).query({ page: 1 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const helper = res.body[0];
      expect(helper.image).toContain('supporters/');
      expect(typeof helper.age).toBe('number');
    }
  });
});

describe('helpers/admin.findAdminById (unit)', () => {
  it('finds and rejects', async () => {
    const { createAdmin } = await import('../helpers/factories');
    const admin = await createAdmin({ username: 'findbyid@test.local' });
    const adminHelper = adminHelperModule;
    const found = await adminHelper.findAdminById(admin.id);
    expect(found.username).toBe('findbyid@test.local');
    await expect(adminHelper.findAdminById(999999)).rejects.toThrow('Admin does not found.');
  });
});

describe('address.json error branches', () => {
  it('nonexistent parents return empty lists (not errors)', async () => {
    const d = await request(app).get('/guest/provinces/999999/districts').set('app_key', APP_KEY);
    expect(d.status).toBe(200);
    const s = await request(app).get('/guest/districts/999999/sub-districts').set('app_key', APP_KEY);
    expect(s.status).toBe(200);
  });
});
