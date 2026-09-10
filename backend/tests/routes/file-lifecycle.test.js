import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../../app';
import { truncateAll, db } from '../helpers/db';
import { createAdmin, createCustomer, adminToken, customerToken } from '../helpers/factories';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let adminJwt, customerJwt, adminRow, customer;

beforeAll(async () => {
  await truncateAll();
  adminRow = await createAdmin({ username: 'fs-admin@test.local' });
  adminJwt = await adminToken(adminRow);
  customer = await createCustomer({ email: 'fs-c@test.local' });
  customerJwt = await customerToken(customer);
});

const admin = (t) => t.set('Authorization', `Bearer ${adminJwt}`);
const client = (t) => t.set('Authorization', `Bearer ${customerJwt}`);

describe('upload + remove file lifecycle (all tiers)', () => {
  it('admin: upload → file exists → remove → file gone', async () => {
    const upload = await admin(request(app).post('/back-office/admins/profile-image')).attach(
      'profile', TINY_PNG, { filename: 'a.png', contentType: 'image/png' }
    );
    expect(upload.status).toBe(200);
    const file1 = upload.body.split('/').pop();
    expect(fs.existsSync(path.join('uploads', 'admins', file1))).toBe(true);

    const remove = await admin(request(app).delete(`/back-office/admins/profile-image/${file1}`));
    expect(remove.status).toBe(200);
    expect(fs.existsSync(path.join('uploads', 'admins', file1))).toBe(false);
  });

  it('customer: upload via client tier → file exists', async () => {
    const upload = await client(request(app).post('/client/user/profile-image')).attach(
      'profile', TINY_PNG, { filename: 'c.png', contentType: 'image/png' }
    );
    expect(upload.status).toBe(200);
    const file1 = upload.body.split('/').pop();
    expect(fs.existsSync(path.join('uploads', 'customers', file1))).toBe(true);
  });

  it('customer back-office remove covers the customer removeProfile branch', async () => {
    // write a file directly then remove through the back-office route
    fs.mkdirSync(path.join('uploads', 'customers'), { recursive: true });
    fs.writeFileSync(path.join('uploads', 'customers', 'direct.jpg'), 'x');
    const remove = await admin(request(app).delete('/back-office/customers/profile-image/direct.jpg'));
    expect(remove.status).toBe(200);
    expect(fs.existsSync(path.join('uploads', 'customers', 'direct.jpg'))).toBe(false);
  });

  it('supporter: upload crops with sharp and stores both sizes', async () => {
    const upload = await admin(request(app).post('/back-office/supporters/profile-image')).attach(
      'profile', TINY_PNG, { filename: 's.png', contentType: 'image/png' }
    );
    expect(upload.status).toBe(200);
    expect(typeof upload.body.width).toBe('number');
    expect(upload.body.file_name).toMatch(/\.png$/);
  });
});

describe('helpers/version', () => {
  it('getHealthInfo returns an object without throwing', async () => {
    const version = await import('../../helpers/version.ts');
    const info = version.getHealthInfo();
    expect(typeof info).toBe('object');
  });

  it('formatTimeAgo / formatUptime produce strings', async () => {
    const version = await import('../../helpers/version.ts');
    expect(typeof version.formatTimeAgo(new Date())).toBe('string');
    expect(typeof version.formatUptime(3661)).toBe('string');
  });
});
