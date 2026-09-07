import { RESET_PASSWORD, WRONG_PASSWORD } from '../helpers/credentials';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

// Signup / forget-password send real mail. vi.mock only intercepts ESM
// imports here while the CJS require chain bypasses it, so we patch the
// shared nodemailer module object instead — every consumer (helpers/mail.js,
// install.controller) calls createTransport at send time and gets the stub.
const nodemailer = require('nodemailer');
const sentMails = [];
const originalCreateTransport = nodemailer.createTransport;

beforeAll(() => {
  nodemailer.createTransport = () => ({
    sendMail: async (options) => {
      sentMails.push(options);
      return { response: 'queued' };
    },
  });
});

afterAll(() => {
  nodemailer.createTransport = originalCreateTransport;
});

import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createCustomer, CUSTOMER_PASSWORD } from '../helpers/factories';

let counter = 0;
const uniqueEmail = () => `user${++counter}@test.local`;

beforeAll(async () => {
  await truncateAll();
});

afterEach(async () => {
  sentMails.length = 0;
});

describe('public tier — app_key gate (headerValidator)', () => {
  it('rejects /guest routes without app_key with 401', async () => {
    const res = await request(app).get('/guest/provinces');
    expect(res.status).toBe(401);
  });

  it('rejects /guest routes with a wrong app_key with 401', async () => {
    const res = await request(app).get('/guest/provinces').set('app_key', 'wrong-key');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('wrong-key');
  });
});

describe('POST /auth/signup (customer)', () => {
  it('creates a customer, returns user + token, sends welcome mail', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/auth/signup')
      .set('app_key', APP_KEY)
      .send({ firstname: 'New', lastname: 'User', email, password: 'longenough1' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.password).toBeUndefined();
    expect(typeof res.body._token).toBe('string');

    const stored = await db.Customer.findOne({ where: { email } });
    expect(stored).not.toBeNull();
    expect(stored.password).not.toBe('longenough1'); // bcrypt-hashed
    expect(stored.active).toBe(true);

    expect(sentMails).toHaveLength(1);
    expect(sentMails[0].to).toBe(email);
    expect(sentMails[0].bcc).toBe('sale@ayasan.vn');
    expect(sentMails[0].html).toContain('New');
  });

  it('rejects duplicate email registration', async () => {
    const email = uniqueEmail();
    await createCustomer({ email });

    const res = await request(app)
      .post('/auth/signup')
      .set('app_key', APP_KEY)
      .send({ firstname: 'Dup', lastname: 'Dup', email, password: 'longenough1' });

    expect(res.status).toBe(500); // pins current behavior: business errors map to 500
    expect(res.body.message).toBe('This email is already registered.');
  });

  it('rejects passwords shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .set('app_key', APP_KEY)
      .send({ firstname: 'S', lastname: 'P', email: uniqueEmail(), password: 'short' });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('Password must be at least 8 characters.');
  });

  it('requires app_key', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ firstname: 'A', lastname: 'B', email: uniqueEmail(), password: 'longenough1' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/signin (customer)', () => {
  it('returns user + token for valid credentials', async () => {
    const email = uniqueEmail();
    await createCustomer({ email });

    const res = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email, password: CUSTOMER_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(typeof res.body._token).toBe('string');
  });

  it('rejects a wrong password', async () => {
    const email = uniqueEmail();
    await createCustomer({ email });

    const res = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email, password: WRONG_PASSWORD });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('Email/password is incorrect.');
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email: 'ghost@test.local', password: 'whatever123' });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('Email/password is incorrect.');
  });

  it('rejects an inactive customer', async () => {
    const email = uniqueEmail();
    await createCustomer({ email, active: false });

    const res = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email, password: CUSTOMER_PASSWORD });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('Email/password is incorrect.');
  });
});

describe('POST /auth/forget-password → /auth/reset-password (customer)', () => {
  it('emails a reset token, then resets the password with it', async () => {
    const email = uniqueEmail();
    await createCustomer({ email });

    const forget = await request(app)
      .post('/auth/forget-password')
      .set('app_key', APP_KEY)
      .send({ email });

    expect(forget.status).toBe(200);
    expect(forget.body).toBe(true);
    expect(sentMails).toHaveLength(1);

    // extract the token the controller injected into the mail body
    const html = sentMails[0].html;
    // JWT shape (eyJ… header) — the template's CSS/URLs also contain dot-separated triples
    const tokenMatch = html.match(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch[1];

    const reset = await request(app)
      .post('/auth/reset-password')
      .set('app_key', APP_KEY)
      .send({ _forget_token: token, new_password: RESET_PASSWORD, confirm_password: RESET_PASSWORD });

    expect(reset.status).toBe(200);
    expect(reset.body).toBe(true);

    const signin = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email, password: RESET_PASSWORD });
    expect(signin.status).toBe(200);
  });

  it('refuses forget-password for unknown email', async () => {
    const res = await request(app)
      .post('/auth/forget-password')
      .set('app_key', APP_KEY)
      .send({ email: 'ghost2@test.local' });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('This email is not registered.');
  });

  it('refuses reset-password with mismatched confirmation', async () => {
    const email = uniqueEmail();
    const customer = await createCustomer({ email });
    const { requestForgetPasswordToken } = require('../../helpers/security.ts');
    const token = await requestForgetPasswordToken(email, 'test-host');

    const res = await request(app)
      .post('/auth/reset-password')
      .set('app_key', APP_KEY)
      .send({ _forget_token: token, new_password: RESET_PASSWORD, confirm_password: 'different' });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('New password and confirm password are not matched.');
  });
});

describe('POST /auth/admin/signin', () => {
  it('returns admin profile with permission array for valid credentials', async () => {
    const admin = await require('../helpers/factories').createAdmin({
      username: 'backoffice@test.local',
      email: 'backoffice@test.local',
    });

    const res = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: 'backoffice@test.local', password: require('../helpers/factories').ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('backoffice@test.local');
    expect(res.body.permission).toEqual(['User', 'Banner', 'Request', 'Supporter']);
    expect(typeof res.body._token).toBe('string');
  });

  it('rejects a wrong admin password', async () => {
    await require('../helpers/factories').createAdmin({ username: 'wrongpw@test.local' });

    const res = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: 'wrongpw@test.local', password: 'nope' });

    expect(res.status).toBe(500); // pins current behavior: thrown { status: 400 } is ignored
    expect(res.body.message).toBe('Username/Password is incorrect.');
  });

  it('rejects an unknown admin', async () => {
    const res = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: 'ghost-admin@test.local', password: 'nope' });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('User not found.');
  });
});

describe('GET /back/office/install', () => {
  it('creates the first admin and reports installation, then is a no-op', async () => {
    await truncateAll(); // ensure zero admins

    const first = await request(app).get('/back/office/install');
    expect(first.status).toBe(200);
    expect(first.body.message).toBe('Done installation admin');

    const count = await db.Admin.count();
    expect(count).toBe(1);

    const second = await request(app).get('/back/office/install');
    expect(second.status).toBe(200);
    expect(second.body.message).toBe('Done nothing');
  });

  it('pins current behavior: the installed admin cannot sign in (active flag and role_id are never set)', async () => {
    const res = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: 'sale@ayasan.vn', password: 'whatever' });

    // install.controller creates the admin without `active` (NULL → the
    // `active: true` signin filter misses it) and without role_id (the Role
    // include would be null). The first failure wins: "User not found."
    // pins current behavior — fix deliberately in a later phase, not silently.
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('User not found.');
  });
});
