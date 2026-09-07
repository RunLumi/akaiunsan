import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Error/edge branches for the remaining helpers. ESM vi.mock so the
// instrumented instances get the hit.
vi.mock('../../models/index.ts', () => {
  const boom = async () => { throw new Error('db exploded'); };
  const failing = () => ({
    findOne: vi.fn(boom), findAll: vi.fn(boom), create: vi.fn(boom),
    update: vi.fn(boom), destroy: vi.fn(boom), count: vi.fn(boom),
    bulkCreate: vi.fn(boom),
  });
  const models = {};
  for (const name of [
    'Supporter', 'SupporterSkill', 'SupporterLanguage', 'SupporterExperience',
    'SupporterEducation', 'SupporterViewCount', 'Job', 'JobDetail', 'JobReview',
    'Customer', 'Subscription', 'SubscriptionTransaction', 'ErrorLog',
  ]) {
    models[name] = failing();
  }
  models.ErrorLog = { create: vi.fn(async () => ({})) };
  return { default: { ...models }, ...models };
});

import * as subscriptionHelper from '../../helpers/subscription.ts';
import * as supporterHelper from '../../helpers/supporter.helper.ts';
import { ErrorLog } from '../../models/index.ts';

beforeAll(() => {
  vi.spyOn(ErrorLog, 'create').mockResolvedValue({});
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('helpers/subscription error paths', () => {
  it('findSubscriptionByCustomerId / createSubscription propagate DB failures', async () => {
    await expect(subscriptionHelper.findSubscriptionByCustomerId(1)).rejects.toThrow();
    await expect(subscriptionHelper.createSubscription(1, 5, 'cleaning', 1)).rejects.toThrow();
  });

  it('createSubscriptionTransaction propagates failures', async () => {
    await expect(subscriptionHelper.createSubscriptionTransaction(1, 4, 'buy', null, null))
      .rejects.toThrow();
  });

  it('findSubscriptionById propagates failures', async () => {
    await expect(subscriptionHelper.findSubscriptionById(1)).rejects.toThrow();
  });
});

describe('helpers/supporter.helper error paths', () => {
  it('create wraps model failures', async () => {
    await expect(supporterHelper.create({ firstname: 'x' })).rejects.toThrow();
  });

  it('update wraps model failures', async () => {
    await expect(supporterHelper.update(1, { firstname: 'x' })).rejects.toThrow();
  });

  it('getDetail wraps missing/failed lookups', async () => {
    await expect(supporterHelper.getDetail(1)).rejects.toThrow();
  });

  it('getList / count / getPublicList / getPublicCount propagate failures', async () => {
    await expect(supporterHelper.getList(1, 10, 'id', 'ASC', null, null)).rejects.toThrow();
    await expect(supporterHelper.count(null, null)).rejects.toThrow();
    await expect(supporterHelper.getPublicList({ page: 1, limit: 10 })).rejects.toThrow();
    await expect(supporterHelper.getPublicCount({})).rejects.toThrow();
  });

  it('remove propagates failures', async () => {
    await expect(supporterHelper.remove(1)).rejects.toThrow();
  });
});
