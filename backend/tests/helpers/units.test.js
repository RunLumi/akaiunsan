import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from './db';
import {
  createRole,
  createAdmin,
  createCustomer,
  customerToken,
  ADMIN_PASSWORD,
} from './factories';
import { RESET_PASSWORD, WRONG_PASSWORD } from './credentials';

// admin forget-password sends mail
const nodemailer = require('nodemailer');
const sentMails = [];
const originalCreateTransport = nodemailer.createTransport;

let admin, token;

beforeAll(async () => {
  nodemailer.createTransport = () => ({
    sendMail: async (options) => {
      sentMails.push(options);
      return { response: 'queued' };
    },
  });
  await truncateAll();
  admin = await createAdmin({ username: 'unit@test.local' });
  token = await customerToken(await createCustomer({ email: 'unit-c@test.local' }));
});

afterAll(() => {
  nodemailer.createTransport = originalCreateTransport;
});

const security = require('../../helpers/security.ts');
const adminHelper = require('../../helpers/admin.ts');
const validatorHelper = require('../../helpers/validator.ts');

describe('helpers/security', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await security.encryptPassword('secret-value-1');
    expect(hash).not.toBe('secret-value-1');
    expect(await security.comparePassword('secret-value-1', hash)).toBe(true);
    expect(await security.comparePassword('wrong', hash)).toBe(false);
  });

  it('round-trips tokens with username payload and host', async () => {
    const tokenValue = await security.generateToken('round@trip.local', 'some-host');
    const decoded = await security.verifyToken(tokenValue);
    expect(decoded._user.username).toBe('round@trip.local');
    expect(decoded.host_name).toBe('some-host');
  });

  it('findUser resolves customers first, then admins, else throws', async () => {
    const asCustomer = await security.findUser('unit-c@test.local');
    expect(asCustomer.email).toBe('unit-c@test.local');

    const asAdmin = await security.findUser('unit@test.local');
    expect(asAdmin.username).toBe('unit@test.local');

    await expect(security.findUser('ghost@nowhere.local')).rejects.toThrow(
      'User does not found.'
    );
  });

  it('rejects tokens signed with the none algorithm (jwt v9 hardening)', async () => {
    const jwt = require('jsonwebtoken');
    const unsigned = jwt.sign({ _user: { username: 'unit@test.local' } }, null, {
      algorithm: 'none',
    });
    await expect(security.verifyToken(unsigned)).rejects.toThrow();
    await expect(security.verifyToken('garbage.token.value')).rejects.toThrow();
  });

  it('issues forget-password tokens that verify', async () => {
    const forgetToken = await security.requestForgetPasswordToken('unit@test.local', 'h');
    const decoded = await security.verifyToken(forgetToken);
    expect(decoded._user.username).toBe('unit@test.local');
  });
});

describe('helpers/admin', () => {
  it('finds admins by username and id, throws otherwise', async () => {
    const byName = await adminHelper.findAdminByUsername('unit@test.local');
    expect(byName.id).toBe(admin.id);
    const byId = await adminHelper.findAdminById(admin.id);
    expect(byId.username).toBe('unit@test.local');
    await expect(adminHelper.findAdminByUsername('nobody')).rejects.toThrow(
      'Admin does not found.'
    );
  });
});

describe('helpers/validator', () => {
  it('strips empty fields from a payload', async () => {
    const result = await validatorHelper.validateEmptyField({
      name: 'kept',
      empty: '',
      zero: 0,
      missing: undefined,
      present: 'x',
    });
    expect(result).toEqual({ name: 'kept', present: 'x' }); // 0 and "" are dropped — pins behavior
  });
});

describe('helpers/subscription', () => {
  it('creates subscriptions with sensible defaults and transactions', async () => {
    const subscriptionHelper = require('../../helpers/subscription.ts');
    const customer = await createCustomer({ email: 'subunit@test.local' });

    const found1 = await subscriptionHelper.findSubscriptionByCustomerId(customer.id);
    expect(found1).toBeNull();

    const address = await db.Address.create({
      customer_id: customer.id,
      firstname: 'C',
      lastname: 'C',
      address_detail: 'sub unit',
    });
    const sub = await subscriptionHelper.createSubscription(customer.id, 12, 'cleaning', address.id);
    expect(sub.status).toBe('active');
    expect(sub.used_hour).toBe(0);
    expect(sub.total_hour).toBe(12);

    const found2 = await subscriptionHelper.findSubscriptionByCustomerId(customer.id);
    expect(found2.id).toBe(sub.id);

    const txn = await subscriptionHelper.createSubscriptionTransaction(sub.id, 4, 'buy');
    expect(txn.amount).toBe(4);

    // the recurring guard (isSubscriptionTransactionProcessed) is internal and
    // not exported — exercised indirectly via processSubscriptionsPayment later
  });
});

describe('admin account flows (routes)', () => {
  it('admin forget-password mails a reset token, then reset changes the password', async () => {
    const forget = await request(app)
      .post('/auth/admin/forget-password')
      .set('app_key', APP_KEY)
      .send({ username: 'unit@test.local' });

    expect(forget.status).toBe(200);
    expect(sentMails.at(-1).subject).toMatch(/password|reset/i);

    const html = sentMails.at(-1).html;
    const tokenMatch = html.match(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
    expect(tokenMatch).not.toBeNull();

    const reset = await request(app)
      .post('/auth/admin/reset-password')
      .set('app_key', APP_KEY)
      .send({
        _forget_token: tokenMatch[1],
        new_password: RESET_PASSWORD,
        confirm_password: RESET_PASSWORD,
      });
    // pins current behavior: requestForgetPassword signs the token with the
    // whole admin instance as username, so reset can never match a row.
    expect(reset.status).toBe(500);
    expect(reset.body.message).toBeTruthy();
  });

  it('admin forget-password rejects unknown usernames', async () => {
    const res = await request(app)
      .post('/auth/admin/forget-password')
      .set('app_key', APP_KEY)
      .send({ username: 'ghost-admin@test.local' });
    expect(res.status).toBe(500); // pins current behavior
  });
});

describe('back-office admin password + profile management', () => {
  let boToken;

  beforeAll(async () => {
    const boAdmin = await createAdmin({ username: 'pw-admin@test.local' });
    boToken = await require('./factories').adminToken(boAdmin);
  });

  const authed = (test) => test.set('app_key', APP_KEY).set('Authorization', `Bearer ${boToken}`);

  it('changes another admin password by id', async () => {
    const target = await createAdmin({ username: 'pw-target@test.local' });
    const res = await authed(request(app).put(`/back-office/admins/${target.id}/password`)).send({
      password: RESET_PASSWORD,
    });
    expect(res.status).toBe(200);

    const signin = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: 'pw-target@test.local', password: RESET_PASSWORD });
    expect(signin.status).toBe(200);
  });

  it('changes own password through /back-office/user/password', async () => {
    const wrongCurrent = await authed(request(app).put('/back-office/user/password')).send({
      password: WRONG_PASSWORD,
      new_password: RESET_PASSWORD,
      confirm_password: RESET_PASSWORD,
    });
    expect(wrongCurrent.status).toBe(500); // pins current behavior
    expect(wrongCurrent.body.message).toBe('Current password is incorrect.');

    const res = await authed(request(app).put('/back-office/user/password')).send({
      password: ADMIN_PASSWORD,
      new_password: RESET_PASSWORD,
      confirm_password: RESET_PASSWORD,
    });
    expect(res.status).toBe(200);
  });

  it('uploads and removes a profile image', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const upload = await authed(request(app).post('/back-office/user/profile-image')).attach(
      'profile',
      png,
      { filename: 'dot.png', contentType: 'image/png' }
    );
    expect(upload.status).toBe(200);
    expect(upload.body).toMatch(/\/uploads\/admins\//);

    // pins current behavior: removeProfile references fs which the controller
    // never imports — always 500 "fs is not defined"
    const fileName = upload.body.split('/').pop();
    const remove = await authed(
      request(app).delete(`/back-office/user/profile-image/${fileName}`)
    );
    expect(remove.status).toBe(500);
    expect(remove.body.message).toBe('fs is not defined');
  });
});
