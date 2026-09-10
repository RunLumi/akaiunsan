import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import app from '../../app';
import { truncateAll, db } from '../helpers/db';
import { createAdmin, createCustomer, adminToken, ADMIN_PASSWORD } from '../helpers/factories';

// admin register/signup + profile flows send mail
const nodemailer = require('nodemailer');
const originalCreateTransport = nodemailer.createTransport;

beforeAll(() => {
  nodemailer.createTransport = () => ({
    sendMail: async (options) => ({ response: 'queued' }),
  });
});

afterAll(() => {
  nodemailer.createTransport = originalCreateTransport;
});

describe('admin register happy path (empty admins table)', () => {
  beforeAll(async () => {
    await truncateAll();
  });

  it('creates the first admin via /auth/admin/signup', async () => {
    const res = await request(app).post('/auth/admin/signup').send({
      firstname: 'First', lastname: 'Admin', username: 'first@test.local',
      email: 'first@test.local', password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('first@test.local');
    expect(typeof res.body._token).toBe('string');

    const second = await request(app).post('/auth/admin/signup').send({
      firstname: 'Second', username: 'second@test.local', password: ADMIN_PASSWORD,
    });
    expect(second.status).toBe(400);
    expect(second.body.message).toBe('Please login to create new account.');
  });
});

describe('account admin profile flows', () => {
  let admin, token;

  beforeAll(async () => {
    await truncateAll();
    admin = await createAdmin({ username: 'flow@test.local' });
    token = await adminToken(admin);
  });

  const authed = (t) => t.set('Authorization', `Bearer ${token}`);

  it('updatePassword short/mismatch/ok branches', async () => {
    const short = await authed(request(app).put('/back-office/user/password')).send({
      password: ADMIN_PASSWORD, new_password: 'short', confirm_password: 'short',
    });
    expect(short.status).toBe(400);
    expect(short.body.message).toBe('Password must be at least 8 characters.');

    const mismatch = await authed(request(app).put('/back-office/user/password')).send({
      password: ADMIN_PASSWORD, new_password: 'long-enough-pw', confirm_password: 'different-pw',
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.message).toBe('New passsword and confirm password are not matched.');

    const ok = await authed(request(app).put('/back-office/user/password')).send({
      password: ADMIN_PASSWORD, new_password: 'long-enough-pw', confirm_password: 'long-enough-pw',
    });
    expect(ok.status).toBe(200);
  });

  it('uploadProfile without a file → 500 envelope', async () => {
    const res = await authed(request(app).post('/back-office/user/profile-image'));
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('No file uploaded');
  });

  it('requestForgetPassword refuses admins without an email', async () => {
    await db.Admin.create({
      firstname: 'NoEmail', username: 'noemail@test.local', password: 'x', active: true,
    });
    const res = await request(app)
      .post('/auth/admin/forget-password')
      
      .send({ username: 'noemail@test.local' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Unable to reset password.');
  });

  it('removeProfile deletes an existing file (re-signs token if admin was recreated)', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    // Earlier tests in the file mutate the admin row; make sure it exists.
    const current = await db.Admin.findOne({ where: { username: 'flow@test.local' } });
    if (!current) {
      await createAdmin({ username: 'flow@test.local' });
    }
    const freshToken = await adminToken(await db.Admin.findOne({ where: { username: 'flow@test.local' } }));

    const upload = await request(app).post('/back-office/user/profile-image')
      
      .set('Authorization', `Bearer ${freshToken}`)
      .attach('profile', png, { filename: 'dot2.png', contentType: 'image/png' });
    expect(upload.status).toBe(200);
    const fileName = upload.body.split('/').pop();
    expect(fs.existsSync(`uploads/admins/${fileName}`)).toBe(true);

    const remove = await request(app).delete(`/back-office/user/profile-image/${fileName}`)
      
      .set('Authorization', `Bearer ${freshToken}`);
    expect(remove.status).toBe(200);
    expect(fs.existsSync(`uploads/admins/${fileName}`)).toBe(false);
  });
});
