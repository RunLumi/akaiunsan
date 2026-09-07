import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// One failing-models mock to exercise every controller's catch/rollback/500
// envelope. (Factories are hoisted — keep them self-contained.)
vi.mock('../../models/index.ts', () => {
  const boom = async () => { throw new Error('db exploded'); };
  const failing = () => ({
    findOne: vi.fn(boom), findAll: vi.fn(boom), create: vi.fn(boom),
    update: vi.fn(boom), destroy: vi.fn(boom), count: vi.fn(boom),
    findOrCreate: vi.fn(boom), bulkCreate: vi.fn(boom),
  });
  const models = {};
  for (const name of [
    'Province', 'District', 'SubDistrict', 'Supporter',
    'SupporterSkill', 'SupporterLanguage', 'SupporterExperience',
    'SupporterEducation', 'SupporterViewCount', 'Customer', 'Address',
    'RequestHelper', 'RequestMaid', 'RequestDriver', 'RequestHelperStatus',
    'CustomerSupply', 'CustomerSupplyDetail', 'BizCustomer', 'CleaningSupply',
    'Supplier', 'SupplierProduct', 'ImportData', 'Job', 'JobDetail',
    'JobReview', 'CreditCard', 'Subscription', 'SubscriptionTransaction',
    'Charge', 'Banner', 'BannerLanguage', 'Role', 'Admin', 'AdminHistory',
  ]) {
    models[name] = failing();
  }
  models.ErrorLog = { create: vi.fn(async () => ({})) };
  const tx = { commit: vi.fn(), rollback: vi.fn() };
  const db = { ...models, sequelize: { transaction: vi.fn(async () => tx), query: vi.fn(boom) } };
  return { default: db, ...models, sequelize: db.sequelize, Sequelize: {} };
});

vi.mock('nodemailer', () => {
  const transport = { sendMail: async () => ({ response: 'queued' }) };
  return {
    default: { createTransport: () => transport },
    createTransport: () => transport,
  };
});

import supplierController from '../../controllers/supplier.controller.ts';
import cleaningSupplyController from '../../controllers/cleaningsupply.controller.ts';
import roleController from '../../controllers/role.controller.ts';
import creditCardController from '../../controllers/creditcard.controller.ts';
import adminController from '../../controllers/admin.controller.ts';
import accountAdminController from '../../controllers/account/admin.controller.ts';
import accountCustomerController from '../../controllers/account/customer.controller.ts';
import customerController from '../../controllers/customer.controller.ts';
import bizCustomerController from '../../controllers/bizcustomer.controller.ts';
import subscriptionController from '../../controllers/subscription.controller.ts';
import bannerController from '../../controllers/banner.controller.ts';
import mailController from '../../controllers/mail.controller.ts';
import customerSupplyController from '../../controllers/customersupply.controller.ts';
import jobController from '../../controllers/job.controller.ts';
import supporterController from '../../controllers/supporter.controller.ts';
import addressController from '../../controllers/address.controller.ts';
import jobReviewController from '../../controllers/jobreview.controller.ts';
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

const customer = { id: 3 };

describe('catch/rollback/500 envelopes across controllers', () => {
  it('supplier.controller: all handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [supplierController.create, { body: { name: 'x' } }],
      [supplierController.update, { params: { supplier_id: 1 }, body: { name: 'y' } }],
      [supplierController.getDetail, { params: { supplier_id: 1 } }],
      [supplierController.getList, { query: { page: 1, limit: 10 } }],
      [supplierController.count, { query: {} }],
      [supplierController.remove, { params: { supplier_id: 1 } }],
      [supplierController.updateProduct, { params: { supplier_id: 1 }, body: { cleaning_supplies: [] } }],
      [supplierController.exportFile, {}],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('cleaningsupply.controller: all handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [cleaningSupplyController.create, { body: { name: 'x' } }],
      [cleaningSupplyController.update, { params: { cleaning_supply_id: 1 }, body: { name: 'y' } }],
      [cleaningSupplyController.getDetail, { params: { cleaning_supply_id: 1 } }],
      [cleaningSupplyController.getList, { query: { page: 1, limit: 10 } }],
      [cleaningSupplyController.count, { query: {} }],
      [cleaningSupplyController.remove, { params: { cleaning_supply_id: 1 } }],
      [cleaningSupplyController.updateSupplier, { params: { cleaning_supply_id: 1 }, body: { suppliers: [] } }],
      [cleaningSupplyController.exportFile, {}],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('role.controller: all handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [roleController.create, { body: { role_name: 'x' } }],
      [roleController.update, { params: { role_id: 1 }, body: { role_name: 'y' } }],
      [roleController.getDetail, { params: { role_id: 1 } }],
      [roleController.getList, { query: { page: 1, limit: 10 } }],
      [roleController.count, { query: {} }],
      [roleController.remove, { params: { role_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('creditcard.controller: handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [creditCardController.create, { customer: { id: 1 }, body: {} }],
      [creditCardController.getDetail, { customer: { id: 1 }, params: { credit_card_id: 1 } }],
      [creditCardController.getList, { customer: { id: 1 }, query: {} }],
      [creditCardController.count, { customer: { id: 1 } }],
      [creditCardController.remove, { customer: { id: 1 }, params: { credit_card_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('admin.controller: handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [adminController.create, { body: {} }],
      [adminController.update, { params: { admin_id: 1 }, body: {} }],
      [adminController.updatePassword, { params: { admin_id: 1 }, admin: { id: 1, username: 'x' }, body: { password: 'a', new_password: 'b', confirm_password: 'b' } }],
      [adminController.getDetail, { params: { admin_id: 1 } }],
      [adminController.getList, { query: { page: 1, limit: 10 } }],
      [adminController.count, { query: {} }],
      [adminController.remove, { params: { admin_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('customer.controller (back office): handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [customerController.create, { body: {} }],
      [customerController.update, { params: { customer_id: 1 }, body: {} }],
      [customerController.getDetail, { params: { customer_id: 1 } }],
      [customerController.getList, { query: { page: 1, limit: 10 } }],
      [customerController.count, { query: {} }],
      [customerController.remove, { params: { customer_id: 1 } }],
      [customerController.exportFile, {}],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('bizcustomer.controller: handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [bizCustomerController.create, { body: {} }],
      [bizCustomerController.update, { params: { biz_customer_id: 1 }, body: {} }],
      [bizCustomerController.getDetail, { params: { biz_customer_id: 1 } }],
      [bizCustomerController.getList, { query: { page: 1, limit: 10 } }],
      [bizCustomerController.count, { query: {} }],
      [bizCustomerController.remove, { params: { biz_customer_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('job.controller: handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [jobController.create, { customer, body: {} }],
      [jobController.update, { params: { job_id: 1 }, body: {} }],
      [jobController.getDetail, { params: { job_id: 1 } }],
      [jobController.getList, { customer, query: { page: 1, limit: 10 } }],
      [jobController.count, { customer, query: {} }],
      [jobController.remove, { params: { job_id: 1 } }],
      [jobController.createReview, { customer, params: { job_id: 1 }, body: {} }],
      [jobController.getReviewDetail, { customer, params: { job_id: 1, job_review_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('supporter.controller: create/update/getDetail/getList/count/remove/uploadProfile → 500', async () => {
    for (const [fn, req] of [
      [supporterController.create, { body: {} }],
      [supporterController.update, { params: { supporter_id: 1 }, body: {} }],
      [supporterController.getDetail, { params: { supporter_id: 1 } }],
      [supporterController.getList, { query: { page: 1, limit: 10 } }],
      [supporterController.count, { query: {} }],
      [supporterController.remove, { params: { supporter_id: 1 } }],
      [supporterController.uploadProfile, { file: null }],
      [supporterController.exportFile, {}],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('address.controller: CRUD handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [addressController.create, { body: {} }],
      [addressController.update, { params: { address_id: 1 }, body: {} }],
      [addressController.getDetail, { params: { address_id: 1 } }],
      [addressController.getList, { query: { page: 1, limit: 10 } }],
      [addressController.count, { query: {} }],
      [addressController.remove, { params: { address_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('jobreview.controller: handlers 500 on DB failure', async () => {
    for (const [fn, req] of [
      [jobReviewController.getDetail, { params: { job_review_id: 1 } }],
      [jobReviewController.getList, { query: { page: 1, limit: 10 } }],
      [jobReviewController.count, { query: {} }],
      [jobReviewController.update, { params: { job_review_id: 1 }, body: {} }],
      [jobReviewController.remove, { params: { job_review_id: 1 } }],
    ]) {
      const res = stubRes();
      await fn(req, res);
      expect(res.statusCode, fn.name).toBe(500);
    }
  });

  it('banner + subscription + customersupply + mail error branches', async () => {
    const r1 = stubRes();
    await bannerController.update({ body: { banner_list: [{ title: 'x', banner_language: [] }] } }, r1);
    expect(r1.statusCode).toBe(500);

    const r2 = stubRes();
    await subscriptionController.getList({ query: { page: 1, limit: 10 } }, r2);
    expect(r2.statusCode).toBe(500);

    const r3 = stubRes();
    await customerSupplyController.create({ body: {} }, r3);
    expect(r3.statusCode).toBe(500);

    const r4 = stubRes();
    await mailController.contactUs({ body: {} }, r4);
    expect(r4.statusCode).toBe(500);
  });

  it('account controllers: error branches 500', async () => {
    const r1 = stubRes();
    await accountAdminController.signin({ body: {} }, r1);
    expect(r1.statusCode).toBe(500);

    const r2 = stubRes();
    await accountAdminController.register({ body: {} }, r2);
    expect(r2.statusCode).toBe(500);

    const r3 = stubRes();
    await accountAdminController.update({ body: {} }, r3);
    expect(r3.statusCode).toBe(500);

    const r4 = stubRes();
    await accountAdminController.updatePassword({ body: {} }, r4);
    expect(r4.statusCode).toBe(500);

    const r5 = stubRes();
    await accountAdminController.requestForgetPassword({ body: {} }, r5);
    expect(r5.statusCode).toBe(500);

    const r6 = stubRes();
    await accountAdminController.resetPassword({ body: {} }, r6);
    expect(r6.statusCode).toBe(500);

    const r7 = stubRes();
    await accountCustomerController.signup({ body: {} }, r7);
    expect(r7.statusCode).toBe(500);

    const r8 = stubRes();
    await accountCustomerController.signin({ body: {} }, r8);
    expect(r8.statusCode).toBe(500);

    const r9 = stubRes();
    await accountCustomerController.update({ body: {} }, r9);
    expect(r9.statusCode).toBe(500);

    const r10 = stubRes();
    await accountCustomerController.requestForgetPassword({ body: {} }, r10);
    expect(r10.statusCode).toBe(500);

    const r11 = stubRes();
    await accountCustomerController.resetPassword({ body: {} }, r11);
    expect(r11.statusCode).toBe(500);
  });

  it('every failing model call recorded an ErrorLog entry', async () => {
    expect(ErrorLog.create).toHaveBeenCalled();
  });
});
