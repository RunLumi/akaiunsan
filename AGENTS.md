# AGENTS.md — Guidance for AI Agents

This repository ("akaiunsan") is the Ayasan platform: a home-services marketplace with two main code areas.

```
akaiunsan/
├── backend/   # "ayasan-admin-api" — Express + Sequelize (MySQL/MariaDB) REST API
└── apps/      # "mobile-app" — React Native 0.64 (Expo SDK 43 bare workflow) customer app, TypeScript + Redux Saga
```

## Read first

- [docs/architecture.md](docs/architecture.md) — how the two apps fit together
- [docs/backend.md](docs/backend.md) — API structure, models, routing, environments
- [docs/mobile-app.md](docs/mobile-app.md) — app structure, build flavors, state management
- [docs/conventions.md](docs/conventions.md) — code patterns to follow when editing
- [docs/security.md](docs/security.md) — **important**: known secrets/credential issues; what never to commit or print

## Quick facts

| | backend | apps |
|---|---|---|
| Runtime | Node.js, CommonJS (`require`) | React Native 0.64 + TypeScript 4.3, Expo SDK 43 (bare) |
| Framework | Express 4, Sequelize 6, MySQL | React 17, React Navigation 6, Redux + Redux-Saga + redux-persist |
| Install | `cd backend && npm install` | `cd apps && yarn install` |
| Run (dev) | `npm run local` (NODE_ENV=local) or `npm run dev` | `yarn start:expo` (dev client) / `yarn android` / `yarn ios` |
| Entry | `backend/app.js` | `apps/index.js` → `App.tsx` → `src/navigation` |
| DB | MariaDB via `backend/docker-compose.yml` (port 15506) | — |
| CI | `.gitlab-ci.yml` (deploys `develop` branch via pm2) | manual builds (see mobile-app.md) |

## Ground rules for agents

1. **Backend is CommonJS** — use `require`/`module.exports`, no ESM imports. It has no build step; it runs raw Node.
2. **Config is per-environment JSON** — `backend/config/{local,development,production}.json` selected by `NODE_ENV`. Never hardcode DB credentials, JWT secrets, or API keys in source; the schema is documented in `backend/config/readme.md`.
3. **Adding an API endpoint**: create/extend a controller in `backend/controllers/`, add a model in `backend/models/` (and register relations in `backend/models/relations.js`), then wire the route in `backend/routes/` (`public.route.js` = no auth, `client.route.js` = customer auth, `backoffice.route.js` = admin auth, `agency.route.js`, `bot.route.js`). Do not add routes in `app.js`.
4. **Mobile app is TypeScript** — screens live in `apps/src/screens/<Feature>/`, shared components in `apps/src/components/`, theme/constants in `apps/src/shared/` (includes i18n in `shared/I18n`). Redux layers: `actions.ts`, `reducers/`, `sagas/` under `apps/src/redux/`.
5. **Env files for the app** — `.env`, `.env.dev`, `.env.staging`, `.env.production` are read by `react-native-config` at build time (see scripts `android:staging`, `android:prod`, etc.).
6. **Do not run `db.sequelize.sync()` destructively** — it already runs at startup (`models/index.js`); schema changes should be made carefully (this codebase has no migration tool).
7. **Secrets**: the repo currently contains committed credentials and signing keys (see docs/security.md). Never print, copy, or commit new secrets; never paste values from `backend/config/*.json` into output.
8. There are **no tests** wired up on the backend (`npm test` is a stub) and only the default jest-expo preset on the app. Verify changes by running the relevant server/app rather than assuming a test suite exists.
9. Git: default branch is `main`; the GitLab CI deploys the `develop` branch to the development server.
