import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createAdmin, createCustomer, adminToken, customerToken } from '../helpers/factories';

let adminJwt, customer, customerJwt;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'rv@test.local' });
  adminJwt = await adminToken(admin);
  customer = await createCustomer({ email: 'rv@test.local' });
  customerJwt = await customerToken(customer);
});

const admin = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${adminJwt}`);
const client = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${customerJwt}`);

describe('jobreview remaining branches', () => {
  it('list with keyword filter (rating substring)', async () => {
    await db.JobReview.create({ rating: 3, text: 'ok', customer_id: customer.id });
    const res = await admin(request(app).get('/back-office/job-reviews')).query({
      keyword: '3', page: 1, limit: 10,
    });
    expect(res.status).toBe(200);
  });

  it('detail returns 500 for a missing review (admin + client)', async () => {
    expect((await admin(request(app).get('/back-office/job-reviews/999999'))).status).toBe(500);
    expect((await client(request(app).get('/client/job-reviews/999999'))).status).toBe(500);
  });
});

describe('admin helper findAdminById (via route)', () => {
  it('detail for existing admin exercises findAdminById through the controller', async () => {
    const adminRow = await db.Admin.findOne({ where: { username: 'rv@test.local' } });
    const res = await admin(request(app).get(`/back-office/admins/${adminRow.id}`));
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('rv@test.local');
  });
});

describe('geography cascade', () => {
  it('province → district → sub-district chain', async () => {
    const province = await db.Province.create({ province_name_th: 'ป', province_name_en: 'P-Test' });
    const district = await db.District.create({
      province_id: province.id, district_name_th: 'ด', district_name_en: 'D-Test',
    });
    await db.SubDistrict.create({
      district_id: district.id, sub_district_name_th: 'ต', sub_district_name_en: 'S-Test',
    });

    const provinces = await request(app).get('/guest/provinces').set('app_key', APP_KEY);
    expect(provinces.status).toBe(200);

    const districts = await request(app)
      .get(`/guest/provinces/${province.id}/districts`).set('app_key', APP_KEY);
    expect(districts.status).toBe(200);
    expect(districts.body.some((d) => d.district_name_en === 'D-Test')).toBe(true);

    const subs = await request(app)
      .get(`/guest/districts/${district.id}/sub-districts`).set('app_key', APP_KEY);
    expect(subs.status).toBe(200);
    expect(subs.body.some((s) => s.sub_district_name_en === 'S-Test')).toBe(true);
  });
});
