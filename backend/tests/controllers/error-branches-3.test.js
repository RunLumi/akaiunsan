import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Error-branch coverage for requesthelper (index + status) and
// customersupply/bizcustomer/agency-maid controllers via a failing model layer.
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
    'RequestHelper', 'RequestMaid', 'RequestDriver', 'RequestHelperStatus',
    'CustomerSupply', 'CustomerSupplyDetail', 'BizCustomer',
    'CleaningSupply', 'Supplier', 'SupplierProduct', 'ImportData', 'Job',
  ]) {
    models[name] = failing();
  }
  models.ErrorLog = { create: vi.fn(async () => ({})) };
  const tx = { commit: vi.fn(), rollback: vi.fn() };
  const db = {
    ...models,
    sequelize: { transaction: vi.fn(async () => tx), query: vi.fn(boom) },
  };
  return { default: db, ...models, sequelize: db.sequelize, Sequelize: {} };
});

vi.mock('../../helpers/agencyData.ts', () => ({
  pairSkill: async () => ({ skill_list: [], language_list: [] }),
  pairExperience: async () => [],
  getAllStat: async () => { throw new Error('stat down'); },
  correctNationality: (n) => n,
  getMaidProfile: async () => 'maid_1.jpg',
  getDriverProfile: async () => 'driver_1.jpg',
  getSuppoterFromAgency: async () => { throw new Error('agency down'); },
  getSkillFromAgency: async () => { throw new Error('agency down'); },
  getExperienceFromAgency: async () => { throw new Error('agency down'); },
  getDriver: async () => { throw new Error('m.json missing'); },
  getDriverSkill: async () => [],
  getDriverExperience: async () => [],
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: async () => ({ response: 'q' }) }) },
  createTransport: () => ({ sendMail: async () => ({ response: 'q' }) }),
}));

import * as requestHelperController from '../../controllers/requesthelper/index.controller.ts';
import * as statusController from '../../controllers/requesthelper/status.controller.ts';
import * as customerSupplyController from '../../controllers/customersupply.controller.ts';
import * as bizCustomerController from '../../controllers/bizcustomer.controller.ts';
import * as agencyMaidController from '../../controllers/agency/maid.controller.ts';
import * as agencyDriverController from '../../controllers/agency/driver.controller.ts';
import * as util from '../../helpers/util.ts';
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

const cust = { id: 5, email: 'x@y.z' };

describe('requesthelper controller error branches', () => {
  it('create / update / getDetail / getHistory / getCountHistory / getCount → 500', async () => {
    const res1 = stubRes();
    await requestHelperController.create({ customer: { id: 5 }, body: {}, headers: {} }, res1);
    expect(res1.statusCode).toBe(500);

    const res2 = stubRes();
    await requestHelperController.update({ params: { request_helper_id: 1 }, body: {} }, res2);
    expect(res2.statusCode).toBe(500);

    const res3 = stubRes();
    await requestHelperController.getDetail({ params: { request_helper_id: 1 } }, res3);
    expect(res3.statusCode).toBe(500);

    const res4 = stubRes();
    await requestHelperController.getHistory({ customer: { id: 5 }, query: { page: 1 } }, res4);
    expect(res4.statusCode).toBe(500);

    const res5 = stubRes();
    await requestHelperController.getCountHistory({ customer: { id: 5 } }, res5);
    expect(res5.statusCode).toBe(500);

    const res6 = stubRes();
    await requestHelperController.getCount({ customer: { id: 5 }, query: {} }, res6);
    expect(res6.statusCode).toBe(500);
  });

  it('statistics endpoints map DB failure to 500', async () => {
    const res = stubRes();
    await requestHelperController.getRequestStatistics(
      { query: { start_date: '2026-01-01', end_date: '2026-12-31' } }, res
    );
    expect(res.statusCode).toBe(500);
  });

  it('remove maps DB failure to 500', async () => {
    const res = stubRes();
    await requestHelperController.remove({ params: { request_helper_id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('status controller error branches', () => {
  it('create / update / getDetail / getList / getCount / remove → 500', async () => {
    for (const [fn, req] of [
      [statusController.create, { body: { status_name: 'x' } }],
      [statusController.update, { params: { request_helper_status_id: 1 }, body: { status_name: 'y' } }],
      [statusController.getDetail, { params: { request_helper_status_id: 1 } }],
      [statusController.getList, { query: { page: 1, limit: 10 } }],
      [statusController.getCount, { query: {} }],
      [statusController.remove, { params: { request_helper_status_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode).toBe(500);
    }
  });
});

describe('customersupply + bizcustomer error branches', () => {
  it('create / update / getDetail / getList / count / remove → 500', async () => {
    for (const ctrl of [customerSupplyController, bizCustomerController]) {
      for (const [fn, req] of [
        [ctrl.create, { body: {} }],
        [ctrl.update, { params: { id: 1 }, body: {} }],
        [ctrl.getDetail, { params: { id: 1 } }],
        [ctrl.getList, { query: { page: 1, limit: 10 } }],
        [ctrl.count, { query: {} }],
        [ctrl.remove, { params: { id: 1 } }],
      ]) {
        const res = stubRes();
        await fn(req, res);
        expect(res.statusCode).toBe(500);
      }
    }
  });
});

describe('agency maid/driver controllers error branches', () => {
  it('create / update / remove / uploadProfile / updateAllStat → 500', async () => {
    for (const ctrl of [agencyMaidController, agencyDriverController]) {
      for (const [fn, req] of [
        [ctrl.create, { body: {} }],
        [ctrl.update, { params: { maid_id: 1, driver_id: 1 }, body: {} }],
        [ctrl.remove, { params: { maid_id: 1, driver_id: 1 } }],
        [ctrl.uploadProfile, { params: { maid_id: 1, driver_id: 1 } }],
        [ctrl.updateAllStat, { query: {} }],
      ]) {
        const res = stubRes();
        await fn(req, res);
        expect(res.statusCode).toBe(500);
      }
    }
  });
});

describe('helpers/util error branches', () => {
  it('findOnAgency rejects when the legacy row is missing', async () => {
    await expect(util.findOnAgency('maid', 'maid_ID', 'maid_ID')).rejects.toThrow();
  });

  it('uploadSupporterProfileImage propagates sftp failures', async () => {
    const Client = require('ssh2-sftp-client');
    const original = Client.prototype.connect;
    Client.prototype.connect = () => Promise.reject(new Error('sftp down'));
    try {
      await expect(util.uploadSupporterProfileImage('x.jpg')).rejects.toThrow('sftp down');
    } finally {
      Client.prototype.connect = original;
    }
  });
});
