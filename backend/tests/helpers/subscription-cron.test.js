import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../../models/index.ts';

// processSubscriptionsPayment charges `total_hour * 150` via omise. The omise
// package is patched in the module cache BEFORE the helper import.
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

const charges = [];
patchModule('omise', () => ({
  customers: {},
  charges: {
    create: async (data) => {
      if (data.customer === 'cust_fail') throw new Error('declined');
      charges.push(data);
      return { id: `chrg_${charges.length}`, amount: data.amount, status: 'successful' };
    },
  },
}));

let factories, subscriptionHelper;

beforeAll(async () => {
  const helpers = await import('../helpers/db');
  const truncateAll = helpers.truncateAll;
  factories = await import('../helpers/factories');
  subscriptionHelper = await import('../../helpers/subscription.ts');
  await truncateAll();
});

afterAll(() => {
  restoreFns.forEach((r) => r());
});

function dayjsStr(d) {
  const dayjs = require('dayjs');
  return dayjs(d).format('YYYY-MM-DD');
}

describe('helpers/subscription — remaining branches', () => {
  it('skips subscriptions whose next_payment is not today (already processed guard path)', async () => {
    const customer = await factories.createCustomer({ email: 'skip@test.local' });
    await db.Subscription.create({
      customer_id: customer.id,
      job_type: 'cleaning',
      total_hour: 10,
      used_hour: 1,
      status: 'active',
      next_payment: dayjsStr(Date.now() + 86400000 * 30), // next month
    });

    await subscriptionHelper.processSubscriptionsPayment();

    expect(charges).toHaveLength(0); // not due — untouched
  });

  it('marks already-processed subscriptions and skips a re-charge the same day', async () => {
    const customer = await factories.createCustomer({ email: 'dup@test.local' });
    const sub = await db.Subscription.create({
      customer_id: customer.id,
      job_type: 'cleaning',
      total_hour: 6,
      used_hour: 0,
      status: 'active',
      next_payment: dayjsStr(new Date()),
    });
    // a "buy (recurring)" transaction already exists for today
    await db.SubscriptionTransaction.create({
      subscription_id: sub.id,
      amount: 6,
      action: 'buy (recurring)',
    });

    await subscriptionHelper.processSubscriptionsPayment();

    expect(charges).toHaveLength(0);
    const reloaded = await db.Subscription.findByPk(sub.id);
    expect(reloaded.status).toBe('active'); // untouched
  });

  it('processes multiple due subscriptions in one pass', async () => {
    const c1 = await factories.createCustomer({ email: 'multi1@test.local', omise_customer_id: 'cust_m1' });
    const c2 = await factories.createCustomer({ email: 'multi2@test.local', omise_customer_id: 'cust_m2' });
    await db.Subscription.create({
      customer_id: c1.id, job_type: 'cleaning', total_hour: 2, used_hour: 0,
      status: 'active', next_payment: dayjsStr(new Date()),
    });
    await db.Subscription.create({
      customer_id: c2.id, job_type: 'maid', total_hour: 3, used_hour: 0,
      status: 'suspended', next_payment: dayjsStr(new Date()),
    });

    await subscriptionHelper.processSubscriptionsPayment();

    expect(charges).toHaveLength(2);
    expect(charges.map((c) => c.amount).sort()).toEqual([300, 450]);
  });
});
