import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Statistics catch-blocks: 19 stats endpoints each wrap their helper call in
// try/catch. Force every helper call to throw and drive the handlers.
vi.mock('../../helpers/requestHelper.helper.ts', () => {
  const boom = async () => { throw new Error('stats exploded'); };
  const fn = () => vi.fn(boom);
  return {
    create: fn(), update: fn(), getDetail: fn(), getHistory: fn(),
    getCountHistory: fn(), getCount: fn(), getLastItem: fn(), remove: fn(),
    count: fn(),
    countRequestStatistics: fn(), countRequestScheduleStatistics: fn(),
    countRequestNationalStatistics: fn(), countRequestDayStatistics: fn(),
    countRequestLanguageStatistics: fn(), countRequestDriverLanguageStatistics: fn(),
    countRequestDriverAgeStatistics: fn(), countRequestDriverScheduleStatistics: fn(),
    countRequestDriverSalaryStatistics: fn(), countRequestDriverHiringStatistics: fn(),
    countRequestDriverInterviewStatistics: fn(),
    countRequestDriveReplacementGuaranteeStatistics: fn(),
    countRequestCookingStatistics: fn(), countRequesKidStatistics: fn(),
    countRequesPetStatistics: fn(), countRequesCurrentHelperStatistics: fn(),
    countRequestDriverOwnCarStatistics: fn(), countRequestDriverCurrentDriverStatistics: fn(),
    countRequestDriverIsOTStatistics: fn(),
    requestHelperStatus: {
      create: fn(), update: fn(), getDetail: fn(), getList: fn(), getCount: fn(), remove: fn(),
    },
  };
});

vi.mock('../../models/index.ts', () => {
  const boom = async () => { throw new Error('db exploded'); };
  const failing = () => ({
    findOne: vi.fn(boom), findAll: vi.fn(boom), create: vi.fn(boom),
    update: vi.fn(boom), destroy: vi.fn(boom), count: vi.fn(boom),
  });
  const models = {};
  for (const name of ['RequestHelper', 'RequestHelperStatus', 'Customer', 'ErrorLog', 'Supporter']) {
    models[name] = failing();
  }
  models.ErrorLog = { create: vi.fn(async () => ({})) };
  return { default: { ...models }, ...models };
});

import * as rhController from '../../controllers/requesthelper/index.controller.ts';
import { ErrorLog } from '../../models/index.ts';

function stubRes() {
  return {
    statusCode: null, body: null,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
  };
}

beforeAll(() => {
  vi.spyOn(ErrorLog, 'create').mockResolvedValue({});
});

afterAll(() => {
  vi.restoreAllMocks();
});

const customer = { id: 3 };

describe('requesthelper statistics catch-blocks (19 endpoints)', () => {
  const stats = [
    'getRequestStatistics', 'getRequestScheduleStatistics', 'getRequestNationalStatistics',
    'getRequestDayStatistics', 'getRequestLanguageStatistics', 'getRequestDriverLanguageStatistics',
    'getRequestDriverAgeStatistics', 'getRequestDriverScheduleStatistics',
    'getRequestDriverSalaryStatistics', 'getRequestDriverHiringStatistics',
    'getRequestDriverInterviewStatistics', 'getRequestDriverReplacementGuranteeStatistics',
    'getRequestCookingStatistics', 'getRequesKidStatistics', 'getRequesPetStatistics',
    'getRequesCurrentHelperStatistics', 'getRequestDriverOwnCarStatistics',
    'getRequestDriverCurrentDriverStatistics', 'getRequestDriverIsOTStatistics',
  ];

  for (const name of stats) {
    it(`${name} catch maps to 500`, async () => {
      const res = stubRes();
      await rhController[name]({ query: { start_date: '2026-01-01', end_date: '2026-12-31' } }, res);
      expect(res.statusCode).toBe(500);
    });
  }

  it('create/getDetail/getList/getHistory/getCount/remove catch-blocks → 500', async () => {
    for (const [fn, req] of [
      [rhController.create, { customer, body: {}, headers: {} }],
      [rhController.getDetail, { params: { request_helper_id: 1 } }],
      [rhController.getList, { query: { page: 1, limit: 10 } }],
      [rhController.getHistory, { customer, query: { page: 1 } }],
      [rhController.getCountHistory, { customer }],
      [rhController.getCount, { customer, query: {} }],
      [rhController.remove, { params: { request_helper_id: 1 } }],
      [rhController.update, { params: { request_helper_id: 1 }, body: {} }],
      [rhController.updateStatus, { params: { request_helper_id: 1, request_helper_status_id: 2 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode).toBe(500);
    }
  });

  it('getLastItem maps to 500 and status sub-controller too', async () => {
    const res = stubRes();
    await rhController.getLastItem({ customer, params: { request_type: 'maid' } }, res);
    expect(res.statusCode).toBe(500);

    const res2 = stubRes();
    await rhController.status.getList({ query: { page: 1, limit: 10 } }, res2);
    expect(res2.statusCode).toBe(500);
  });
});
