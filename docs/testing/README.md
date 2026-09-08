# Testing Guide

## Overview

The backend uses **Vitest** + **supertest** against a real database (PostgreSQL or MariaDB).
442 tests across 51 files covering all route tiers, controller error branches, helper functions,
migration flows, and auth.

## Quick Start

```bash
cd backend
npm test                     # vitest run (requires running DB)
npm run test:coverage        # vitest run --coverage (88.4% lines)
```

## Test Structure

```
tests/
├── setup-env.js             # Sets NODE_ENV=test (loads config/test.json)
├── helpers/
│   ├── db.ts                # truncateAll(), APP_KEY, db instance
│   ├── factories.ts         # createAdmin(), createCustomer(), createRole() factories
│   ├── credentials.js       # Shared test-only password constants
│   └── migrator.ts          # (test copy) umzug migration runner
├── routes/
│   ├── health.test.js       # /health endpoint
│   ├── public.auth.test.js  # Signup, signin, forget/reset password (customer + admin)
│   ├── client.addresses.test.js  # Client tier auth gate + addresses CRUD
│   ├── client.commerce.test.js   # Jobs, subscriptions, credit cards (omise mocked)
│   ├── backoffice.test.js   # Back-office auth gate + permission matrix
│   ├── backoffice.crud.test.js   # Back-office CRUD (customers, roles, banners, jobs, supplies)
│   ├── requesthelper.test.js     # Request-helper flow + 19 statistics endpoints
│   ├── requesthelper-deep.test.js  # Driver-type request-helper deep flow
│   ├── supporters.test.js   # Supporter CRUD + bot profile endpoints
│   ├── supporters-filters.test.js  # Public supporter filter branches
│   ├── agency-import.test.js     # Agency data import + SFTP
│   ├── agency-driver.test.js     # Agency driver CRUD
│   ├── import-match.test.js       # Import + match endpoints
│   ├── import-endpoints.test.js  # /import/* endpoints with mocked agency
│   ├── file-lifecycle.test.js    # Upload/remove file lifecycle (sharp pipeline)
│   ├── error-branches.test.js    # Error branch sweep across 12 controllers
│   ├── error-branches-2.test.js  # Address.json + customer + status + jobreview branches
│   ├── error-branches-3.test.js  # RequestHelper + status + customersupply + bizcustomer + agency branches
│   ├── error-branches-4.test.js  # Statistics catch-block sweep (19 endpoints)
│   ├── error-branches-5.test.js  # Supporter + job controller error branches
│   ├── error-branches-6.test.js  # Catch/rollback/500 envelopes (mega suite)
│   ├── error-branches-7.test.js  # matchSupporter credit_card + charge detail
│   ├── deep-branches.test.js     # Keyword search, jobreview, geography, subscription branches
│   ├── seed-accounts.test.js     # Admin + customer auth flows (signup, signin, forget-password)
│   ├── bizcustomer.test.js       # Bizcustomer, cleaningsupply, supplier keyword+CRUD
│   ├── review-geography.test.js  # Jobreview keyword, geography cascade
│   ├── admin-flows.test.js       # Admin register, password flows, profile management
│   ├── bot-filters.test.js       # Bot list filter branches
│   ├── bot-viewcount.test.js     # Bot view count sync
│   ├── version-bot-customer.test.js  # Version helper, bot age, customer removeProfile
│   └── supporter-upload-branches.test.js  # Crop branch matrix (tall/wide/square)
├── helpers/
│   ├── config.test.js       # zod config loader (valid, invalid, missing, passthrough)
│   ├── logger.test.js       # pino logger (redaction, levels, child loggers)
│   ├── util.test.js         # genTxt, getCustomerData, getAddressData
│   ├── util-agency.test.js  # Agency SQL wrappers + sftp upload
│   ├── util-csv.test.js     # json2csv + writeCsvFile
│   ├── credentials.test.js  # Credential constants
│   ├── admin.test.js        # findAdminByUsername/Id
│   ├── security.test.js     # Password hash, JWT round-trip, findUser
│   ├── validator.test.js    # validateEmptyField
│   ├── subscription-cron.test.js  # Subscription cron (charge, suspend, skip)
│   ├── stats-unit.test.js   # Statistics helpers (both date modes)
│   ├── error-branches.test.js    # Helper error propagation
│   ├── omise-payment.test.js     # Omise helper + payment controller + subscription cron
│   ├── agencyData.test.js        # Agency data mapping (nationality, imports, fetchers)
│   ├── agencyData-empty.test.js  # AgencyData reject branches (empty legacy DB)
│   ├── supporter-helper.test.js  # Supporter helper CRUD with children
│   ├── error-branches.test.js    # Subscription + supporter.helper error propagation
│   └── branches.test.js          # Version branches, nationality aliases, genAgencyData matrix
├── controllers/
│   ├── address-json.test.js      # Province/district/subdistrict error branches
│   └── helper-error-branches.test.js  # Bot + jobreview + admin + customer error branches
├── middleware/
│   └── header-validator.test.js  # headerValidator logging suppression
└── migrations.test.js            # Migration wipe-DB rebuild + idempotency
```

## Writing Tests

### Patterns

1. **Route tests** — use `supertest(app)` with `APP_KEY` header and optional JWT.
2. **Helper tests** — unit-drive functions directly, mocking external deps via `vi.mock` or `require.cache` patching.
3. **Error-branch tests** — force DB failures via `vi.mock('../../models/index.ts')` and assert 500 envelopes.
4. **Pinned bugs** — use `// pins current behavior` comment; fix deliberately with TDD when scheduled.

### Fixtures

- `tests/helpers/factories.ts` — `createAdmin()`, `createCustomer()`, `createRole()`, `createAddress()` with sensible defaults.
- `tests/helpers/credentials.js` — shared password constants (avoid literal passwords in test files).
- `tests/helpers/db.ts` — `truncateAll()` clears all tables between suites; `APP_KEY` for header auth.

### External mocks

- **Nodemailer**: patch `nodemailer.createTransport` in beforeAll, restore in afterAll.
- **Omise**: `vi.mock('omise')` or `patchModule('omise', factory)` before app import.
- **Image-downloader**: `vi.mock('image-downloader')`.
- **SSH2-SFTP-Client**: patch module cache with FakeSftp class.
- **MySQL (legacy agency)**: `patchModule('mysql', fakeMysql)` before app import.

## Coverage

| Metric | Current | Target |
|---|---|---|
| Lines | 88.4% | ≥ 80% |
| Branches | 63.4% | — |
| Functions | 86.3% | — |
| Statements | 88.5% | — |

Coverage is measured with `vitest run --coverage` (V8 provider).
The `All files` `Lines` column is the gate.

## CI

Backend tests run on GitHub Actions via `.github/workflows/deploy.yml`:
- **Test & Validate**: MariaDB → **PostgreSQL 16** service + `npx vitest run`
- **Backend Docker Build**: validates multi-stage Dockerfile on every backend PR
- **Deploy to VPS**: SSH deploy on `prod` push (requires repo secrets)
