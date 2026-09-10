import db from '../../models/index.ts';
import { runMigrations } from '../../helpers/migrator.ts';

/**
 * Truncate every application table between test files so suites start clean.
 * The FK-checks toggle and every TRUNCATE must run on the SAME connection —
 * the sequelize pool would otherwise serve them from different connections
 * and MariaDB would still enforce the FK constraints (intermittent flakes).
 */
export async function truncateAll() {
  // Phase 5: schema comes from migrations, not boot-time sync().
  await runMigrations();

  const tableNames = Object.keys(db)
    .filter((k) => !['sequelize', 'Sequelize'].includes(k))
    .map((model) => db[model].getTableName());

  if (tableNames.length === 0) return;

  const dialect = db.sequelize.getDialect();
  if (dialect === 'postgres') {
    // PG: TRUNCATE ... CASCADE handles FKs natively in one statement
    const tableList = tableNames.map((t) => `"${t}"`).join(', ');
    await db.sequelize.query(`TRUNCATE TABLE ${tableList} CASCADE`);
    return;
  }
  const raw = await db.sequelize.connectionManager.getConnection({
    type: 'write',
  });
  const connection = raw.promise();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tableNames) {
      await connection.query(`TRUNCATE TABLE \`${table}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await db.sequelize.connectionManager.releaseConnection(raw);
  }
}

export { db };
