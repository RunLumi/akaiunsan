# AGENTS.md — Guidance for AI Agents

This repository ("akaiunsan") is the Akaiunsan platform: a home-services marketplace.
```
akaiunsan/
├── backend/   # "akaiunsan-admin-api" — Express 5 + Sequelize REST API (Node 22 LTS, TypeScript)
├── admin/     # "shadcn-admin" — React 19 + Vite 8 + TanStack Router + Tailwind v4 admin portal
├── frontend/  # customer web portal
├── apps/      # "mobile-app" — React Native (iOS & Android) customer app
└── deploy/    # Master Docker Compose + Caddy VPS deployment & backups
```

## Documentation index

| Doc | What's in it |
|---|---|
| [README.md](README.md) | **Monorepo overview**: service inventory, live URLs, quickstarts, documentation index |
| [deploy/README.md](deploy/README.md) | **Production VPS operations runbook**: live server `15.235.202.219`, swap, SSL, and daily maintenance |
| [docs/deployment.md](docs/deployment.md) | Master Docker Compose + Caddy setup, CI/CD pipeline, mobile store deploy |
| [docs/architecture.md](docs/architecture.md) | How services fit together, domain overview, external integrations |
| [docs/setup.md](docs/setup.md) | Local dev environment from zero (DB, config, run) |
| [docs/backend.md](docs/backend.md) | API folder structure, conventions, request lifecycle |
| [docs/api-reference.md](docs/api-reference.md) | Route tiers, auth headers, endpoint inventory |
| [docs/data-model.md](docs/data-model.md) | Sequelize models and relations |
| [docs/mobile-app.md](docs/mobile-app.md) | App structure, build flavors, state management, `useApi` hook |
| [docs/conventions.md](docs/conventions.md) | Code patterns to follow when editing |
| [docs/security.md](docs/security.md) | **Read first**: committed secrets; what never to commit or print |
| [docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md](docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md) | Production backend crash-loop, build repair, deployment recovery, and evidence |
| [docs/backend-upgrade-plan.md](docs/backend-upgrade-plan.md) | Phased backend migration: TS + TDD + Express 5 (Phases 0–3 landed) |
| [docs/mobile-app-upgrade-plan.md](docs/mobile-app-upgrade-plan.md) | Proposed phased mobile migration: TDD-first, Expo SDK 57 replatform |

## Quick facts

| | backend | admin | apps | deploy (VPS) |
|---|---|---|---|---|
| Runtime | Node.js 22 LTS, TypeScript | React 19, TypeScript, Vite 8 | React Native 0.64 + TS 4.3, Expo 43 | Ubuntu 26.04 LTS (`15.235.202.219`) |
| Framework | Express 5, Sequelize 6 | Tailwind v4, TanStack Router | React 17, React Nav 6, Redux Saga | Docker Engine 29 + Docker Compose v2 |
| Install | `cd backend && npm install` | `cd admin && pnpm install` | `cd apps && yarn install` | `git pull origin prod` |
| Run (dev) | `npm run local` (tsx, local env) | `pnpm dev` (Vite port 5173) | `yarn start:expo` / `yarn android` / `yarn ios` | `sudo docker compose --env-file .env up -d --build` |
| Entry | `backend/app.ts` &rarr; `dist/app.js` | `admin/src/main.tsx` | `apps/index.js` &rarr; `App.tsx` | `deploy/docker-compose.yml` + `Caddyfile` |
| Database | MariaDB 10.9 (Docker port 3306) | — | — | Container `akaiunsan_mariadb` (internal `db_net`) |
| CI / CD | GitHub Actions (`.github/workflows/deploy.yml`) | GH Actions build & push | Manual scripts (`apps/scripts/deploy-stores.sh`) | Ingress router `akaiunsan_caddy` with auto-TLS |

## Production Endpoints & Host

- **VPS Server**: `15.235.202.219` (SSH: `ssh ubuntu@15.235.202.219`)
- **Admin App**: [https://akai-admin.cjs.vn](https://akai-admin.cjs.vn) (proxied to `akaiunsan_admin:80`)
- **Backend API**: [https://akai-api.cjs.vn](https://akai-api.cjs.vn) (proxied to `akaiunsan_backend:5000`)
- **API Health Check**: [https://akai-api.cjs.vn/health](https://akai-api.cjs.vn/health)

## Ground rules for agents

1. **Backend is TypeScript** — dev runner is `tsx` (`npm run local`), production build produces `dist/` via `npm run build`. Keep CommonJS require-interop working during migrations.
2. **Config is per-environment JSON** — `backend/config/{local,development,production}.json` selected by `NODE_ENV`. Inside Docker, `docker-entrypoint.sh` synthesizes `config/production.json` from `.env` variables if not mounted. Never commit real credentials.
3. **API auth model** — every route group checks an `app_key` header (`headerValidator`); `/client/*` requires a customer Bearer JWT (`clientValidator`, exposes `req.customer`); `/back-office/*` requires an admin JWT plus `recordHistory` and per-section `checkPermission` role checks. Wire new endpoints into matching route files — see [docs/api-reference.md](docs/api-reference.md).
4. **Adding a backend feature**: model in `backend/models/` (relations in `models/relations.ts`) &rarr; controller in `backend/controllers/` &rarr; route in `backend/routes/{public,client,backoffice,agency,bot}.route.ts`. Do not add routes in `app.ts`.
5. **Admin app is React 19 + Vite 8** — located in `admin/`. Uses `pnpm` for dependency management with lockfile v9.0. Built via multi-stage Dockerfile and served by Caddy Alpine.
6. **Mobile app is TypeScript** — screens in `apps/src/screens/<Feature>/` with an `index.ts`, shared components in `apps/src/components/` (barrel export). All API calls go through `useApi` hook (`apps/src/hooks/useApi.ts`).
7. **Do not rely on `db.sequelize.sync()`** for schema changes in production — it runs on boot but schema edits are manual until migrations (Phase 5) land.
8. **Secrets**: credentials are now gitignored. Never print, copy, or commit values from `backend/config/*.json`, `.env*`, or signing keys (see [docs/security.md](docs/security.md)).
9. **Backend test suite**: `npm test` runs the Vitest characterization suite against test MariaDB. The exact count changes as coverage work lands; report the observed count rather than relying on a stale number.
10. **Git workflow**: default branch is `main`. Pre-commit hooks (ECC) block commits containing detected secrets — fix the code, don't bypass with `ECC_SKIP_PRECOMMIT=1`.
11. **Coverage gate — 90% minimum**: backend line coverage must stay **above 90%** (`cd backend && npx vitest run --coverage`). Every new feature, fix, or file must include tests that cover its branches. If a PR drops coverage below 90%, add tests before merging — no exceptions. Coverage is checked with `vitest run --coverage`; the `All files` `Lines` column is the gate.
12. **Maestro device testing is strictly serial**: run only one iOS simulator or Android emulator at a time, and never run the iOS and Android Maestro lanes concurrently. Before switching platforms, finish the current build/test process, close the app, and verify that no other simulator, emulator, `xcodebuild`, Gradle, Metro, or Maestro process is still active. Use one explicit device identifier per run, capture the result, then shut down that device before starting the next platform.
13. **Production deployment**: The deploy source branch is `prod`, not `main`. The VPS pulls updates directly using its configured deploy key and runs `deploy/scripts/auto-deploy.sh`; accept a release only after `/health` returns HTTP 200 with `status: ok`, `db: up`, and the expected `git.commit`.
