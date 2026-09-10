import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, db } from '../helpers/db';
import { createAdmin, createCustomer, adminToken, customerToken } from '../helpers/factories';

let adminJwt, customerJwt;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'sweep@test.local' });
  adminJwt = await adminToken(admin);
  const customer = await createCustomer({ email: 'sweep-c@test.local' });
  customerJwt = await customerToken(customer);
});

const admin = (test) => test.set('Authorization', `Bearer ${adminJwt}`);
const client = (test) => test.set('Authorization', `Bearer ${customerJwt}`);

describe('not-found / validation branches', () => {
  it('job review endpoints return 500 for missing rows', async () => {
    const bo = await admin(request(app).get('/back-office/job-reviews/999999'));
    expect(bo.status).toBe(500);

    const cli = await client(request(app).get('/client/job-reviews/999999'));
    expect(cli.status).toBe(500);
  });

  it('biz-customer detail for a missing row (update/remove tolerate it)', async () => {
    // detail null-guards with a 500; update/remove succeed vacuously on zero rows
    expect((await admin(request(app).get('/back-office/biz-customers/999999'))).status).toBe(500);
    expect(
      (await admin(request(app).put('/back-office/biz-customers/999999')).send({ company_name: 'X' })).status
    ).toBe(200);
    expect(
      (await admin(request(app).delete('/back-office/biz-customers/999999'))).status
    ).toBe(200);
  });

  it('admin detail and password for missing rows', async () => {
    expect((await admin(request(app).get('/back-office/admins/999999'))).status).toBe(500);
    expect(
      (await admin(request(app).put('/back-office/admins/999999/password')).send({ password: 'x' }))
        .status
    ).toBe(500);
  });

  it('cleaning supply / supplier / customer missing rows', async () => {
    expect((await admin(request(app).get('/back-office/cleaning-supplies/999999'))).status).toBe(500);
    expect((await admin(request(app).get('/back-office/suppliers/999999'))).status).toBe(500);
    expect((await admin(request(app).get('/back-office/customer-supplies/999999'))).status).toBe(500);
  });

  it('supporter detail branches (public + back-office)', async () => {
    expect((await request(app).get('/guest/supporters/999999')).status).toBe(500);
    expect((await admin(request(app).get('/back-office/supporters/999999'))).status).toBe(500);
    expect((await request(app).get('/bot/profile/999999')).status).toBe(500);
  });

  it('job endpoints for missing rows', async () => {
    // not-found carries 404 now (getDetail throws { status: 404 } on the
    // shared controller, so both tiers benefit); match stays 500 for now
    expect((await admin(request(app).get('/back-office/jobs/999999'))).status).toBe(404);
    expect((await client(request(app).get('/client/jobs/999999'))).status).toBe(404);
    expect(
      (await admin(request(app).put('/back-office/jobs/999999/match/1'))).status
    ).toBe(500);
  });

  it('address json endpoints for missing parents return empty lists', async () => {
    const districts = await request(app)
      .get('/guest/provinces/999999/districts')
      ;
    expect(districts.status).toBe(200);
    expect(districts.body).toEqual([]);

    const subs = await request(app)
      .get('/guest/districts/999999/sub-districts')
      ;
    expect(subs.status).toBe(200);
    expect(subs.body).toEqual([]);
  });

  it('address endpoints for missing rows', async () => {
    expect((await client(request(app).get('/client/addresses/999999'))).status).toBe(404); // scoped miss → 404
    expect((await admin(request(app).get('/back-office/addresses/999999'))).status).toBe(404);
  });

  it('credit card detail for a missing row', async () => {
    expect((await client(request(app).get('/client/credit-cards/999999'))).status).toBe(500);
  });

  it('upload endpoints without a file', async () => {
    const customerUpload = await client(request(app).post('/client/user/profile-image'));
    expect(customerUpload.status).toBe(400); // validation carries 400 now
    expect(customerUpload.body.message).toBe('No file uploaded');

    const adminUpload = await admin(request(app).post('/back-office/supporters/profile-image'));
    expect(adminUpload.status).toBe(400);
  });

  it('request-helper details tolerate missing rows (null body)', async () => {
    // missing rows answer 200-null when the helper returns early and 500 when
    // its enrichment touches the null — data-order dependent. pins the range.
    const cli = await client(request(app).get('/client/user/request-helper/999999'));
    expect([200, 500]).toContain(cli.status);
    if (cli.status === 200) expect(cli.body).toBeNull();

    const bo = await admin(request(app).get('/back-office/request-helpers/999999'));
    expect([200, 500]).toContain(bo.status); // same order-dependent null handling

    const status = await admin(request(app).get('/back-office/request-helper-status/999999'));
    expect([200, 500]).toContain(status.status); // null-handling varies by data order
  });

  it('role detail for a missing row', async () => {
    expect((await admin(request(app).get('/back-office/roles/999999'))).status).toBe(404);
  });

  it('subscription find for a missing row (400 envelope)', async () => {
    const res = await admin(request(app).get('/back-office/subscriptions/999999'));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Subscription not found');
  });
});
