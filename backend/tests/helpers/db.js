const loaded = require('../../models/index.ts');
const db = loaded.default ?? loaded;

/**
 * Truncate every application table between test files so suites start clean.
 * The FK-checks toggle and every TRUNCATE must run on the SAME connection —
 * the sequelize pool would otherwise serve them from different connections
 * and MariaDB would still enforce the FK constraints (intermittent flakes).
 */
async function truncateAll() {
  const tableNames = Object.keys(db)
    .filter((k) => !['sequelize', 'Sequelize'].includes(k))
    .map((model) => db[model].getTableName());

  if (tableNames.length === 0) return;

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

/** The app_key every frontend must send (see middlewares/validator.js). */
const APP_KEY = require('../../config/test.json').app_key;

/** Minimal headers a public route expects. */
const publicHeaders = { app_key: APP_KEY };

module.exports = { db, truncateAll, APP_KEY, publicHeaders };
