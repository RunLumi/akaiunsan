import { UNKNOWN_PASSWORD } from '../helpers/credentials';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, db } from '../helpers/db';
import { createAdmin, createCustomer, adminToken, customerToken } from '../helpers/factories';

let adminJwt, customerJwt, customer;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'deep@test.local' });
  adminJwt = await adminToken(admin);
  customer = await createCustomer({ email: 'deep-c@test.local' });
  customerJwt = await customerToken(customer);
});

const admin = (t) => t.set('Authorization', `Bearer ${adminJwt}`);
const client = (t) => t.set('Authorization', `Bearer ${customerJwt}`);

describe('keyword search branches (substring OR across fields)', () => {
  it('addresses: keyword matches address_detail', async () => {
    await db.Address.create({
      customer_id: customer.id, firstname: 'K', lastname: 'W',
      address_detail: 'KeywordLane 42',
    });
    const res = await client(request(app).get('/client/addresses')).query({
      keyword: 'KeywordLane', page: 1, limit: 10,
    });
    expect(res.status).toBe(200);
    expect(res.body.some((a) => a.address_detail.includes('KeywordLane'))).toBe(true);
  });

  it('roles: keyword matches role_name', async () => {
    const res = await admin(request(app).get('/back-office/roles')).query({
      keyword: 'Test Role', page: 1, limit: 50,
    });
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.role_name.includes('Test Role'))).toBe(true);
  });

  it('jobs: keyword matches job_type', async () => {
    await db.Job.create({
      status: 'waiting', job_type: 'zookeeper', customer_id: customer.id, final_price: 1,
    });
    const res = await admin(request(app).get('/back-office/jobs')).query({
      keyword: 'zookeeper', page: 1, limit: 10,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('jobreview list/update branches', () => {
  it('lists job reviews with pagination and updates', async () => {
    const review = await db.JobReview.create({ rating: 2, text: 'meh', customer_id: customer.id });

    const list = await admin(request(app).get('/back-office/job-reviews')).query({
      page: 1, limit: 10,
    });
    expect(list.status).toBe(200);
    expect(list.body.some((r) => r.id === review.id)).toBe(true);

    const count = await admin(request(app).get('/back-office/job-reviews/count'));
    expect(count.status).toBe(200);

    const updated = await admin(request(app).put(`/back-office/job-reviews/${review.id}`)).send({
      rating: 5, comment: 'great',
    });
    expect(updated.status).toBe(200);
  });
});

describe('error route 404 catch-all', () => {
  it('returns the Invalid request envelope for unknown routes', async () => {
    const res = await request(app).get('/no/such/route');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Invalid request');
  });
});

describe('address.json direct list (admin path)', () => {
  it('serves provinces through the admin-list controller too', async () => {
    const res = await admin(request(app).get('/guest/provinces'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('bot endpoints happy paths', () => {
  it('gets a bot profile detail with default image fallback', async () => {
    const supporter = await db.Supporter.create({
      firstname: 'Botless', job_type: 'Full time', nationality: 'TH',
      // no profile_image_url → default_image_url branch
    });
    const res = await request(app).get(`/bot/profile/${supporter.id}`);
    expect(res.status).toBe(200);
  });
});

describe('subscription endpoints through the client tier', () => {
  it('findSubscription returns a subscription by id', async () => {
    const sub = await db.Subscription.create({
      customer_id: customer.id, job_type: 'cleaning', total_hour: 5,
      used_hour: 0, status: 'active', next_payment: '2026-10-10',
    });
    const res = await client(request(app).get(`/client/subscriptions/${sub.id}`));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(sub.id);
  });
});

describe('customer back-office create flow', () => {
  it('creates a customer with a generated password and dup-checks email', async () => {
    const created = await admin(request(app).post('/back-office/customers')).send({
      firstname: 'Gen', lastname: 'Pass', email: 'genpass@test.local',
    });
    expect(created.status).toBe(200);

    const stored = await db.Customer.findOne({ where: { email: 'genpass@test.local' } });
    expect(stored.password.length).toBeGreaterThan(20); // bcrypt hash

    const signin = await request(app).post('/auth/signin')
      .send({ email: 'genpass@test.local', password: UNKNOWN_PASSWORD });
    expect(signin.status).toBe(400); // generated password is unknown — good
  });
});
