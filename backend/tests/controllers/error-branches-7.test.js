import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// job.controller matchSupporter credit_card charge branch: mock the omise
// helper module (ESM) so the charge succeeds deterministically.
vi.mock('../../helpers/omise.ts', () => {
  const chargeCustomerCardById = vi.fn(async (cust, amount) => ({
    id: 'chrg_match_1', amount, status: 'successful',
  }));
  return {
    createOmiseCustomer: vi.fn(),
    findOmiseCustomerById: vi.fn(),
    chargeCustomerCardById,
    getCustomerCardsById: vi.fn(),
    attachOmiseCard: vi.fn(),
    removeOmiseCard: vi.fn(),
  };
});
const paymentRecordSpy = vi.fn(async () => ({ id: 'row1' }));
vi.mock('../../helpers/payment.ts', () => ({
  recordChargeDetail: (...a) => paymentRecordSpy(...a),
}));

import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createCustomer, createAdmin, customerToken, adminToken } from '../helpers/factories';

let customer, token, supporter, adminJwt;

beforeAll(async () => {
  await truncateAll();
  customer = await createCustomer({ email: 'match@test.local', omise_customer_id: 'cust_m' });
  token = await customerToken(customer);
  supporter = await db.Supporter.create({
    firstname: 'Matched', job_type: 'Full time', nationality: 'TH', active: true,
  });
  const admin = await createAdmin({ username: 'match@test.local' });
  adminJwt = await adminToken(admin);
});

describe('job matchSupporter credit_card charge path', () => {
  it('charges via omise, records the charge detail linked to the real job id, commits and responds 200', async () => {
    const job = await db.Job.create({
      status: 'waiting', job_type: 'cleaning', customer_id: customer.id,
      payment_method: 'credit_card', omise_card_id: 'card_1', final_price: 888,
    });

    const res = await request(app)
      .put(`/back-office/jobs/${job.id}/match/${supporter.id}`)
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${adminJwt}`);

    // This path previously hung forever: the credit_card branch never called
    // res.status/commit after recordChargeDetail. The fix commits and answers.
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);

    const call = paymentRecordSpy.mock.calls.at(-1);
    expect(call[0]).toBe('chrg_match_1');
    expect(call[1]).toBe(888);              // job total_price
    expect(call[4]).toBe(job.id);           // real job id now linked (was hardcoded 888 before the fix)
    expect(call[5]).toBe(customer.id);

    // the job update itself was committed
    const reloaded = await db.Job.findByPk(job.id);
    expect(reloaded.status).toBe('match');
    expect(reloaded.supporter_id).toBe(supporter.id);
  });
});
