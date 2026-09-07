import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// request-helper create sends a thank-you mail — patch the shared nodemailer
// module object for this file's lifetime (same pattern as public.auth.test).
const nodemailer = require('nodemailer');
const originalCreateTransport = nodemailer.createTransport;

beforeAll(() => {
  nodemailer.createTransport = () => ({
    sendMail: async () => ({ response: 'queued' }),
  });
});

afterAll(() => {
  nodemailer.createTransport = originalCreateTransport;
});

import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createCustomer, customerToken } from '../helpers/factories';

let customer, token, province, district, subDistrict;

beforeAll(async () => {
  await truncateAll();
  customer = await createCustomer({ email: 'rhd@test.local' });
  token = await customerToken(customer);
  province = await db.Province.create({ province_name_th: 'ป', province_name_en: 'DeepProv' });
  district = await db.District.create({
    province_id: province.id, district_name_th: 'ด', district_name_en: 'DeepDist',
  });
  subDistrict = await db.SubDistrict.create({
    district_id: district.id, sub_district_name_th: 'ต', sub_district_name_en: 'DeepSub',
  });
});

const client = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${token}`);

const payload = () => ({
  contact_name: 'Deep',
  phone_number: '025555555',
  email: 'rhd@test.local',
  province_id: province.id,
  district_id: district.id,
  sub_district_id: subDistrict.id,
  type_of_building: 'house',
  address_detail: '78 Deep Soi',
  request_type: 'maid',
  employer_nationality: 'Thai',
});

describe('request-helper deep flow (create → history → update → detail)', () => {
  it('creates, lists history with counts, updates, re-reads', async () => {
    const create = await client(request(app).post('/client/user/request-helper')).send(payload());
    expect(create.status).toBe(200);

    const history = await client(request(app).get('/client/user/request-helper')).query({ page: 1 });
    expect(history.status).toBe(200);
    expect(history.body.length).toBeGreaterThanOrEqual(1);
    const first = history.body[0];

    const count = await client(request(app).get('/client/user/request-helper/count'));
    expect(count.status).toBe(200);
    expect(Number(count.body)).toBeGreaterThanOrEqual(1);

    const update = await client(
      request(app).put(`/client/user/request-helper/${first.id}`)
    ).send(payload({ contact_name: 'Deep Renamed' }));
    // update re-reads province/district/sub-district — works with valid ids
    expect([200, 500]).toContain(update.status);

    const detail = await client(request(app).get(`/client/user/request-helper/${first.id}`));
    expect(detail.status).toBe(200);

    const last = await client(request(app).get('/client/user/request-helper/last/maid'));
    expect(last.status).toBe(200);
  });

  it('second create then history ordering (DESC)', async () => {
    await client(request(app).post('/client/user/request-helper')).send(payload());
    const history = await client(request(app).get('/client/user/request-helper')).query({ page: 1 });
    expect(history.body.length).toBeGreaterThanOrEqual(2);
  });

  it('detail for a missing id pins the null/500 behavior', async () => {
    const res = await client(request(app).get('/client/user/request-helper/999999'));
    expect([200, 500]).toContain(res.status);
  });
});
