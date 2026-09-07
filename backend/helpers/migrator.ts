import { Umzug, SequelizeStorage } from 'umzug';
import db from '../models/index.ts';

// Umzug wired to the existing Sequelize instance. Migrations are plain .cjs
// files in migrations/ receiving { context: sequelize }.
export const umzug = new Umzug({
  context: db.sequelize,
  migrations: {
    glob: ['migrations/*.cjs', { cwd: process.cwd() }],
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return { name, up: async () => migration.up({ context }), down: async () => migration.down({ context }) };
    },
  },
  storage: new SequelizeStorage({ sequelize: db.sequelize, tableName: 'SequelizeMeta' }),
  logger: undefined,
});

let inFlight: Promise<number> | null = null;

/** Applies pending migrations. Idempotent — safe to call on every boot.
 *  Memoized: app.ts's boot call and the test harness's truncateAll share one
 *  run, so concurrent callers can't both INSERT the same meta row. */
export function runMigrations() {
  if (!inFlight) {
    inFlight = umzug.up().then(() => umzug.migrations().then((m) => m.length));
  }
  return inFlight;
}

/** Names of tables present in the database right now. */
export async function listTables(): Promise<string[]> {
  const dialect = db.sequelize.getDialect();
  if (dialect === 'postgres') {
    const [rows] = await db.sequelize.query(
      "SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public'"
    );
    return (rows as any[]).map((r) => r.name);
  }
  const [rows] = await db.sequelize.query('SHOW TABLES');
  return (rows as any[]).map((r: any) => Object.values(r)[0] as string);
}

export async function dropAllTables() {
  const dialect = db.sequelize.getDialect();
  if (dialect === 'postgres') {
    await db.sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    return;
  }
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  const [rows] = await db.sequelize.query('SHOW TABLES');
  for (const row of rows as any[]) {
    const table = Object.values(row)[0];
    await db.sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}
