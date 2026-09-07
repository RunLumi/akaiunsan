import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Error branches of small controllers/helpers: force the model layer to
// reject and pin the 500-envelope mapping each controller performs.
// (vi.mock factories are hoisted — everything must be self-contained.)
vi.mock('../../models/index.ts', () => {
  const boom = async () => { throw new Error('db exploded'); };
  const failing = () => ({
    findOne: vi.fn(boom),
    findAll: vi.fn(boom),
    create: vi.fn(boom),
    update: vi.fn(boom),
    destroy: vi.fn(boom),
    count: vi.fn(boom),
    findOrCreate: vi.fn(boom),
    bulkCreate: vi.fn(boom),
  });
  const models = {};
  for (const name of [
    'Province', 'District', 'SubDistrict', 'Supporter',
    'SupporterSkill', 'SupporterLanguage', 'SupporterExperience',
    'SupporterEducation', 'SupporterViewCount', 'Customer', 'Address',
  ]) {
    models[name] = failing();
  }
  models.ErrorLog = { create: vi.fn(async () => ({})) };
  const db = {
    ...models,
    sequelize: {
      transaction: vi.fn(async () => ({ commit: vi.fn(), rollback: vi.fn() })),
      query: vi.fn(boom),
    },
  };
  return { default: db, ...models, sequelize: db.sequelize, Sequelize: {} };
});

import * as botController from '../../controllers/bot/index.controller.ts';
import * as jobReviewController from '../../controllers/jobreview.controller.ts';
import * as adminHelper from '../../helpers/admin.ts';
import * as customerHelper from '../../helpers/customer.ts';
import * as securityHelper from '../../helpers/security.ts';
import { ErrorLog } from '../../models/index.ts';

function stubRes() {
  return {
    statusCode: null, body: null,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
    send(p) { this.body = p; return this; },
  };
}

beforeAll(() => {
  vi.spyOn(ErrorLog, 'create').mockResolvedValue({});
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('bot controller error branches', () => {
  it('getDetail maps DB failure to 500', async () => {
    const res = stubRes();
    await botController.getDetail({ params: { helper_id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getList maps DB failure to 500', async () => {
    const res = stubRes();
    await botController.getList({ query: {} }, res);
    expect(res.statusCode).toBe(500);
  });

  it('updateInterest maps DB failure to 500', async () => {
    const res = stubRes();
    await botController.updateInterest({ body: {} }, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('jobreview controller error branches', () => {
  it('getDetail / getList / count / update map DB failure to 500', async () => {
    for (const [fn, req] of [
      [jobReviewController.getDetail, { params: { job_review_id: 1 } }],
      [jobReviewController.getList, { query: { page: 1, limit: 10 } }],
      [jobReviewController.count, { query: {} }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode).toBe(500);
    }
  });
});

describe('helpers error branches', () => {
  it('admin.findAdminByUsername / findAdminById propagate DB errors', async () => {
    await expect(adminHelper.findAdminByUsername('x')).rejects.toThrow();
    await expect(adminHelper.findAdminById(1)).rejects.toThrow();
  });

  it('customer helper finders propagate DB errors', async () => {
    const ch = await import('../../helpers/customer.ts');
    await expect(ch.findCustomerByEmail('x')).rejects.toThrow();
    await expect(ch.findCustomerById(1)).rejects.toThrow();
    await expect(ch.findCustomerCards(1)).rejects.toThrow();
  });

  it('security.findUser propagates DB errors', async () => {
    await expect(securityHelper.findUser('x')).rejects.toThrow();
  });
});
