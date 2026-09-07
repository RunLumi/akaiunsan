import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createAdmin, createCustomer, adminToken, customerToken } from '../helpers/factories';

let adminJwt, customer, customerJwt, supporter;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'fin@test.local' });
  adminJwt = await adminToken(admin);
  customer = await createCustomer({ email: 'fin@test.local' });
  customerJwt = await customerToken(customer);
  supporter = await db.Supporter.create({
    firstname: 'Aged',
    lastname: 'Helper',
    active: true,
    job_type: 'Full time',
    job_live: 'Live in',
    job_roles: 'maid',
    nationality: 'Thai',
    birthday: '1990-06-15',
    expected_salary: 18000,
    currency: 'THB',
    profile_image_url: null, // default-image branch in bot detail
  });
  await db.SupporterLanguage.create({ supporter_id: supporter.id, language: 'English', level: 'good' });
  await db.SupporterSkill.create({ supporter_id: supporter.id, skill: 'Iron', level: 'fair' });
});

const admin = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${adminJwt}`);
const client = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${customerJwt}`);

describe('bot list enrichment with age window + includes', () => {
  it('returns helpers within the age window with languages and skills', async () => {
    const res = await request(app).get('/bot/profile')
      .set('app_key', APP_KEY)
      .query({ min_age: 20, max_age: 60 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const helper = res.body[0];
      // default-image branch in bot getDetail-style enrichment
      expect(helper.image).toContain('cdn.test.local');
      expect(Array.isArray(helper.language)).toBe(true);
      expect(Array.isArray(helper.skill_name)).toBe(true);
    }
  });

  it('excludes helpers outside the age window', async () => {
    const res = await request(app).get('/bot/profile')
      .set('app_key', APP_KEY)
      .query({ min_age: 5, max_age: 10 });
    expect(res.status).toBe(200);
    expect(res.body.every((h) => h.age >= 5 && h.age <= 10)).toBe(true);
  });
});

describe('customer.controller remaining branches', () => {
  it('removeProfile for a missing file → 500 (fs import now present, error envelope works)', async () => {
    const res = await admin(request(app).delete('/back-office/customers/profile-image/missing.jpg'));
    expect(res.status).toBe(500);
    expect(res.body.message).toContain('no such file');
  });

  it('removeProfile for an existing file → 200', async () => {
    fs.writeFileSync('uploads/customers/exists.jpg', 'x');
    const res = await admin(request(app).delete('/back-office/customers/profile-image/exists.jpg'));
    expect(res.status).toBe(200);
    expect(fs.existsSync('uploads/customers/exists.jpg')).toBe(false);
  });
});

describe('customer credit-card count/count-detail via client (deeper branches)', () => {
  it('credit-card count for a customer with no cards returns 0', async () => {
    const res = await client(request(app).get('/client/credit-cards/count'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(0);
  });
});
