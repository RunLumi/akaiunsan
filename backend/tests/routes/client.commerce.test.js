import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// helpers/omise.js creates its Omise client at require time, so the package
// must be replaced in the module cache BEFORE the app is imported.
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

const omiseState = { customers: [], charges: [], nextCard: 0, attachCalls: [] };
const omiseFactory = () => ({
  customers: {
    create: async ({ email, card }) => {
      const id = `cust_test_${omiseState.customers.length + 1}`;
      const customer = {
        id,
        email,
        card,
        cards: { data: [{ id: `card_test_${++omiseState.nextCard}` }] },
      };
      omiseState.customers.push(customer);
      return customer;
    },
    retrieve: async (id) => omiseState.customers.find((c) => c.id === id),
    retrieveCard: async () => ({
      data: [{ id: 'card_list_a' }, { id: 'card_list_b' }],
    }),
    update: async (id, payload) => {
      omiseState.attachCalls.push({ id, payload });
      const customer = omiseState.customers.find((c) => c.id === id) || { id };
      return {
        ...customer,
        cards: { data: [{ id: `card_test_${++omiseState.nextCard}` }] },
      };
    },
  },
  charges: {
    create: async (data) => {
      const charge = {
        id: `chrg_test_${omiseState.charges.length + 1}`,
        amount: data.amount,
        status: 'successful',
      };
      omiseState.charges.push(charge);
      return charge;
    },
  },
});

let app, db, APP_KEY, truncateAll, factories;

beforeAll(async () => {
  // omise's export is a factory: require('omise')({secretKey, ...}) → client
  patchModule('omise', omiseFactory);

  app = (await import('../../app')).default;
  ({ db, APP_KEY, truncateAll } = await import('../helpers/db'));
  factories = await import('../helpers/factories');
  await truncateAll();
});

afterAll(() => {
  restoreFns.forEach((restore) => restore());
});

const authed = (test, token) => test.set('app_key', APP_KEY).set('Authorization', `Bearer ${token}`);

describe('client jobs', () => {
  let customer, token, other;

  beforeAll(async () => {
    customer = await factories.createCustomer({ email: 'job-owner@test.local' });
    other = await factories.createCustomer({ email: 'job-other@test.local' });
    token = await factories.customerToken(customer);
  });

  const jobPayload = (over = {}) => ({
    job_type: 'cleaning',
    expect_work_hour: 3,
    address_detail: '1 Job Street',
    address_province: 'Bangkok',
    phone_number: '021111111',
    schedule: '2026-10-01T09:00:00Z',
    payment_method: 'cash',
    base_price: 100,
    full_price: 450,
    total_discount: 0,
    final_price: 450,
    job_details: [{ type: 'extra', quantity: 1, price: 50 }],
    ...over,
  });

  it('creates a job with details in waiting status', async () => {
    const res = await authed(request(app).post('/client/jobs'), token).send(jobPayload());

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('waiting');
    expect(res.body.customer_id).toBe(customer.id);
    const details = await db.JobDetail.findAll({ where: { job_id: res.body.id } });
    expect(details).toHaveLength(1);
  });

  it('routes payment through an active subscription and consumes hours', async () => {
    await db.Subscription.create({
      customer_id: customer.id,
      job_type: 'cleaning',
      total_hour: 20,
      used_hour: 2,
      status: 'active',
      active: true,
      next_payment: '2026-10-10',
    });

    const res = await authed(request(app).post('/client/jobs'), token).send(jobPayload());

    expect(res.status).toBe(200);
    const sub = await db.Subscription.findOne({ where: { customer_id: customer.id } });
    expect(sub.used_hour).toBe(5); // 2 + 3 consumed
    const txn = await db.SubscriptionTransaction.findOne({
      where: { action: 'consume' },
      order: [['id', 'DESC']],
    });
    expect(txn.amount).toBe(3);
  });

  it('lists and counts only the token customer jobs', async () => {
    await db.Job.create({
      status: 'waiting',
      job_type: 'cleaning',
      customer_id: customer.id,
      final_price: 9,
    });
    await db.Job.create({
      status: 'waiting',
      job_type: 'cleaning',
      customer_id: other.id,
      final_price: 1,
    });

    const list = await authed(request(app).get('/client/jobs'), token).query({ page: 1, limit: 50 });
    expect(list.status).toBe(200);
    // earlier tests in this file also created jobs for this customer
    const expected = await db.Job.count({ where: { customer_id: customer.id } });
    expect(list.body).toHaveLength(expected);
    expect(list.body.every((j) => j.customer_id === customer.id)).toBe(true);

    const count = await authed(request(app).get('/client/jobs/count'), token);
    expect(count.status).toBe(200);
    expect(count.body).toBe(expected); // scoped count matches the list
  });

  it('gets job detail scoped to the customer', async () => {
    const job = await db.Job.create({
      status: 'waiting',
      job_type: 'cleaning',
      customer_id: customer.id,
      final_price: 10,
    });
    const res = await authed(request(app).get(`/client/jobs/${job.id}`), token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(job.id);

    const foreign = await db.Job.create({
      status: 'waiting',
      job_type: 'cleaning',
      customer_id: other.id,
      final_price: 10,
    });
    const denied = await authed(request(app).get(`/client/jobs/${foreign.id}`), token);
    expect(denied.status).toBe(500); // pins current behavior
    expect(denied.body.message).toBe('Job not found');
  });

  it('updateStatus commits and answers 200 (fixed)', async () => {
    const job = await db.Job.create({
      status: 'waiting',
      job_type: 'cleaning',
      customer_id: customer.id,
      final_price: 10,
      payment_method: 'cash',
    });

    const res = await authed(
      request(app).put(`/client/jobs/${job.id}/status/working`),
      token
    );
    // The controller previously returned an undeclared `result` (ReferenceError).
    // Now it commits and answers true.
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    expect((await db.Job.findByPk(job.id)).status).toBe('working');
  });

  it('createReview persists the review (transaction committed — fixed)', async () => {
    const supporter = await db.Supporter.create({ firstname: 'Helper' });
    const job = await db.Job.create({
      status: 'done',
      job_type: 'cleaning',
      customer_id: customer.id,
      supporter_id: supporter.id,
      final_price: 10,
    });

    const res = await authed(
      request(app).post(`/client/jobs/${job.id}/job-reviews`),
      token
    ).send({ rating: 5, comment: 'great' });

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    // the missing t.commit() was fixed — the review row now persists
    const reviews = await db.JobReview.findAll({ where: { job_id: job.id } });
    expect(reviews).toHaveLength(1);
  });

  it('deletes a job via the back office (details keyed by id remain — pins current behavior)', async () => {
    const admin = await factories.createAdmin({ username: 'job-admin@test.local' });
    const adminJwt = await factories.adminToken(admin);

    const job = await db.Job.create({
      status: 'waiting',
      job_type: 'cleaning',
      customer_id: customer.id,
      final_price: 10,
    });
    const detail = await db.JobDetail.create({
      job_id: job.id,
      type: 'extra',
      quantity: 1,
      price: 5,
    });

    const res = await authed(request(app).delete(`/back-office/jobs/${job.id}`), adminJwt);
    expect(res.status).toBe(200);
    expect(await db.Job.findByPk(job.id)).toBeNull();
    // destroy uses where {id: job_id} instead of {job_id} — row survives
    expect(await db.JobDetail.findByPk(detail.id)).not.toBeNull();
  });

  it('review detail returns the row (or null) for the customer', async () => {
    const res = await authed(
      request(app).get(`/client/jobs/1/job-reviews/999`),
      token
    );
    expect(res.status).toBe(200);
    expect(res.body).toBeNull(); // pins current behavior: no not-found envelope
  });
});

describe('client subscriptions', () => {
  let customer, token;

  beforeAll(async () => {
    customer = await factories.createCustomer({ email: 'sub-owner@test.local' });
    token = await factories.customerToken(customer);
  });

  it('lists subscriptions unscoped across customers (pins current data-leak behavior)', async () => {
    const stranger = await factories.createCustomer({ email: 'sub-stranger@test.local' });
    await db.Subscription.create({
      customer_id: stranger.id,
      job_type: 'cleaning',
      total_hour: 10,
      used_hour: 0,
      status: 'active',
      next_payment: '2026-10-10',
    });

    const res = await authed(request(app).get('/client/subscriptions'), token);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((s) => s.customer_id === stranger.id)).toBe(true); // leaks
  });

  it('refuses a second active subscription', async () => {
    await db.Subscription.create({
      customer_id: customer.id,
      job_type: 'cleaning',
      total_hour: 10,
      used_hour: 0,
      status: 'active',
      next_payment: '2026-10-10',
    });

    const res = await authed(request(app).post('/client/subscriptions'), token).send({
      total_hour: 5,
      job_type: 'cleaning',
      card_id: 'card_1',
      charge_amount: 750,
      address_id: 1,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('running subscription');
  });

  it('pins current behavior: createSubscription crashes on req.user (undefined on client tier)', async () => {
    const fresh = await factories.createCustomer({ email: 'sub-fresh@test.local' });
    const freshToken = await factories.customerToken(fresh);

    const res = await authed(request(app).post('/client/subscriptions'), freshToken).send({
      total_hour: 5,
      job_type: 'cleaning',
      card_id: 'card_1',
      charge_amount: 750,
      address_id: 1,
    });

    // controller reads req.user.omise_customer_id but clientValidator sets
    // req.customer. pins current behavior
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cannot read propert.*user|undefined/);
  });

  it('cancels the first row in the table regardless of id (pins helper findOne bug)', async () => {
    // findSubscriptionById passes {id} as options, not where — Sequelize warns
    // and returns the FIRST subscription row, so cancel-by-id cancels whoever
    // happens to be first (the stranger from the earlier test here).
    const firstInTable = await db.Subscription.findOne({ order: [['id', 'ASC']] });
    expect(firstInTable.customer_id).not.toBe(customer.id);

    const res = await authed(
      request(app).put('/client/subscriptions/999999/status/cancel'),
      token
    );

    expect(res.status).toBe(201);
    const reloaded = await db.Subscription.findByPk(firstInTable.id);
    expect(reloaded.status).toBe('cancel');

    const txn = await db.SubscriptionTransaction.findOne({
      where: { action: 'cancel' },
      order: [['id', 'DESC']],
    });
    expect(txn.amount).toBe(firstInTable.total_hour - firstInTable.used_hour);
  });
});

describe('client credit cards (omise mocked)', () => {
  let customer, token;

  beforeAll(async () => {
    customer = await factories.createCustomer({ email: 'card-owner@test.local' });
    token = await factories.customerToken(customer);
  });

  it('creates the first card: omise customer created, card row stored (fixed)', async () => {
    // createOmiseCustomer returns just the omise id string; the controller
    // now retrieves the omise customer to read the created card (was a
    // string-destructure crash pinned previously).
    const res = await authed(request(app).post('/client/credit-cards'), token).send({
      name: 'Personal',
      expiration_month: 12,
      expiration_year: 2030,
      brand: 'visa',
      last_digits: '4242',
      card_token: 'tokn_1',
    });

    expect(res.status).toBe(200);
    const card = await db.CreditCard.findOne({ where: { customer_id: customer.id } });
    expect(card).toBeTruthy();
    expect(card.omise_card_id).toMatch(/^card_test_/);
    const reloaded = await db.Customer.findByPk(customer.id);
    expect(reloaded.omise_card_id).toMatch(/^cust_test_/); // legacy column stores the omise customer id
  });

  it('attaches a card to an existing omise customer (fixed TDZ shadowing)', async () => {
    await db.Customer.update(
      { omise_customer_id: 'cust_test_1' },
      { where: { id: customer.id } }
    );

    // `const customer = await attachOmiseCard(customer.omise_customer_id, ...)`
    // shadowed the outer customer inside its own initializer → ReferenceError
    // on every attach. The inner variable is now renamed; attach answers 200.
    const res = await authed(request(app).post('/client/credit-cards'), token).send({
      name: 'Business',
      expiration_month: 6,
      expiration_year: 2029,
      brand: 'mastercard',
      last_digits: '5555',
      card_token: 'tokn_2',
    });

    expect(res.status).toBe(200);
    const cards = await db.CreditCard.findAll({ where: { customer_id: customer.id } });
    const biz = cards.find((c) => c.name === 'Business'); // first-card test also created one
    expect(biz).toBeTruthy();
    expect(biz.omise_card_id).toMatch(/^card_test_/);
  });

  it('lists, counts and details cards scoped to the customer', async () => {
    // seed rows directly (create tests above use a different customer state)
    await db.CreditCard.create({
      name: 'Seed A', expiration_month: 1, expiration_year: 2031,
      brand: 'visa', last_digits: '1111', omise_card_id: 'card_a', customer_id: customer.id,
    });
    await db.CreditCard.create({
      name: 'Seed B', expiration_month: 2, expiration_year: 2032,
      brand: 'visa', last_digits: '2222', omise_card_id: 'card_b', customer_id: customer.id,
    });
    const stranger = await factories.createCustomer({ email: 'card-stranger@test.local' });
    await db.CreditCard.create({
      name: 'Foreign', expiration_month: 3, expiration_year: 2033,
      brand: 'amex', last_digits: '3333', omise_card_id: 'card_c', customer_id: stranger.id,
    });

    const list = await authed(request(app).get('/client/credit-cards'), token);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(4); // Personal + Business from the create tests above, Seed A/B here
    expect(list.body.every((c) => c.customer_id === customer.id)).toBe(true);

    const count = await authed(request(app).get('/client/credit-cards/count'), token);
    expect(count.status).toBe(200);
    expect(count.body).toBe(4);

    const detail = await authed(
      request(app).get(`/client/credit-cards/${list.body[0].id}`),
      token
    );
    expect(detail.status).toBe(200);
    expect(detail.body.id).toBe(list.body[0].id);
  });

  it('removes a card', async () => {
    const card = await db.CreditCard.create({
      name: 'Doomed',
      expiration_month: 1,
      expiration_year: 2028,
      brand: 'amex',
      last_digits: '0000',
      omise_card_id: 'card_doomed',
      customer_id: customer.id,
    });

    const res = await authed(request(app).delete(`/client/credit-cards/${card.id}`), token);
    expect(res.status).toBe(200);
    expect(await db.CreditCard.findByPk(card.id)).toBeNull();
  });
});
