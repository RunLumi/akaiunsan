import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../models/index.ts', () => {
  const boom = async () => { throw new Error('db exploded'); };
  const failing = () => ({
    findOne: vi.fn(boom), findAll: vi.fn(boom), create: vi.fn(boom),
    update: vi.fn(boom), destroy: vi.fn(boom), count: vi.fn(boom),
    findOrCreate: vi.fn(boom), bulkCreate: vi.fn(boom),
  });
  const models = {};
  for (const name of [
    'Supporter', 'SupporterSkill', 'SupporterLanguage', 'SupporterExperience',
    'SupporterEducation', 'SupporterViewCount', 'Job', 'JobDetail', 'JobReview',
    'Customer', 'ErrorLog', 'ImportData',
  ]) {
    models[name] = failing();
  }
  models.ErrorLog = { create: vi.fn(async () => ({})) };
  const tx = { commit: vi.fn(), rollback: vi.fn() };
  const db = { ...models, sequelize: { transaction: vi.fn(async () => tx), query: vi.fn(boom) } };
  return { default: db, ...models, sequelize: db.sequelize, Sequelize: {} };
});

vi.mock('../../helpers/supporter.helper.ts', () => ({
  getPublicList: vi.fn(async () => { throw new Error('list exploded'); }),
  getPublicCount: vi.fn(async () => { throw new Error('count exploded'); }),
  create: vi.fn(async () => { throw new Error('create exploded'); }),
  update: vi.fn(async () => { throw new Error('update exploded'); }),
  getDetail: vi.fn(async () => { throw new Error('detail exploded'); }),
  getList: vi.fn(async () => { throw new Error('getlist exploded'); }),
  count: vi.fn(async () => { throw new Error('count exploded'); }),
  remove: vi.fn(async () => { throw new Error('remove exploded'); }),
}));

import * as supporterController from '../../controllers/supporter.controller.ts';
import * as jobController from '../../controllers/job.controller.ts';
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

describe('supporter.controller error branches', () => {
  it('create / getDetail / getPublicDetail / getList / count / getPublicList / getPublicCount / remove / update → 500', async () => {
    for (const [fn, req] of [
      [supporterController.create, { body: {} }],
      [supporterController.update, { params: { supporter_id: 1 }, body: {} }],
      [supporterController.getDetail, { params: { supporter_id: 1 } }],
      [supporterController.getPublicDetail, { params: { supporter_id: 1 } }],
      [supporterController.getList, { query: { page: 1, limit: 10 } }],
      [supporterController.count, { query: {} }],
      [supporterController.getPublicList, { query: { page: 1, limit: 10 } }],
      [supporterController.getPublicCount, { query: {} }],
      [supporterController.remove, { params: { supporter_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode).toBe(500);
    }
  });

  it('exportFile maps DB failure to 500', async () => {
    const res = stubRes();
    await supporterController.exportFile({}, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('job.controller error branches', () => {
  it('create / update / getDetail / getList / count / remove / matchSupporter / createReview → 500', async () => {
    const customer = { id: 9 };
    for (const [fn, req] of [
      [jobController.create, { customer, body: {} }],
      [jobController.update, { params: { job_id: 1 }, body: {} }],
      [jobController.getDetail, { params: { job_id: 1 } }],
      [jobController.getList, { customer, query: { page: 1, limit: 10 } }],
      [jobController.count, { customer, query: {} }],
      [jobController.remove, { params: { job_id: 1 } }],
      [jobController.matchSupporter, { params: { job_id: 1, supporter_id: 1 } }],
      [jobController.createReview, { customer, params: { job_id: 1 }, body: { rating: 5 } }],
      [jobController.getReviewDetail, { customer, params: { job_id: 1, job_review_id: 1 } }],
      [jobController.updateStatus, { customer, params: { job_id: 1, status: 'cancel' } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode).toBe(500);
    }
  });
});
