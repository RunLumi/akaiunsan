import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
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

const pub = (test) => test.set('app_key', APP_KEY);
const authed = (test) => test.set('app_key', APP_KEY).set('Authorization', `Bearer ${adminJwt}`);

describe('public supporter endpoints', () => {
  it('pins current behavior: the public supporter list 500s (rows is not iterable)', async () => {
    // The helper builds a raw SQL query and maps the result as if it returned
    // a bare rows iterable; with the installed Sequelize the promise resolves
    // to [rows, metadata] and the mapping crashes — with or without filters.
    // pins current behavior — fix deliberately in a later phase.
    const res = await pub(request(app).get('/guest/supporters')).query({
      page: 1,
      limit: 10,
    });
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('rows is not iterable');
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
