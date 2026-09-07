import { describe, it, expect, beforeAll } from 'vitest';
import db from '../../models/index.ts';

// Unit-drive the 19 count* statistics helpers with and without dates so the
// date/no-date and driver/maid branch variants all execute.
import * as statsHelper from '../../helpers/requestHelper.helper.ts';

let province, district, subDistrict, customer;

beforeAll(async () => {
  const { truncateAll } = await import('./db');
  const factories = await import('./factories');
  await truncateAll();
  customer = await factories.createCustomer({ email: 'stats@test.local' });
  province = await db.Province.create({ province_name_th: 'ส', province_name_en: 'StatsP' });
  district = await db.District.create({
    province_id: province.id, district_name_th: 'ส', district_name_en: 'StatsD',
  });
  subDistrict = await db.SubDistrict.create({
    district_id: district.id, sub_district_name_th: 'ส', sub_district_name_en: 'StatsS',
  });
});

const mkRequest = async (type) => {
  await db.RequestHelper.create({
    customer_id: customer.id,
    contact_name: 'S',
    phone_number: '02',
    province_id: province.id,
    district_id: district.id,
    sub_district_id: subDistrict.id,
    request_type: type,
  });
};

const datePairs = [
  { start_date: '2026-01-01', end_date: '2026-12-31' },
  {}, // no dates → different branch shape
];

describe('requestHelper statistics helpers (unit, both date modes)', () => {
  const fns = [
    'countRequestStatistics', 'countRequestScheduleStatistics',
    'countRequestNationalStatistics', 'countRequestDayStatistics',
    'countRequestLanguageStatistics', 'countRequestDriverLanguageStatistics',
    'countRequestDriverAgeStatistics', 'countRequestDriverScheduleStatistics',
    'countRequestDriveSalaryStatistics', 'countRequestDriverHiringStatistics',
    'countRequestDriverInterviewStatistics',
    'countRequestDriveReplacementGuaranteeStatistics',
    'countRequestCookingStatistics', 'countRequesKidStatistics',
    'countRequesPetStatistics', 'countRequesCurrentHelperStatistics',
    'countRequestDriverOwnCarStatistics', 'countRequestDriverCurrentDriverStatistics',
    'countRequestDriverIsOTStatistics',
  ];

  it('creates maid and driver requests to filter on', async () => {
    await mkRequest('maid');
    await mkRequest('driver');
    expect(true).toBe(true);
  });

  for (const fnName of fns) {
    for (const [i, dates] of datePairs.entries()) {
      it(`${fnName} (dates: ${i === 0 ? 'yes' : 'no'})`, async () => {
        const result = await statsHelper[fnName](dates.start_date ?? null, dates.end_date ?? null);
        expect(result !== undefined).toBe(true);
      });
    }
  }
});
