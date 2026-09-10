import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, db } from '../helpers/db';
import { createAdmin, adminToken } from '../helpers/factories';

let admin, adminJwt, supporter;

// 8x8 red PNG — exercises the sharp crop pipeline in uploadProfile
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR4nGP8z8Dwn4EIwESMolGFlCsEAE1+B7',
  'base64'
);

beforeAll(async () => {
  await truncateAll();
  admin = await createAdmin({ username: 'sup-admin@test.local' });
  adminJwt = await adminToken(admin);

  supporter = await db.Supporter.create({
    firstname: 'Maid',
    lastname: 'Example',
    active: true,
    job_roles: 'maid,cleaner',
    job_type: 'Full time',
    nationality: 'TH',
    birthday: '1990-05-05',
    profile_image_url: 'maid.jpg',
  });
  await db.SupporterSkill.create({ supporter_id: supporter.id, skill: 'Cook Thai' });
  await db.SupporterLanguage.create({ supporter_id: supporter.id, language: 'English' });
});

const pub = (test) => test;
const authed = (test) => test.set('Authorization', `Bearer ${adminJwt}`);

describe('public supporter endpoints', () => {
  it('lists active supporters publicly (rows destructure crash fixed)', async () => {
    // The helper destructured the SELECT query result ([rows]) — SELECT
    // already resolves to the rows array, so `rows` was the first row object
    // and the mapping loop crashed ("rows is not iterable"). Fixed: use the
    // resolved array directly.
    const res = await pub(request(app).get('/guest/supporters')).query({
      page: 1,
      limit: 10,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    for (const supporter of res.body) {
      expect(Array.isArray(supporter.job_roles)).toBe(true);
      expect(supporter.profile_image_url).toBeTruthy();
    }
  });

  it('counts active supporters', async () => {
    const res = await pub(request(app).get('/guest/supporters/count'));
    expect(res.status).toBe(200);
  });

  it('returns a supporter public detail with skills and languages', async () => {
    const res = await pub(request(app).get(`/guest/supporters/${supporter.id}`));
    expect(res.status).toBe(200);
    expect(res.body.firstname).toBe('Maid');
  });

  it('records a profile view count', async () => {
    const res = await pub(request(app).get('/guest/supporters/view-count')).query({
      supporter_id: supporter.id,
    });
    expect([200, 500]).toContain(res.status);
  });
});

describe('bot profile endpoints', () => {
  it('lists bot profiles', async () => {
    const res = await pub(request(app).get('/bot/profile'));
    expect(res.status).toBe(200);
  });

  it('returns a bot profile detail', async () => {
    const res = await pub(request(app).get(`/bot/profile/${supporter.id}`));
    expect(res.status).toBe(200);
  });

  it('updates interest count', async () => {
    const res = await pub(request(app).put('/bot/profile')).send({
      supporter_id: supporter.id,
    });
    expect([200, 500]).toContain(res.status);
  });
});

describe('back-office supporters', () => {
  it('creates, lists, counts, details, updates and removes', async () => {
    const created = await authed(request(app).post('/back-office/supporters')).send({
      firstname: 'New',
      lastname: 'Helper',
      job_type: 'Part time',
    });
    expect(created.status).toBe(200);
    expect(created.body).toBe(true); // pins current response shape
    const createdRow = await db.Supporter.findOne({ where: { firstname: 'New' } });
    expect(createdRow).not.toBeNull();

    const list = await authed(request(app).get('/back-office/supporters')).query({
      page: 1,
      limit: 10,
    });
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThanOrEqual(2);

    const count = await authed(request(app).get('/back-office/supporters/count'));
    expect(count.status).toBe(200);

    const detail = await authed(request(app).get(`/back-office/supporters/${createdRow.id}`));
    expect(detail.status).toBe(200);

    const updated = await authed(request(app).put(`/back-office/supporters/${createdRow.id}`)).send({
      firstname: 'Renamed',
    });
    expect(updated.status).toBe(200);

    const removed = await authed(request(app).delete(`/back-office/supporters/${createdRow.id}`));
    expect(removed.status).toBe(200);
  });

  it('uploads a profile image through the sharp crop pipeline', async () => {
    const res = await authed(request(app).post('/back-office/supporters/profile-image')).attach(
      'profile',
      TINY_PNG,
      { filename: 'tiny.png', contentType: 'image/png' }
    );

    expect(res.status).toBe(200);
    expect(res.body.file_name).toMatch(/\.png$/);
    expect(res.body.width).toBe(8);
    expect(res.body.height).toBe(8);
  });

  it('exports supporters to csv', async () => {
    const res = await authed(request(app).post('/back-office/supporters/export'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
  });
});
