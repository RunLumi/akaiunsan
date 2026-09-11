import { describe, expect, it } from 'vitest';

const { getCatalog, getCatalogItem, getCatalogPrice } =
  await import('../../controllers/mobile-catalog.controller.ts');

function response() {
  const out = { statusCode: 0, body: undefined };
  return {
    status(code) { out.statusCode = code; return this; },
    json(body) { out.body = body; return out; },
    out,
  };
}

describe('mobile catalog contract', () => {
  it('exposes the five documented service groups', () => {
    const res = response();
    getCatalog({}, res);
    expect(res.out.statusCode).toBe(200);
    expect(res.out.body.items).toHaveLength(5);
    expect(res.out.body.items.map((item) => item.serviceType)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns an empty extra-service list instead of null', () => {
    const res = response();
    getCatalogItem({}, res);
    expect(res.out.body).toEqual({ extraService: '[]' });
  });

  it('maps mobile price selectors to a stable price contract', () => {
    const res = response();
    getCatalogPrice({ query: { price: '3' } }, res);
    expect(res.out.body.items[0].serviceType).toBe(2);
    expect(JSON.parse(res.out.body.items[0].pricesModel)).toMatchObject({ two: 350 });
  });
});
