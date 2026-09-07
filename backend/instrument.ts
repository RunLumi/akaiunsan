// Must be imported before anything else in app.ts so Sentry instruments all
// modules as they load. DSN resolution: SENTRY_DSN env var, then `sentry-dsn`
// in config/<NODE_ENV>.json. With neither, Sentry stays disabled — which keeps
// the test suite and unconfigured local setups completely side-effect free.
import fs from 'fs';
import * as Sentry from '@sentry/node';

const NODE_ENV = process.env.NODE_ENV || 'local';

let config: any = {};
try {
  config = JSON.parse(fs.readFileSync(`config/${NODE_ENV}.json`, 'utf8'));
} catch {
  // config file optional for this env — the DSN may come from SENTRY_DSN alone
}

const dsn = process.env.SENTRY_DSN || config['sentry-dsn'] ||
  // Built-in default so the API reports errors with zero configuration.
  // Overrides: SENTRY_DSN env, then `sentry-dsn` in config/<env>.json.
  // The test suite stays disabled so vitest failures never reach Sentry.
  (NODE_ENV === 'test' ? '' : 'https://f2213b511b89156288cb2bf04da27329@o4512044306530304.ingest.us.sentry.io/4512044310462464');

if (dsn) {
  Sentry.init({
    dsn,
    environment: NODE_ENV,
    // request/DB spans on every request are too noisy for prod at 100%
    tracesSampleRate: NODE_ENV === 'production' ? 0.2 : 1.0,
  });
  console.log(`[sentry] initialized for environment: ${NODE_ENV}`);
}
