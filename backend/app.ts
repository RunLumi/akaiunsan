// Sentry must initialize before any other import instruments the modules
import './instrument.ts';
import express from 'express';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import db from './models/index.ts';
import registerRoutes from './routes/index.ts';
import { logger } from './helpers/logger.ts';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

db.sequelize.sync();

registerRoutes(app);

// Captures unhandled errors from every route above, then falls through so
// responses keep their current shape. Must stay after all routes and before
// any other error middleware.
Sentry.setupExpressErrorHandler(app);

// Shared boot path: pm2/dev entry and tests call this. Returns the bound
// server so callers can close it.
export function startServer (port = PORT, log = logger) {
  return app.listen(port, async () => {
    log.info('backend started — port: %s, env: %s, started at: %s', port, process.env.NODE_ENV, new Date().toISOString());
  });
}

// Test harnesses (supertest) import the app without binding a port; pm2 and
// local dev run `node dist/app.js` and expect it to listen.
// Use require.main === module (CJS) — this project compiles to CommonJS.
const isMain = require.main === module;
if (isMain) {
  startServer(PORT);
}

export default app;
