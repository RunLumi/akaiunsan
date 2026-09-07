import { NEW_PASSWORD } from '../helpers/credentials';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import {
  createCustomer,
  createAddress,
  customerToken,
  CUSTOMER_PASSWORD,
} from '../helpers/factories';

beforeAll(async () => {
  await truncateAll();
});

describe('client tier — auth gate (clientValidator)', () => {
  it('rejects /client requests without a token', async () => {
    const res = await request(app).get('/client/addresses').set('app_key', APP_KEY);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization is required.');
  });

  it('rejects /client requests without the Bearer scheme', async () => {
    const res = await request(app)
      .get('/client/addresses')
      .set('app_key', APP_KEY)
      .set('Authorization', 'some-token');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Bearer');
  });

  it('rejects a malformed token', async () => {
    const res = await request(app)
      .get('/client/addresses')
      .set('app_key', APP_KEY)
      .set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ _user: { username: 'customer@test.local' } }, 'wrong-secret');
    const res = await request(app)
      .get('/client/addresses')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const jwt = require('jsonwebtoken');
    const config = require('../../config/test.json');
    const token = jwt.sign({ _user: { username: 'deleted@test.local' } }, config['jwt-secret']);
    const res = await request(app)
      .get('/client/addresses')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /client/verify-token', () => {
  it('returns true for a valid customer token', async () => {
    const customer = await createCustomer({ email: 'vt@test.local' });
    const token = await customerToken(customer);

    const res = await request(app)
      .get('/client/verify-token')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
  });
});

describe('/client/addresses CRUD', () => {
  let customer, otherCustomer, token;

  beforeAll(async () => {
    customer = await createCustomer({ email: 'addr-owner@test.local' });
    otherCustomer = await createCustomer({ email: 'addr-other@test.local' });
    token = await customerToken(customer);
  });

  const authed = (req) => req.set('app_key', APP_KEY).set('Authorization', `Bearer ${token}`);

  it('creates an address owned by the token customer', async () => {
    const res = await authed(request(app).post('/client/addresses')).send({
      firstname: 'Ship',
      lastname: 'To',
      address_detail: '99 Delivery Way',
      address_province: 'Bangkok',
      phone_number: '021234567',
    });

    expect(res.status).toBe(200);
    expect(res.body.address_detail).toBe('99 Delivery Way');
    expect(res.body.customer_id).toBe(customer.id);
  });

  it('lists only the token customer addresses with pagination', async () => {
    await createAddress(customer.id, { address_detail: 'mine-1' });
    await createAddress(customer.id, { address_detail: 'mine-2' });
    await createAddress(otherCustomer.id, { address_detail: 'not-mine' });

    const res = await authed(request(app).get('/client/addresses')).query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3); // 1 from create test + 2 here, otherCustomer excluded
    expect(res.body.every((a) => a.customer_id === customer.id)).toBe(true);
  });

  it('returns the count of owned addresses', async () => {
    const res = await authed(request(app).get('/client/addresses/count'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(3); // bare number, not an envelope — pins current shape
  });

  it('gets an owned address detail', async () => {
    const address = await createAddress(customer.id, { address_detail: 'detail-target' });
    const res = await authed(request(app).get(`/client/addresses/${address.id}`));
    expect(res.status).toBe(200);
    expect(res.body.address_detail).toBe('detail-target');
  });

  it('cannot read another customer address (scoped where finds nothing)', async () => {
    const foreign = await createAddress(otherCustomer.id, { address_detail: 'foreign' });
    const res = await authed(request(app).get(`/client/addresses/${foreign.id}`));
    expect(res.status).toBe(500); // pins current behavior: scoped miss → 500 'Address not found'
    expect(res.body.message).toBe('Address not found');
  });

  it('updates an owned address', async () => {
    const address = await createAddress(customer.id, { address_detail: 'before-update' });
    const res = await authed(request(app).put(`/client/addresses/${address.id}`)).send({
      address_detail: 'after-update',
    });

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    const reloaded = await db.Address.findByPk(address.id);
    expect(reloaded.address_detail).toBe('after-update');
  });

  it('deletes an owned address', async () => {
    const address = await createAddress(customer.id, { address_detail: 'doomed' });
    const res = await authed(request(app).delete(`/client/addresses/${address.id}`));
    expect(res.status).toBe(200);
    expect(await db.Address.findByPk(address.id)).toBeNull();
  });

  it('creates an address without a token fails at the auth gate', async () => {
    const res = await request(app)
      .post('/client/addresses')
      .set('app_key', APP_KEY)
      .send({ address_detail: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('GET /client/user', () => {
  it('returns the token customer without their password hash', async () => {
    const customer = await createCustomer({ email: 'me@test.local' });
    const token = await customerToken(customer);

    const res = await request(app)
      .get('/client/user')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@test.local');
    expect(res.body.user.password).toBeUndefined();
  });

  it('updates the token customer profile', async () => {
    const customer = await createCustomer({ email: 'updater@test.local' });
    const token = await customerToken(customer);

    const res = await request(app)
      .put('/client/user')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: 'Renamed', phone_number: '0898989898' });

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    const reloaded = await db.Customer.findByPk(customer.id);
    expect(reloaded.firstname).toBe('Renamed');
    expect(reloaded.phone_number).toBe('0898989898');
  });

  it('changes the password with the current one and can sign in with the new one', async () => {
    const customer = await createCustomer({ email: 'pwchanger@test.local' });
    const token = await customerToken(customer);

    const wrong = await request(app)
      .put('/client/user/password')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'nope', new_password: NEW_PASSWORD, confirm_password: NEW_PASSWORD });
    expect(wrong.status).toBe(500); // pins current behavior
    expect(wrong.body.message).toBe('Current password is incorrect.');

    const ok = await request(app)
      .put('/client/user/password')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: CUSTOMER_PASSWORD, new_password: NEW_PASSWORD, confirm_password: NEW_PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body).toBe(true);

    const signin = await request(app)
      .post('/auth/signin')
      .set('app_key', APP_KEY)
      .send({ email: 'pwchanger@test.local', password: NEW_PASSWORD });
    expect(signin.status).toBe(200);
  });

  it('rejects a new password shorter than 8 characters', async () => {
    const customer = await createCustomer({ email: 'shortpw@test.local' });
    const token = await customerToken(customer);

    const res = await request(app)
      .put('/client/user/password')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: CUSTOMER_PASSWORD, new_password: 'short', confirm_password: 'short' });

    expect(res.status).toBe(500); // pins current behavior
    expect(res.body.message).toBe('Password must be at least 8 characters.');
  });
});
