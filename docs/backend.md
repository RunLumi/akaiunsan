# Backend (`backend/` — akaiunsan-admin-api)

Express 5 + Sequelize 6 REST API (Node 22 LTS, TypeScript, ESM).
Dual-dialect: PostgreSQL (target) and MySQL/MariaDB (legacy).
442 backend tests green across 51 test files, coverage 88.4% lines.

## Commands

```bash
cd backend
npm install                  # installs all deps + applies patches
npm run local                # tsx, NODE_ENV=local (dev server)
npm run dev                  # tsx watch, NODE_ENV=development
npm run build                # tsc → dist/ + fix requires + copy assets
npm run typecheck            # tsc --noEmit (strictness ramp tracked)
npm test                     # NODE_ENV=test vitest run (442 tests)
npm run test:coverage        # vitest run --coverage (88.4% lines)
```

## Layout

```
app.ts                    # express bootstrap: cors, Sentry, routes, migrations, startServer()
config/                   # per-env JSON: test / local / development / production
controllers/              # business logic, one file (or folder) per domain
helpers/                  # config (zod), logger (pino), security (JWT), migrator (umzug), mail, omise, payment, utils
middlewares/              # validator.ts, admin.ts (admin auth/role guard)
models/                   # Sequelize models; index.ts (dialect-aware); relations.ts
migrations/               # umzug migrations (001_initial baseline from live schema)
routes/                   # public / client / backoffice / agency / bot route groups
scripts/                  # gen-initial-migration.js, fix-dist-requires.js
dist/                     # compiled output (gitignored)
tests/                    # 442 tests across 51 files (vitest + supertest + coverage)
```

## Architecture

- **TypeScript + ESM**: `import`/`export` syntax, compiled to CommonJS via tsc.
- **Dual-dialect**: `config["dialect"]` selects PostgreSQL or MySQL/MariaDB at boot.
- **Migrations**: umzug replaces `sync()` — `runMigrations()` is called at boot; baseline from live schema.
- **Config**: `loadConfig(NODE_ENV)` with zod validation (fail-fast at boot).
- **Logging**: pino with auth material redaction (`helpers/logger.ts`).
- **CI**: GitHub Actions — backend tests (MariaDB/PostgreSQL service) + Docker build + mobile CI.
- **Docker**: multi-stage Dockerfile (builder → runner), non-root `node` user, HEALTHCHECK /health.

## Test suite

Vitest + supertest against a real database (MariaDB or PostgreSQL).
442 tests across 51 files covering all route tiers, controller error branches, helper functions, migration flows, and auth.

```bash
npm test                   # vitest run (requires running DB)
npm run test:coverage      # vitest run --coverage
```

### Coverage breakdown

| Metric | Value |
|---|---|
| Lines | 88.4% |
| Branches | 63.4% |
| Functions | 86.3% |
| Statements | 88.5% |

### Test categories

- **Characterization**: public auth, client CRUD, back-office CRUD, agency flows
- **Error injection**: DB failure simulations via vi.mock (500 envelopes)
- **Pinned bugs**: 15+ latent bugs locked with `// pins current behavior`
- **Coverage suites**: helper unit tests, stats functions, seed accounts, file lifecycle
- **Migration tests**: wipe-DB rebuild + idempotency verification

## Key files

| File | Purpose |
|---|---|
| `helpers/config.ts` | zod-validated config loader (fail-fast at boot) |
| `helpers/logger.ts` | pino logger with auth redaction |
| `helpers/migrator.ts` | umzug migration runner (dialect-aware) |
| `helpers/security.ts` | JWT sign/verify, password hash/compare |
| `models/index.ts` | Sequelize instance (dialect-aware) + model registry |
| `app.ts` | Express bootstrap + `startServer()` (DI-friendly) |
| `Dockerfile` | Multi-stage build (builder → runner, non-root) |
