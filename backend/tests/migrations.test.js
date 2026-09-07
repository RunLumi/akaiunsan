import { describe, it, expect } from 'vitest';
import * as migrator from '../helpers/migrator.ts';
import db from '../models/index.ts';

// Phase 5 TDD: umzug migrations replace boot-time sync(). These tests prove a
// wiped database is fully rebuilt by migrations alone, and that runs are
// idempotent.
const EXPECTED_TABLES = Object.keys(db)
  .filter((k) => !['sequelize', 'Sequelize'].includes(k))
  .map((k) => db[k].getTableName());

describe('umzug migrations (Phase 5)', () => {
  it('runMigrations rebuilds the full schema on a wiped database', async () => {
    await migrator.dropAllTables();

    // every model table gone, bookkeeping gone
    const before = await migrator.listTables();
    expect(before).toHaveLength(0);

    await migrator.runMigrations();

    const tables = await migrator.listTables();
    for (const expected of EXPECTED_TABLES) {
      expect(tables, `missing table ${expected}`).toContain(expected);
    }
    // the umzug bookkeeping table exists too
    expect(tables.some((t) => /SequelizeMeta/i.test(t))).toBe(true);
  });

  it('runMigrations is idempotent (second run is a no-op)', async () => {
    const before = await migrator.listTables();
    await expect(migrator.runMigrations()).resolves.toBeDefined();
    const after = await migrator.listTables();
    expect(after.sort()).toEqual(before.sort());
  });

  it('models work against migration-built tables', async () => {
    const customer = await db.Customer.create({
      firstname: 'Mig', email: 'mig@test.local', active: true,
    });
    expect(customer.id).toBeGreaterThan(0);
    await db.Customer.destroy({ where: { id: customer.id } });
  });
});
