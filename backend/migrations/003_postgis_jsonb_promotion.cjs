// Phase 7 promotion: PostGIS + JSONB on PostgreSQL (no-op on MySQL).
// Every step is individually guarded so a vanilla postgres image (CI, local
// tests) or legacy data that resists casting cannot break the boot migration;
// the promotion simply applies on stacks where it is possible.
'use strict';

// safe-cast expression for legacy text columns that may hold '' or NULL
const JSONB_USING = "CASE WHEN address_meta IS NULL OR address_meta = '' THEN NULL ELSE address_meta::jsonb END";

module.exports = {
  up: async ({ context: sequelize }) => {
    if (sequelize.getDialect() !== 'postgres') return; // MySQL: nothing to promote

    // extensions — skipped when the image does not ship them (postgres:16-alpine)
    for (const ext of ['postgis', 'pg_trgm']) {
      try {
        await sequelize.query(`CREATE EXTENSION IF NOT EXISTS ${ext}`);
      } catch (e) {
        console.error(`[migration 003] extension ${ext} unavailable: ${e.message}`);
      }
    }

    // legacy text (longtext ... CHECK json_valid) → native jsonb
    for (const table of ['job', 'address']) {
      try {
        const [rows] = await sequelize.query(
          `SELECT data_type FROM information_schema.columns
           WHERE table_name = '${table}' AND column_name = 'address_meta'`
        );
        if (rows.length && ['text', 'character varying'].includes(rows[0].data_type)) {
          await sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN address_meta TYPE jsonb USING ${JSONB_USING}`
          );
        }
      } catch (e) {
        console.error(`[migration 003] ${table}.address_meta jsonb promotion skipped: ${e.message}`);
      }
    }

    // PostGIS geography point generated from the legacy varchar lat/lng columns;
    // only applies when the postgis type exists and every coordinate parses
    try {
      await sequelize.query(`
        ALTER TABLE address ADD COLUMN IF NOT EXISTS geog geography(Point, 4326)
        GENERATED ALWAYS AS (
          ST_SetSRID(ST_MakePoint(address_glng::double precision, address_glat::double precision), 4326)
        ) STORED
      `);
    } catch (e) {
      console.error(`[migration 003] address.geog generated column skipped: ${e.message}`);
    }
  },

  down: async ({ context: sequelize }) => {
    if (sequelize.getDialect() !== 'postgres') return;
    try {
      await sequelize.query('ALTER TABLE address DROP COLUMN IF EXISTS geog');
    } catch (e) {
      console.error(`[migration 003] down: ${e.message}`);
    }
  },
};
