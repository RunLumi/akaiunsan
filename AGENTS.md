# AGENTS.md — Guidance for AI Agents

This repository ("akaiunsan") is the Ayasan platform: a home-services marketplace.
```
akaiunsan/
├── backend/   # "ayasan-admin-api" — Express 5 + Sequelize REST API (Node 22, TypeScript)
├── admin/     # "shadcn-admin" — React 19 + Vite 8 + TanStack Router + Tailwind v4 admin portal
├── frontend/  # customer web portal
├── apps/      # "mobile-app" — React Native (iOS & Android) customer app
└── deploy/    # Master Docker Compose + Caddy VPS deployment & backups
```

## Documentation index

| Doc | What's in it |
|---|---|
| [docs/architecture.md](docs/architecture.md) | how the two apps fit together, external services, domain overview |
| [docs/setup.md](docs/setup.md) | local dev environment from zero (DB, config, run) |
| [docs/backend.md](docs/backend.md) | API folder structure, conventions, request lifecycle |
| [docs/api-reference.md](docs/api-reference.md) | route tiers, auth headers, endpoint inventory |
| [docs/data-model.md](docs/data-model.md) | Sequelize models and relations |
| [docs/mobile-app.md](docs/mobile-app.md) | app structure, build flavors, state management, `useApi` hook |
| [docs/conventions.md](docs/conventions.md) | code patterns to follow when editing |
| [docs/deployment.md](docs/deployment.md) | GitLab CI, pm2 servers, mobile release builds |
| [docs/security.md](docs/security.md) | **read first**: committed secrets; what never to commit or print |
| [docs/backend-upgrade-plan.md](docs/backend-upgrade-plan.md) | phased backend migration: TS + TDD + dependency upgrades (Phases 0–2 done, execution log inside) |
| [docs/mobile-app-upgrade-plan.md](docs/mobile-app-upgrade-plan.md) | proposed phased mobile migration: TDD-first, Expo SDK 57 replatform, RTK Query (not started) |

## Quick facts

| | backend | apps |
|---|---|---|
| Runtime | Node.js, CommonJS (`require`) | React Native 0.64 + TypeScript 4.3, Expo SDK 43 (bare) |
| Framework | Express 4, Sequelize 6, MySQL | React 17, React Navigation 6, Redux + Redux-Saga + redux-persist |
| Install | `cd backend && npm install` | `cd apps && yarn install` |
| Run (dev) | `npm run local` (NODE_ENV=local) | `yarn start:expo` (dev client) / `yarn android` / `yarn ios` |
| Entry | `backend/app.js` | `apps/index.js` → `App.tsx` → `src/navigation` |
| DB | MariaDB via `backend/docker-compose.yml` (port 15506) | — |
| CI | `.gitlab-ci.yml` (deploys `develop` branch via pm2) | manual builds (see deployment.md) |

## Ground rules for agents

1. **Backend is CommonJS** — use `require`/`module.exports`, no ESM imports, no build step.
2. **Config is per-environment JSON** — `backend/config/{local,development,production}.json` selected by `NODE_ENV` (schema in `backend/config/readme.md`). These files are gitignored; never hardcode credentials — read them from the config `key` object (see `helpers/util.js` for the `sftp-connection` pattern) or `process.env`.
3. **API auth model** — every route group checks an `app_key` header (`headerValidator`); `/client/*` additionally requires a customer Bearer JWT (`clientValidator`, exposes `req.customer`); `/back-office/*` requires an admin JWT plus `recordHistory` and per-section `checkPermission` role checks. Wire new endpoints into the matching route file — see docs/api-reference.md.
4. **Adding a backend feature**: model in `backend/models/` (relations in `models/relations.js`) → controller in `backend/controllers/` → route in `backend/routes/{public,client,backoffice,agency,bot}.route.js`. Do not add routes in `app.js`.
5. **Mobile app is TypeScript** — screens in `apps/src/screens/<Feature>/` with an `index.ts`, shared components in `apps/src/components/` (barrel export), theme/constants/i18n in `apps/src/shared/`. All API calls go through the `useApi` hook (`apps/src/hooks/useApi.ts`) which sets `Authorization`, `Accept-Language`, and `platform` headers and reads the base URL from `react-native-config`.
6. **Env files for the app** — `.env`, `.env.dev`, `.env.staging`, `.env.production` (keys: `API_URL`, `OMISEKEY`, `OMISELINK`, `OMISEADDCARD`) are read by `react-native-config` at build time; pick a flavor with the `android:*` / `ios:*` scripts.
7. **Do not rely on `db.sequelize.sync()`** for schema changes in production — it runs on boot but there is no migration tool; schema edits are manual.
8. **Secrets**: the repo previously had credentials committed; they are now gitignored. Never print, copy, or commit values from `backend/config/*.json`, `.env*`, or signing keys (see docs/security.md).
9. **No meaningful test suite** — backend `npm test` is a stub and the app only has the default jest-expo preset. Verify changes by running the relevant server/app.
10. Git: default branch is `main`; the GitLab CI deploys the `develop` branch to the development server. Pre-commit hooks (ECC) block commits containing detected secrets — fix the code, don't bypass with `ECC_SKIP_PRECOMMIT=1`.
