import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createAdmin, adminToken } from '../helpers/factories';

let adminJwt;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'biz@test.local' });
  adminJwt = await adminToken(admin);
});

const admin = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${adminJwt}`);

describe('biz-customer CRUD deep paths', () => {
  it('full lifecycle with keyword search and count', async () => {
    const created = await admin(request(app).post('/back-office/biz-customers')).send({
      company_name: 'Acme Cleaning',
      remark: 'vip client',
    });
    expect(created.status).toBe(200);
    const bizId = created.body.id;

    const keywordHit = await admin(request(app).get('/back-office/biz-customers')).query({
      keyword: 'Acme', page: 1, limit: 10,
    });
    expect(keywordHit.status).toBe(200);
    expect(keywordHit.body.some((b) => b.id === bizId)).toBe(true);

    const keywordMiss = await admin(request(app).get('/back-office/biz-customers')).query({
      keyword: 'NonexistentCo', page: 1, limit: 10,
    });
    expect(keywordMiss.status).toBe(200);
    expect(keywordMiss.body.some((b) => b.id === bizId)).toBe(false);

    const count = await admin(request(app).get('/back-office/biz-customers/count'));
    expect(count.status).toBe(200);
    expect(count.body).toBe(1);

    const removed = await admin(request(app).delete(`/back-office/biz-customers/${bizId}`));
    expect(removed.status).toBe(200);
  });
});

describe('cleaning-supply keyword + count branches', () => {
  it('keyword search hits the name field', async () => {
    await db.CleaningSupply.create({ name: 'Lavender Detergent', price: 90 });
    const res = await admin(request(app).get('/back-office/cleaning-supplies')).query({
      keyword: 'Lavender', page: 1, limit: 10,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Lavender Detergent');
  });

  it('supply update via PUT covers the update branch', async () => {
    const supply = await db.CleaningSupply.create({ name: 'Old Soap', price: 10 });
    const res = await admin(request(app).put(`/back-office/cleaning-supplies/${supply.id}`)).send({
      name: 'New Soap', price: 20,
    });
    expect(res.status).toBe(200);
    expect((await db.CleaningSupply.findByPk(supply.id)).name).toBe('New Soap');

    const removed = await admin(request(app).delete(`/back-office/cleaning-supplies/${supply.id}`));
    expect(removed.status).toBe(200);
  });
});

describe('supplier CRUD branch completion', () => {
  it('create → keyword list → update → remove', async () => {
    const created = await admin(request(app).post('/back-office/suppliers')).send({
      name: 'KwSupplier', branch: 'BKK',
    });
    expect(created.status).toBe(200);

    const list = await admin(request(app).get('/back-office/suppliers')).query({
      keyword: 'KwSupplier', page: 1, limit: 10,
    });
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const updated = await admin(request(app).put(`/back-office/suppliers/${created.body.id}`)).send({
      branch: 'CNX',
    });
    expect(updated.status).toBe(200);

    const removed = await admin(request(app).delete(`/back-office/suppliers/${created.body.id}`));
    expect(removed.status).toBe(200);
  });
});
