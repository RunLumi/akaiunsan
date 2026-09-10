import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// --- module-cache patches applied BEFORE the app is imported (dynamic) ------
// blog.controller binds `request` / `html-metadata` at require time, so the
// only reliable interception is replacing the cached exports first and then
// importing the app.
const restoreFns = [];

function patchModule(specifier, mockExports) {
  const resolved = require.resolve(specifier);
  const original = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: mockExports,
  };
  restoreFns.push(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

const nodemailer = require('nodemailer');
const sentMails = [];
const originalCreateTransport = nodemailer.createTransport;
let originalFetch;

let app;
let db, truncateAll;

beforeAll(async () => {
  // blog.controller now fetches post bodies with the native fetch
  originalFetch = global.fetch;
  global.fetch = async (url) => ({
    ok: true,
    status: 200,
    text: async () =>
      '<html><body><div class="entry-content"><p>post body</p><div>dropped</div></div></body></html>',
  });
  patchModule('rss-converter', {
    toJson: async () => ({
      items: [
        {
          title: 'Blog One',
          link: 'https://akaiunsansite.wordpress.com/2026/01/blog-one/',
          guid: 'https://akaiunsansite.wordpress.com/?p=101',
          dc_author: 'writer',
          pubDate: '2026-01-01T00:00:00Z',
          description: 'first post',
          media_thumbnail_url: 'https://img.test/thumb1.jpg',
        },
      ],
    }),
  });
  const scrapeMock = async () => ({
    general: { title: 'Test Post', description: 'A post' },
    openGraph: { image: { url: 'https://img.test/og.jpg', width: 100, height: 50 } },
    twitter: { image: 'https://img.test/twitter.jpg' },
  });
  patchModule('html-metadata', scrapeMock);

  nodemailer.createTransport = () => ({
    sendMail: async (options) => {
      sentMails.push(options);
      return { response: 'queued' };
    },
  });

  app = (await import('../../app')).default;
  ({ db, truncateAll } = await import('../helpers/db'));
  await truncateAll();
});

afterAll(() => {
  nodemailer.createTransport = originalCreateTransport;
  global.fetch = originalFetch;
  restoreFns.forEach((restore) => restore());
});

const pub = (test) => test;

describe('GET /banners/:lang_code', () => {
  it('returns active banners with language overrides and cdn urls', async () => {
    const banner = await db.Banner.create({
      active: true,
      link: 'https://promo.test',
      title: 'Promo',
      image_url: 'desktop.jpg',
      mobile_image_url: 'mobile.jpg',
      ordering: 0,
    });
    await db.BannerLanguage.create({
      banner_id: banner.id,
      lang_code: 'TH', // compare is now case-insensitive, but keep canonical uppercase here
      link: 'https://promo.test/th',
      title: 'โปรโมชั่น',
      image_url: 'desktop-th.jpg',
      mobile_image_url: 'mobile-th.jpg',
    });

    const res = await pub(request(app).get('/banners/th'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      title: 'Promo',
      image_url: 'https://cdn.test.local/banners/desktop-th.jpg',
      mobile_image_url: 'https://cdn.test.local/banners/mobile-th.jpg',
    });
  });

  it('matches language rows stored in lowercase', async () => {
    // was pinned: rows stored lowercase never matched the uppercased param
    const banner = await db.Banner.create({
      active: true,
      title: 'Lowercase Lang',
      link: 'https://promo.test',
      image_url: 'desktop.jpg',
      mobile_image_url: 'mobile.jpg',
      ordering: 2,
    });
    await db.BannerLanguage.create({
      banner_id: banner.id,
      lang_code: 'th',
      link: 'https://promo.test/th',
      title: 'โปรโมชั่น',
      image_url: 'desktop-th.jpg',
      mobile_image_url: 'mobile-th.jpg',
    });

    const res = await pub(request(app).get('/banners/TH'));

    expect(res.status).toBe(200);
    const row = res.body.find((b) => b.title === 'Lowercase Lang');
    expect(row).toBeTruthy();
    expect(row.image_url).toContain('desktop-th.jpg');
  });

  it('skips banners missing image urls or outside their date window', async () => {
    await db.Banner.create({
      active: true,
      title: 'No images',
      link: 'x',
      ordering: 1,
    });
    await db.Banner.create({
      active: true,
      title: 'Expired',
      link: 'x',
      image_url: 'a.jpg',
      mobile_image_url: 'b.jpg',
      start_date: '2020-01-01',
      end_date: '2020-12-31',
      ordering: 2,
    });

    const res = await pub(request(app).get('/banners/en'));
    expect(res.status).toBe(200);
    expect(res.body.every((b) => b.title !== 'No images' && b.title !== 'Expired')).toBe(true);
  });
});

describe('address geography endpoints', () => {
  it('lists provinces, districts and sub-districts', async () => {
    const province = await db.Province.create({ province_name_th: 'กรุงเทพ', province_name_en: 'Bangkok' });
    const district = await db.District.create({
      province_id: province.id,
      district_name_th: 'วัฒนา',
      district_name_en: 'Watthana',
    });
    await db.SubDistrict.create({
      district_id: district.id,
      sub_district_name_th: 'คลองตันเหนือ',
      sub_district_name_en: 'Khlong Tan Nuea',
    });

    const provinces = await pub(request(app).get('/guest/provinces'));
    expect(provinces.status).toBe(200);
    expect(provinces.body.some((p) => p.province_name_en === 'Bangkok')).toBe(true);

    const districts = await pub(request(app).get(
      `/guest/provinces/${province.id}/districts`
    ));
    expect(districts.status).toBe(200);
    expect(districts.body.some((d) => d.district_name_en === 'Watthana')).toBe(true);

    const subDistricts = await pub(request(app).get(
      `/guest/districts/${district.id}/sub-districts`
    ));
    expect(subDistricts.status).toBe(200);
    expect(subDistricts.body.some((s) => s.sub_district_name_en === 'Khlong Tan Nuea')).toBe(true);
  });
});

describe('blog endpoints (external feeds, module-patched)', () => {
  it('lists blog posts from the rss feed', async () => {
    const res = await pub(request(app).get('/blog')).query({ page: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      title: 'Blog One',
      guid: '?p=101',
    });
  });

  it('searches blog posts by keyword', async () => {
    const res = await pub(request(app).get('/blog/search')).query({ keyword: 'one', page: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Blog One');
  });

  it('scrapes post content', async () => {
    const res = await pub(request(app).post('/blog/content')).send({ guid: '101' });
    expect(res.status).toBe(200);
    expect(res.body.metadata).toMatchObject({
      title: 'Test Post',
      description: 'A post',
      image: { url: 'https://img.test/og.jpg', width: 100, height: 50 },
    });
    expect(res.body.content).toContain('post body');
    expect(res.body.content).not.toContain('dropped');
  });
});

describe('mail form endpoints', () => {
  it('contact-us sends a mail and returns true', async () => {
    const res = await pub(request(app).post('/guest/contact-us')).send({
      name: 'Sender',
      email: 'sender@test.local',
      phone_number: '021234567',
      message: 'hello',
    });
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    expect(sentMails.at(-1).subject).toBe('Contact Us message');
    expect(sentMails.at(-1).html).toContain('Sender');
  });

  it('contact-us validates required fields', async () => {
    const res = await pub(request(app).post('/guest/contact-us')).send({ name: 'OnlyName' });
    expect(res.status).toBe(400); // validation carries 400 now
    expect(res.body.message).toBe('Please fill in contact information.');
  });

  it('biz-quotation sends a quotation request', async () => {
    const res = await pub(request(app).post('/guest/biz-quotation')).send({
      name: 'Biz',
      email: 'biz@test.local',
      phone_number: '021234568',
      company_name: 'Acme',
      location: 'Bangkok',
      message: 'quote please',
    });
    expect(res.status).toBe(200);
    expect(sentMails.at(-1).subject).toBe('Request for business quotation');
    expect(sentMails.at(-1).html).toContain('Acme');
  });

  it('employment-request sends an employment mail', async () => {
    const res = await pub(request(app).post('/guest/employment-request')).send({
      name: 'Worker',
      email: 'worker@test.local',
      phone_number: '021234569',
      message: 'hire me',
    });
    expect(res.status).toBe(200);
    expect(sentMails.at(-1).subject).toBe('Employment Request Message');
  });
});

describe('POST /guest/error-logs', () => {
  it('stores a frontend error log', async () => {
    const res = await pub(request(app).post('/guest/error-logs')).send({
      error_location: 'mobile/home',
      error_message: 'boom',
    });
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    const log = await db.ErrorLog.findOne({
      where: { location: 'mobile/home' },
      order: [['id', 'DESC']],
    });
    expect(log.message).toBe('boom');
  });
});
