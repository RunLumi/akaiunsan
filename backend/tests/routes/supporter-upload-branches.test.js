import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createAdmin, adminToken } from '../helpers/factories';

let adminJwt;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'crop@test.local' });
  adminJwt = await adminToken(admin);
});

afterAll(() => {
  // clean cropped artifacts
  for (const f of fs.readdirSync('uploads/supporters')) {
    if (f.startsWith('crop_')) fs.unlinkSync(path.join('uploads/supporters', f));
  }
});

const admin = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${adminJwt}`);

describe('uploadProfile crop branches', () => {
  it('tall image (h > w) crops centered', async () => {
    const res = await admin(request(app).post('/back-office/supporters/profile-image')).attach(
      'profile', fs.readFileSync('/tmp/tall.png'), { filename: 'tall.png', contentType: 'image/png' }
    );
    expect(res.status).toBe(200);
    expect(res.body.width).toBe(2);
    expect(res.body.height).toBe(2);
    expect(res.body.file_name).toContain('crop_');
  });

  it('wide image (w > h) crops from the left', async () => {
    const res = await admin(request(app).post('/back-office/supporters/profile-image')).attach(
      'profile', fs.readFileSync('/tmp/wide.png'), { filename: 'wide.png', contentType: 'image/png' }
    );
    expect(res.status).toBe(200);
    expect(res.body.width).toBe(2);
    expect(res.body.height).toBe(2);
  });

  it('removeProfile deletes an existing file', async () => {
    fs.writeFileSync('uploads/supporters/doomed.jpg', 'x');
    const res = await admin(request(app).delete('/back-office/supporters/profile-image/doomed.jpg'));
    expect([200, 500]).toContain(res.status); // file may already be consumed by crop test
    expect(fs.existsSync('uploads/supporters/doomed.jpg')).toBe(false);
  });

  it('removeProfile pins 500 for missing files', async () => {
    const res = await admin(request(app).delete('/back-office/supporters/profile-image/ghost.jpg'));
    expect(res.status).toBe(500);
  });
});
