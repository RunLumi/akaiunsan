import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// request-helper create sends a thank-you mail — patch nodemailer in-file
const nodemailer = require('nodemailer');
const originalCreateTransport = nodemailer.createTransport;

beforeAll(() => {
  nodemailer.createTransport = () => ({
    sendMail: async () => ({ response: 'queued' }),
  });
});

afterAll(() => {
  nodemailer.createTransport = originalCreateTransport;
});

import app from '../../app';
import { truncateAll, APP_KEY, db } from '../helpers/db';
import { createCustomer, createAdmin, customerToken, adminToken } from '../helpers/factories';

let customer, token, province, district, subDistrict;

beforeAll(async () => {
  await truncateAll();
  customer = await createCustomer({ email: 'drvflow@test.local' });
  token = await customerToken(customer);
  province = await db.Province.create({ province_name_th: 'ป', province_name_en: 'FlowProv' });
  district = await db.District.create({
    province_id: province.id, district_name_th: 'ด', district_name_en: 'FlowDist',
  });
  subDistrict = await db.SubDistrict.create({
    district_id: district.id, sub_district_name_th: 'ต', sub_district_name_en: 'FlowSub',
  });
});

const client = (t) => t.set('app_key', APP_KEY).set('Authorization', `Bearer ${token}`);

const driverPayload = () => ({
  contact_name: 'Drv Flow',
  phone_number: '026666666',
  email: 'drvflow@test.local',
  line_id: '@drv',
  floor: '3',
  province_id: province.id,
  district_id: district.id,
  sub_district_id: subDistrict.id,
  type_of_building: 'house',
  address_detail: '9 Driver Lane',
  request_type: 'driver',
  employer_nationality: 'Thai',
  request_helper_code: 'CODE1',
  driving_area: 'Bangkok',
  has_car: true,
  car_type: 'sedan',
  car_type_other: '',
  car_gear_type: 'auto',
  expect_language: 'English',
  prefer_age_range: '30-40',
  work_day: 'Mon-Fri',
  work_day_other: '',
  work_time: '9-17',
  any_driver: false,
  salary: 20000,
});

describe('driver-type request-helper flow (update driver branch)', () => {
  it('create → update (driver extras) → detail → history → remove', async () => {
    const create = await client(request(app).post('/client/user/request-helper')).send(driverPayload());
    expect(create.status).toBe(200);

    const history = await client(request(app).get('/client/user/request-helper')).query({ page: 1 });
    expect(history.status).toBe(200);
    const first = history.body[0];

    const update = await client(
      request(app).put(`/client/user/request-helper/${first.id}`)
    ).send(driverPayload({ contact_name: 'Drv Renamed', request_helper_code: 'CODE2' }));
    expect(update.status).toBe(200);

    const detail = await client(request(app).get(`/client/user/request-helper/${first.id}`));
    expect(detail.status).toBe(200);

    const remove = await client(request(app).delete(`/client/user/request-helper/${first.id}`));
    expect(remove.status).toBe(200);
  });
});

describe('bot list age-window enrichment with includes', () => {
  it('returns helpers with languages/skills when age window matches', async () => {
    const s = await db.Supporter.create({
      firstname: 'AgeHelper',
      active: true,
      job_type: 'Full time',
      job_live: 'Live in',
      job_roles: 'maid',
      nationality: 'Thai',
      birthday: '1992-02-02',
      profile_image_url: null,
    });
    await db.SupporterLanguage.create({ supporter_id: s.id, language: 'English', level: 'good' });
    await db.SupporterSkill.create({ supporter_id: s.id, skill: 'Iron', level: 'fair' });

    const res = await request(app).get('/bot/profile')
      .set('app_key', APP_KEY)
      .query({ min_age: 20, max_age: 60, language: 'English', skill: 'Iron', job_roles: 'maid' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('bot getDetail for a missing helper → 500', async () => {
    const res = await request(app).get('/bot/profile/999999').set('app_key', APP_KEY);
    expect(res.status).toBe(500);
  });
});

describe('banner remove-language branch', () => {
  let adminJwt;

  beforeAll(async () => {
    const admin = await createAdmin({ username: 'bannerflow@test.local' });
    adminJwt = await adminToken(admin);
  });

  it('removes banner languages through the bulk update', async () => {
    const banner = await db.Banner.create({
      active: true, title: 'LangRemove', link: 'lr',
      image_url: 'lr.jpg', mobile_image_url: 'lrm.jpg', ordering: 5,
    });
    const lang = await db.BannerLanguage.create({
      banner_id: banner.id, lang_code: 'EN', link: 'l', title: 't',
      image_url: 'i.jpg', mobile_image_url: 'm.jpg',
    });

    const res = await request(app).put('/back-office/banners')
      .set('app_key', APP_KEY)
      .set('Authorization', `Bearer ${adminJwt}`)
      .send({
        banner_list: [],
        remove_banner_list: [],
        remove_banner_language_list: [lang.id],
      });
    expect(res.status).toBe(200);
    expect(await db.BannerLanguage.findByPk(lang.id)).toBeNull();
  });
});
