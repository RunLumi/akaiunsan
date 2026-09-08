import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db.ts';
import { createAdmin, createCustomer, adminToken } from '../helpers/factories.ts';
import { ADMIN_PASSWORD, CUSTOMER_PASSWORD, WRONG_PASSWORD } from '../helpers/credentials';

let admin, customer, adminJwt;

beforeAll(async () => {
  await truncateAll();
  admin = await createAdmin({ username: 'seed-admin@test.local', email: 'seed-admin@test.local' });
  customer = await createCustomer({ email: 'seed-cust@test.local' });
  adminJwt = await adminToken(admin);
});

describe('seed admin account (auth flows)', () => {
  it('admin signin returns token with permission array', async () => {
    const res = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: admin.username, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(admin.username);
    expect(res.body.permission).toEqual(['User', 'Banner', 'Request', 'Supporter']);
    expect(typeof res.body._token).toBe('string');
  });

  it('rejects admin signin with wrong password', async () => {
    const res = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: admin.username, password: WRONG_PASSWORD });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Username/Password is incorrect.');
  });

  it('rejects unknown admin signin', async () => {
    const res = await request(app)
      .post('/auth/admin/signin')
      .set('app_key', APP_KEY)
      .send({ username: 'ghost-admin@test.local', password: WRONG_PASSWORD });

    expect(res.status).toBe(500);
  });

  it('admin forget-password emails a reset link', async () => {
    const nodemailer = require('nodemailer');
    const orig = nodemailer.createTransport;
    const sent = [];
    nodemailer.createTransport = () => ({
      sendMail: async (o) => { sent.push(o); return { response: 'q' }; },
    });

    const res = await request(app)
      .post('/auth/admin/forget-password')
      .set('app_key', APP_KEY)
      .send({ username: admin.username });

    expect(res.status).toBe(200);
    expect(sent.length).toBe(1);
    nodemailer.createTransport = orig;
  });

  it('rejects forget-password for unknown admin', async () => {
    const res = await request(app)
      .post('/auth/admin/forget-password')
      .set('app_key', APP_KEY)
      .send({ username: 'ghost-admin@test.local' });

    expect(res.status).toBe(500);
  });
});

describe('seed customer account (auth flows)', () => {
  it('creates a customer via factory (route covered in public.auth suite)', async () => {
    const stored = await db.Customer.findOne({ where: { email: customer.email } });
    expect(stored).not.toBeNull();
    expect(stored.password.length).toBeGreaterThan(20);
  });

  it('customer signin returns user and token', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email: customer.email, password: CUSTOMER_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(customer.email);
    expect(typeof res.body._token).toBe('string');
  });

  it('rejects customer signin with wrong password', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email: customer.email, password: WRONG_PASSWORD });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Email/password is incorrect.');
  });

  it('rejects signin for non-existent customer', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email: 'nobody@test.local', password: WRONG_PASSWORD });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Email/password is incorrect.');
  });
});
