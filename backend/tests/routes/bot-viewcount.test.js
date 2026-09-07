import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createAdmin, adminToken } from '../helpers/factories';

let adminJwt, supporter, supporterWithViews;

beforeAll(async () => {
  await truncateAll();
  const admin = await createAdmin({ username: 'bot@test.local' });
  adminJwt = await adminToken(admin);

  supporter = await db.Supporter.create({
    firstname: 'Bot Target', job_type: 'Full time', nationality: 'TH',
    profile_image_url: 'bot.jpg',
    job_roles: 'maid,cook',
    birthday: '1995-05-05',
    interest_count: 0,
  });
  supporterWithViews = await db.Supporter.create({
    firstname: 'Viewed', job_type: 'Part time', nationality: 'Lao',
    job_roles: 'maid',
    interest_count: 0,
  });
  await db.SupporterViewCount.create({ supporter_id: supporterWithViews.id, count: 7 });
});

const pub = (t) => t.set('app_key', APP_KEY);

describe('bot controller deeper paths', () => {
  it('getDetail enriches an existing profile image and parses birthday age', async () => {
    const res = await pub(request(app).get(`/bot/profile/${supporter.id}`));
    expect(res.status).toBe(200);
    expect(res.body.image).toContain('supporters/bot.jpg');
    expect(res.body.position_name).toEqual(['maid', 'cook']);
    expect(res.body.age).toBeGreaterThan(0);
  });

  it('getList returns the helper list', async () => {
    const res = await pub(request(app).get('/bot/profile'));
    expect(res.status).toBe(200);
  });

  it('updateInterest syncs interest_count from view counts', async () => {
    const res = await pub(request(app).put('/bot/profile')).send({});
    expect(res.status).toBe(200);
    const reloaded = await db.Supporter.findByPk(supporterWithViews.id);
    expect(reloaded.interest_count).toBe(7);
  });
});
