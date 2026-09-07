import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// helpers/omise creates its Omise client at require time — patch the package
// cache BEFORE importing the helper, same pattern as the route suites.
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

const omiseCalls = [];
const omiseFactory = () => ({
  customers: {
    create: async (data) => {
      omiseCalls.push(['customers.create', data]);
      if (data.email === 'fail@test.local') throw new Error('omise rejected create');
      return { id: 'cust_unit_1', ...data, cards: { data: [{ id: 'card_unit_1' }] } };
    },
    retrieve: async (id) => {
      omiseCalls.push(['customers.retrieve', id]);
      if (id === 'missing') throw new Error('customer not found');
      return { id };
    },
    retrieveCard: async (id) => {
      omiseCalls.push(['customers.retrieveCard', id]);
      return { data: [{ id: 'card_a', name: 'VISA X' }, { id: 'card_b' }] };
    },
    update: async (id, payload) => {
      omiseCalls.push(['customers.update', id, payload]);
      return { id, cards: { data: [{ id: 'card_new' }] } };
    },
  },
  charges: {
    create: async (data) => {
      omiseCalls.push(['charges.create', data]);
      if (data.customer === 'cust_cronfail') throw new Error('card declined');
      return { id: 'chrg_unit_1', amount: data.amount, status: 'successful' };
    },
  },
});

let omiseHelper, paymentController, CustomerHelper, db, truncateAll, factories;

beforeAll(async () => {
  patchModule('omise', omiseFactory);
  omiseHelper = (await import('../../helpers/omise')).default ?? await import('../../helpers/omise');
  paymentController = await import('../../controllers/payment.controller');
  CustomerHelper = await import('../../helpers/customer');

  ({ db, truncateAll } = await import('./db'));
  factories = await import('./factories');
  await truncateAll();
});

afterAll(() => {
  restoreFns.forEach((restore) => restore());
});

describe('helpers/omise', () => {
  it('creates customers and returns their id', async () => {
    const id = await omiseHelper.createOmiseCustomer('new@test.local', 'desc', 'tokn');
    expect(id).toBe('cust_unit_1');
  });

  it('propagates creation failures', async () => {
    await expect(
      omiseHelper.createOmiseCustomer('fail@test.local', 'd', 't')
    ).rejects.toThrow('omise rejected create');
  });

  it('retrieves customers', async () => {
    expect((await omiseHelper.findOmiseCustomerById('cust_x')).id).toBe('cust_x');
    await expect(omiseHelper.findOmiseCustomerById('missing')).rejects.toThrow(
      'customer not found'
    );
  });

  it('charges with and without a specific card', async () => {
    const noCard = await omiseHelper.chargeCustomerCardById('cust_x', 500);
    expect(noCard.id).toBe('chrg_unit_1');
    const withCard = await omiseHelper.chargeCustomerCardById('cust_x', 500, 'card_1');
    expect(withCard.amount).toBe(500);
    const last = omiseCalls.at(-1);
    expect(last[1]).toMatchObject({ amount: 500, card: 'card_1', customer: 'cust_x' });
    await expect(omiseHelper.chargeCustomerCardById('cust_cronfail', 100)).rejects.toThrow(
      'card declined'
    );
  });

  it('lists, attaches and removes cards', async () => {
    const cards = await omiseHelper.getCustomerCardsById('cust_x');
    expect(cards).toHaveLength(2);

    const attached = await omiseHelper.attachOmiseCard('cust_x', 'tokn_9');
    expect(attached.cards.data[0].id).toBe('card_new');

    const removed = await omiseHelper.removeOmiseCard('cust_x', 'card_1');
    expect(removed.id).toBe('cust_x');
  });
});

/** Minimal express-style req/res pair for unit-driving unrouted controllers. */
function stubReqRes(req = {}) {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return { req, res };
}

describe('controllers/payment (unrouted; unit-driven)', () => {
  it('makes a first payment by creating an omise customer', async () => {
    const customer = await factories.createCustomer({ email: 'pay1@test.local' });
    const { req, res } = stubReqRes({
      user: customer.toJSON(),
      body: { card_token: 'tokn_first' },
    });

    await paymentController.makePayment(req, res);

    expect(res.statusCode).toBe(200);
    expect(omiseCalls.some((c) => c[0] === 'customers.create')).toBe(true);
    expect(omiseCalls.some((c) => c[0] === 'charges.create')).toBe(true);
    const charge = await db.Charge.findOne({ where: { customer_id: customer.id } });
    expect(charge).not.toBeNull();
    expect(charge.omise_charge_id).toBe('chrg_unit_1');
  });

  it('charges an existing customer default card', async () => {
    const customer = await factories.createCustomer({
      email: 'pay2@test.local',
      omise_customer_id: 'cust_pay2',
    });
    const { req, res } = stubReqRes({ user: customer.toJSON(), body: {} });

    await paymentController.makePayment(req, res);

    expect(res.statusCode).toBe(200);
    const last = omiseCalls.at(-1);
    expect(last[0]).toBe('charges.create');
    expect(last[1].customer).toBe('cust_pay2');
    expect(last[1].card).toBeUndefined();
  });

  it('charges a specific saved card when card_id is provided', async () => {
    const customer = await factories.createCustomer({
      email: 'pay3@test.local',
      omise_customer_id: 'cust_pay3',
    });
    const { req, res } = stubReqRes({
      user: customer.toJSON(),
      body: { card_id: 'card_saved' },
    });

    await paymentController.makePayment(req, res);
    expect(omiseCalls.at(-1)[1].card).toBe('card_saved');
  });

  it('maps omise failures to a 400 envelope', async () => {
    const customer = await factories.createCustomer({
      email: 'pay4@test.local',
      omise_customer_id: 'cust_cronfail', // the omise mock declines this customer
    });
    const { req, res } = stubReqRes({ user: customer.toJSON(), body: {} });

    await paymentController.makePayment(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('card declined');
  });

  it('lists saved cards for an omise-linked customer', async () => {
    const customer = await factories.createCustomer({
      email: 'pay5@test.local',
      omise_customer_id: 'cust_pay5',
    });
    const { req, res } = stubReqRes({ user: customer.toJSON() });

    await paymentController.getCustomerCards(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.result.length).toBeGreaterThanOrEqual(2);
  });

  it('refuses card listing without an omise id', async () => {
    const customer = await factories.createCustomer({ email: 'pay6@test.local' });
    const { req, res } = stubReqRes({ user: customer.toJSON() });

    await paymentController.getCustomerCards(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('saved cards');
  });
});

describe('helpers/subscription.processSubscriptionsPayment (cron)', () => {
  it('charges due subscriptions, resets hours and records recurring transactions', async () => {
    const subscriptionHelper = require('../../helpers/subscription.ts');
    const customer = await factories.createCustomer({
      email: 'cron@test.local',
      omise_customer_id: 'cust_cron',
    });
    await db.Subscription.create({
      customer_id: customer.id,
      job_type: 'cleaning',
      total_hour: 4,
      used_hour: 3,
      status: 'active',
      next_payment: new Date(), // due today
    });

    await subscriptionHelper.processSubscriptionsPayment();

    const sub = await db.Subscription.findOne({ where: { customer_id: customer.id } });
    expect(sub.used_hour).toBe(0);
    expect(sub.status).toBe('active');
    expect(
      dayjsDiffDays(sub.next_payment, new Date())
    ).toBeGreaterThanOrEqual(27); // pushed a month ahead

    const txn = await db.SubscriptionTransaction.findOne({
      where: { subscription_id: sub.id, action: 'buy (recurring)' },
    });
    expect(txn.amount).toBe(4);

    const charge = await db.Charge.findOne({ where: { customer_id: customer.id } });
    expect(charge.amount).toBe(4 * 150);
  });

  it('suspends subscriptions when the charge fails and retries next day', async () => {
    const subscriptionHelper = require('../../helpers/subscription.ts');
    const customer = await factories.createCustomer({
      email: 'cron-fail@test.local',
      omise_customer_id: 'cust_cronfail',
    });
    await db.Subscription.create({
      customer_id: customer.id,
      job_type: 'ironing',
      total_hour: 13, // mock fails on amount 13
      used_hour: 1,
      status: 'active',
      next_payment: new Date(),
    });

    await subscriptionHelper.processSubscriptionsPayment();

    const sub = await db.Subscription.findOne({ where: { customer_id: customer.id } });
    expect(sub.status).toBe('suspended');
    // retry tomorrow (stored as a bare YYYY-MM-DD date string)
    const dayjs = require('dayjs');
    expect(dayjs(sub.next_payment).format('YYYY-MM-DD')).toBe(
      dayjs().add(1, 'day').format('YYYY-MM-DD')
    );
  });
});

function dayjsDiffDays(dateA, dateB) {
  const dayjs = require('dayjs');
  return Math.abs(dayjs(dateA).diff(dayjs(dateB), 'day'));
}
