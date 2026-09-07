const db = require('../../models');

/**
 * Truncate every application table between test files so suites start clean.
 * FOREIGN_KEY_CHECKS=0 makes order irrelevant; Sequelize sync() has already
 * created the schema when the app module was imported.
 */
async function truncateAll() {
  const tableNames = Object.keys(db)
    .filter((k) => !['sequelize', 'Sequelize'].includes(k))
    .map((model) => db[model].getTableName());

  if (tableNames.length === 0) return;

  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of tableNames) {
      await db.sequelize.query(`TRUNCATE TABLE \`${table}\``);
    }
  } finally {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

/** The app_key every frontend must send (see middlewares/validator.js). */
const APP_KEY = require('../../config/test.json').app_key;

/** Minimal headers a public route expects. */
const publicHeaders = { app_key: APP_KEY };

module.exports = { db, truncateAll, APP_KEY, publicHeaders };
