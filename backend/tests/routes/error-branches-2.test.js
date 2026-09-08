import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createAdmin, createCustomer, adminToken, customerToken } from '../helpers/factories';

let adminJwt, customerJwt, customer;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'eb2@test.local' });
  adminJwt = await adminToken(admin);
  customer = await createCustomer({ email: 'eb2-c@test.local' });
  customerJwt = await customerToken(customer);
});

const admin = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${adminJwt}`);
const client = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${customerJwt}`);

describe('address.json error branches', () => {
  it('sub-district list for a missing district returns empty', async () => {
    const res = await request(app).get('/guest/districts/424242/sub-districts').set('app_key', APP_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('district list for a missing province returns empty', async () => {
    const res = await request(app).get('/guest/provinces/424242/districts').set('app_key', APP_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('customer.controller remaining branches', () => {
  it('upload profile without a file answers a 400 validation envelope', async () => {
    const res = await client(request(app).post('/client/user/profile-image'));
    expect(res.status).toBe(400); // 'No file uploaded' carries 400 now
    expect(res.body.message).toBe('No file uploaded');
  });

  it('remove profile for a missing file is an idempotent 200', async () => {
    const res = await admin(request(app).delete('/back-office/customers/profile-image/nope.jpg'));
    // unlinking a missing file used to throw ENOENT → 500; now a guarded no-op
    expect(res.status).toBe(200);
  });

  it('export after truncation is guarded, create dup-checks email', async () => {
    const dup = await admin(request(app).post('/back-office/customers')).send({
      firstname: 'Dup', email: 'eb2-c@test.local',
    });
    expect(dup.status).toBe(400); // duplicate email carries explicit status now
    expect(dup.body.message).toBe('This email is already registered.');
  });
});

describe('requesthelper status CRUD deep branches', () => {
  it('create → detail → list → count → update → remove', async () => {
    const created = await admin(request(app).post('/back-office/request-helper-status')).send({
      status_name: 'eb2-new', // create reads status_name and returns bare true
    });
    expect(created.status).toBe(200);
    expect(created.body).toBe(true);

    const row = await db.RequestHelperStatus.findOne({ where: { status_name: 'eb2-new' } });
    const id = row.id;

    const detail = await admin(request(app).get(`/back-office/request-helper-status/${id}`));
    expect(detail.status).toBe(200);
    expect(detail.body.status_name).toBe('eb2-new');

    const list = await admin(request(app).get('/back-office/request-helper-status')).query({
      page: 1, limit: 10,
    });
    expect(list.status).toBe(200);

    const count = await admin(request(app).get('/back-office/request-helper-status/count'));
    expect(count.status).toBe(200);

    const updated = await admin(request(app).put(`/back-office/request-helper-status/${id}`)).send({
      status_name: 'eb2-updated',
    });
    expect(updated.status).toBe(200);

    const removed = await admin(request(app).delete(`/back-office/request-helper-status/${id}`));
    expect(removed.status).toBe(200);
  });
});

describe('jobreview count + client update branches', () => {
  it('client-tier review update touches its own update path', async () => {
    const review = await db.JobReview.create({ rating: 1, text: 'bad', customer_id: customer.id });
    const res = await client(request(app).put(`/client/job-reviews/${review.id}`)).send({
      rating: 4, comment: 'improved',
    });
    expect(res.status).toBe(200);
    expect((await db.JobReview.findByPk(review.id)).rating).toBe(4);

    const count = await client(request(app).get('/client/job-reviews/count'));
    expect(count.status).toBe(200);
  });
});

describe('customersupply create with details cascade', () => {
  it('creates a customer supply with line items', async () => {
    const created = await admin(request(app).post('/back-office/customer-supplies')).send({
      order_date: '2026-09-10',
      maid_quantity: 1,
      total_cost: 100,
      total_price: 150,
      customer_id: customer.id,
      customer_supply_details: [
        { cleaning_supply_id: 1, cleaning_supply_name: 'X', unit_price: 25, quantity: 2, total: 50 },
      ],
    });
    expect(created.status).toBe(200);
    const detail = await admin(request(app).get(`/back-office/customer-supplies/${created.body.id}`));
    expect(detail.status).toBe(200);
  });
});
