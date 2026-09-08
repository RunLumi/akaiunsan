# Local Development Setup

## Prerequisites

- Node.js 22 LTS (nvm/nvs)
- PostgreSQL 16 (local or Docker) — or MariaDB 10.9+ for legacy
- npm 10+

## 1. Backend

```bash
cd backend
npm install
```

Create `config/test.json` (or `config/local.json`) — gitignored. Schema per `helpers/config.ts`:

```json
{
  "db-connection": {
    "database": "akaiunsan_db_test",
    "user": "akaiunsan_test",
    "password": "akaiunsan_test",
    "host": "127.0.0.1",
    "port": 5432
  },
  "dialect": "postgres",
  "jwt-secret": "test-jwt-secret",
  "app_key": "test-app-key",
  "omise": { "secretKey": "skey_test", "omiseVersion": "2019-05-29" },
  "mail-config": { "host": "127.0.0.1", "port": 1025, "secure": false, "user": "", "password": "" }
}
```

Run:

```bash
npm run local                # tsx, NODE_ENV=local
npm test                     # vitest run (442 tests, real DB)
npm run test:coverage        # vitest run --coverage (88.4% lines)
```

## 2. Admin Portal

```bash
cd admin
pnpm install
pnpm dev
```

## 3. Mobile App

```bash
cd apps
yarn install
yarn start:expo
```

## 4. Docker (Production)

```bash
cd deploy
cp .env.example .env         # fill in real values
docker compose up -d --build
```
