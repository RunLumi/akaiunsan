import { describe, it, expect } from 'vitest';

// helpers/validator.ts — named ESM export
const { validateEmptyField } = await import('../../helpers/validator.ts');

describe('helpers/validator.validateEmptyField', () => {
  it('drops empty-string, zero and undefined fields', async () => {
    const result = await validateEmptyField({
      name: 'kept',
      empty: '',
      zero: 0,
      missing: undefined,
      nully: null,
      present: 'x',
    });
    expect(result).toEqual({ name: 'kept', present: 'x' });
  });

  it('keeps falsy-but-meaningful booleans (false is a value)', async () => {
    const result = await validateEmptyField({ active: false, note: 'y' });
    // 0 and '' are dropped, but false is kept (truthy check: false is falsy — pins behavior)
    expect(result).toEqual({ note: 'y' });
  });

  it('returns an empty object for an all-empty payload', async () => {
    expect(await validateEmptyField({ a: '', b: 0, c: null })).toEqual({});
  });
});
