import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// address.json.controller catches DB errors and writes an ErrorLog + 500.
// Triggering that naturally requires a DB failure — mock the models module
// (ESM sources now, so vi.mock intercepts) and unit-drive the handlers.
vi.mock('../../models/index.ts', () => {
  const err = { create: vi.fn(async () => ({})) };
  const mk = (rejects) => ({
    findAll: vi.fn(async () => { throw new Error('db down'); }),
  });
  return {
    default: { Province: mk(), District: mk(), SubDistrict: mk(), ErrorLog: err },
    Province: mk(),
    District: mk(),
    SubDistrict: mk(),
    ErrorLog: err,
  };
});

import * as controller from '../../controllers/address.json.controller.ts';
import { ErrorLog } from '../../models/index.ts';

function stubRes() {
  return {
    statusCode: null,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
  };
}

beforeAll(async () => {
  // silence the ErrorLog.create calls if they use the default export shape
  if (ErrorLog && ErrorLog.create) vi.spyOn(ErrorLog, 'create').mockResolvedValue({});
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('address.json error branches', () => {
  it('getProvinceList maps a DB failure to the 500 envelope', async () => {
    const res = stubRes();
    await controller.getProvinceList({}, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('db down');
    expect(ErrorLog.create).toHaveBeenCalled();
  });

  it('getDistrictList maps a DB failure to the 500 envelope', async () => {
    const res = stubRes();
    await controller.getDistrictList({ params: { province_id: 1 } }, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('db down');
  });

  it('getSubDistrictList maps a DB failure to the 500 envelope', async () => {
    const res = stubRes();
    await controller.getSubDistrictList({ params: { district_id: 1 } }, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('db down');
  });
});
