# Akaiunsan Platform (Ayasan)

The **Akaiunsan** platform is a home-services marketplace (cleaning, maid & driver helpers, supplies) serving Thailand and Vietnam.

This repository is structured as a **modular monorepo** containing the backend REST API, admin portal, customer web portal, mobile application, and containerized deployment infrastructure.

---

## 1. Monorepo Structure

```
akaiunsan/
├── backend/    # "ayasan-admin-api" — Express 5 REST API (Node 22 LTS, TypeScript)
├── admin/      # "shadcn-admin" — Back-office admin portal (React 19, Vite 8, Tailwind v4, TanStack Router)
├── frontend/   # Customer web application portal
├── apps/       # "mobile-app" — Customer mobile app (React Native, iOS & Android)
├── deploy/     # Master Docker Compose + Caddy VPS deployment & backup infrastructure
└── docs/       # Architecture, conventions, and operational documentation
```

For AI agents and developers working across the codebase, review [AGENTS.md](AGENTS.md) for conventions and rules.

---

## 2. Production Deployment & Live Infrastructure

The platform is deployed to a single VPS orchestrated via **Docker Compose** and **Caddy** (automatic Let's Encrypt TLS/SSL, HTTP/2, and HTTP/3).

- **VPS Host**: `15.235.202.219` (`ssh ubuntu@15.235.202.219`)
- **Admin Dashboard**: [https://akai-admin.cjs.vn](https://akai-admin.cjs.vn)
- **Backend API**: [https://akai-api.cjs.vn](https://akai-api.cjs.vn)
- **API Health Check**: [https://akai-api.cjs.vn/health](https://akai-api.cjs.vn/health)

### Running Services

| Service | Container Name | Technology | Internal Port | Ingress Route | Memory Footprint |
|---|---|---|---|---|---|
| **Reverse Proxy** | `ayasan_caddy` | Caddy 2 Alpine | 80, 443 | `*` (Ingress router) | ~28 MiB |
| **Admin App** | `ayasan_admin` | Vite 8 + React 19 SPA | 80 | `https://akai-admin.cjs.vn` | ~12 MiB |
| **API Backend** | `ayasan_backend` | Node 22 / Express 5 | 5000 | `https://akai-api.cjs.vn` | ~105 MiB |
| **Database** | `ayasan_mariadb` | MariaDB 10.9.6 | 3306 | Internal network only (`db_net`) | ~70 MiB |
| **Customer Web** | `ayasan_frontend` | Caddy Alpine static | 80 | Internal stub (ready for domain) | ~10 MiB |

Complete deployment runbooks, environment setup, and backup scripts are documented in [deploy/README.md](deploy/README.md) and [docs/deployment.md](docs/deployment.md).

The most recent production incident and recovery evidence is recorded in
[docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md](docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md).

---

## 3. Quickstart: Local Development

### Prerequisites
- Node.js 22+ & npm
- pnpm (for `admin/`)
- MariaDB or MySQL (dev DB port `15506` via `backend/docker-compose.yml`)

### A. Backend API (`backend/`)
```bash
cd backend
npm install
npm run local       # Starts API with tsx (NODE_ENV=local)
npm test            # Runs Vitest characterization test suite
```

### B. Admin Portal (`admin/`)
```bash
cd admin
pnpm install
pnpm dev            # Starts Vite development server at http://localhost:5173
```

### C. Mobile App (`apps/`)
```bash
cd apps
yarn install
yarn start:expo     # Bare Expo React Native dev server
```

---

## 4. Documentation Index

Detailed guides are available in the [`docs/`](docs/) directory:

- [docs/architecture.md](docs/architecture.md) — System architecture, models, and domain overview.
- [docs/deployment.md](docs/deployment.md) — VPS Master deployment guide, CI/CD, and mobile release processes.
- [docs/setup.md](docs/setup.md) — From-zero local development setup guide.
- [docs/backend.md](docs/backend.md) — API folder structure, conventions, and request lifecycle.
- [docs/api-reference.md](docs/api-reference.md) — Authentication tiers, headers, and route catalog.
- [docs/data-model.md](docs/data-model.md) — Sequelize models, tables, and relationships.
- [docs/mobile-app.md](docs/mobile-app.md) — React Native mobile app architecture and API hooks.
- [docs/security.md](docs/security.md) — Security policies, secret management, and git rules.
- [docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md](docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md) — Backend crash-loop, Docker build repair, deployment recovery, and verification evidence.
- [deploy/README.md](deploy/README.md) — Production VPS operations runbook.
