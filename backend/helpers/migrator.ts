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

/** Applies pending migrations. Idempotent — safe to call on every boot. */
export async function runMigrations() {
  await umzug.up();
  return umzug.migrations().then((m) => m.length);
}

/** Names of tables present in the database right now. */
export async function listTables(): Promise<string[]> {
  const [rows] = await db.sequelize.query('SHOW TABLES');
  return rows.map((r: any) => Object.values(r)[0] as string);
}

/** Drops every table (incl. the migrations bookkeeping) for fresh-rebuild tests. */
export async function dropAllTables() {
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  const [rows] = await db.sequelize.query('SHOW TABLES');
  for (const row of rows) {
    const table = Object.values(row)[0];
    await db.sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}
