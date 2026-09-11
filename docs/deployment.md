# Deployment

## Master VPS Deployment (Docker Compose + Caddy — 2026)

The platform is deployed to a single VPS using Docker Compose and Caddy for automatic TLS/SSL ingress, reverse proxying, and container isolation.

### Service Stack Overview

| Service | Technology | Port (Internal) | Public Route (via Caddy) |
|---|---|---|---|
| **`caddy`** | Caddy 2 Alpine | 80, 443 | Entry point (Let's Encrypt / HTTP/3) |
| **`backend`** | Node 22 slim / Express 5 | 5000 | `akai-api.cjs.vn` (20MB upload limit) |
| **`admin`** | shadcn-admin / Vite SPA | 80 | `akai-admin.cjs.vn` |
| **`frontend`** | Customer Web Portal | 80 | Internal stub |
| **`postgres`** | PostgreSQL 16 Alpine | 5432 | Internal only (`db_net`) |

### Deployment Directory Layout

```
deploy/
├── docker-compose.yml       # Master compose orchestrating all containers
├── Caddyfile                # Ingress routing rules & security headers
├── .env.example             # Template for domains, database credentials, secrets
├── README.md                # Comprehensive operational runbook
└── scripts/
    └── backup-db.sh         # Automated, compressed daily database backup script
```

### Initial Deployment on VPS

1. **Allocate swap** (prevent OOM kills on 2GB–4GB VPS):
   ```bash
   sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
2. **Install Docker & Compose**:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   ```
3. **Configure & start**:
   ```bash
   cd /opt/akaiunsan/deploy
   cp .env.example .env && chmod 600 .env
   # Edit .env with production passwords and domains
   docker compose up -d --build
   ```
4. **Schedule nightly database backups**:
   ```bash
   0 2 * * * /opt/akaiunsan/deploy/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
   ```

### CI/CD Workflow (`.github/workflows/deploy.yml`)

1. Triggered on push to `prod` or manually with `workflow_dispatch`.
2. Installs backend dependencies and runs the currently non-blocking TypeScript check.
3. Builds multi-stage Docker images (`backend`, `admin`, `frontend`) using GitHub layer caching and pushes SHA/latest tags to GHCR.
4. Executes `deploy/scripts/auto-deploy.sh --force` on the VPS over SSH.
5. The deploy script fast-forwards the VPS checkout from `origin/prod`, writes build metadata, rebuilds Compose services, and prunes dangling images.

### Production acceptance gate

Deployment completion is not established by a source SHA, a green build, or a container restart alone. Record all of the following for a release:

```bash
curl -sS -w '\nHTTP_STATUS:%{http_code}\n' https://akai-api.cjs.vn/health
ssh ubuntu@15.235.202.219 'cd /opt/akaiunsan && git rev-parse HEAD && sudo docker inspect --format "{{.State.Health.Status}}" akaiunsan_backend'
```

Accept only when the public response is HTTP 200 with `status: "ok"`, `db: "up"`, and the expected `git.commit`, and the backend container reports `healthy`. The verified incident and recovery record is in [docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md](postmortems/2026-09-07-backend-healthcheck-prod-deployment.md).

---

## Production database: PostgreSQL (2026-09-08 cutover)

The production database is now **PostgreSQL 16 with PostGIS** (`postgis/postgis:16-3.5-alpine`,
volume `akaiunsan_postgres_data`). The legacy MariaDB container (`akaiunsan_mariadb`, database
`ayasan_db_dev`) is kept running as a read-only fallback and can be removed after a soak period.

Selection is per-environment: the backend entrypoint synthesizes `config/production.json` from
`.env`, where `DB_DIALECT=postgres` + `DB_HOST=postgres` + `DB_PORT=5432` selects PostgreSQL
(`DB_DIALECT=mysql` or unset selects the legacy MySQL/MariaDB path).

### Rollback to MariaDB (kept available)

```bash
ssh ubuntu@15.235.202.219
cd /opt/akaiunsan/deploy
# .env: DB_HOST=mariadb, DB_PORT=3306, DB_DIALECT=mysql
sudo docker compose --env-file .env up -d --force-recreate backend
curl -s https://akai-api.cjs.vn/health   # accept only on 200 / db:up
```

### PostGIS / JSONB promotion (migration 003)

`backend/migrations/003_postgis_jsonb_promotion.cjs` runs on boot (PG-only, every step guarded so
vanilla postgres images and legacy data cannot break boot):

- `CREATE EXTENSION IF NOT EXISTS postgis` / `pg_trgm` (skipped when the image lacks them),
- promotes `job.address_meta` / `address.address_meta` text or json → `jsonb`,
- adds `address.geog geography(Point,4326)` generated from the legacy varchar lat/lng columns.

### Cutover record (2026-09-08)

1. PG volume reset and recreated on the PostGIS image (old volume was unused).
2. Backend flipped to Postgres via `.env` (`DB_DIALECT=postgres`); boot migrations created the
   schema (`001` sync branch + `002` + `003`).
3. Data carried over row-by-row (`role`, `admin`, `customer` — production data is minimal;
   counts verified equal on both databases, sequences reset via `setval`).
4. `error_log` rows (22 legacy lines) intentionally not migrated.
5. Acceptance: public `/health` HTTP 200, `db: "up"`, `git.commit` = deployed SHA; reads verified
   against loaded data.

pgloader was attempted first (container + native) but its state-file handling made it unusable
here; for future bulk migrations prefer `COPY FROM STDIN` with column-intersection TSVs as above.



**Development** (automated): `.gitlab-ci.yml` — on push to `develop`, a gitlab-runner tagged `dev-api.akaiunsan.vn`:
1. rsyncs the repo to `/home/dev-api.akaiunsan.vn`
2. `npm install`
3. `pm2 delete all` + `pm2 start app.js --env development --watch` + `pm2 save`

A MariaDB container (`dev-api.akaiunsan.vn-db`, from `backend/docker-compose.yml`) serves the dev database on the dev host.

**Production** (manual, per `backend/README.md`): on the prod server, folder `/akaiunsan/api-prod`:
```bash
git pull origin master
pm2 restart 3        # the pm2 app id for the API
```
Production connects to MySQL over the Unix socket `/var/run/mysqld/mysqld.sock`; config comes from `backend/config/production.json` (gitignored — values live in the team's password store).

Caveats for agents:
- The CI script was written for a host where the runner has passwordless sudo; don't "modernize" it casually.
- Deploys restart the whole pm2 list — never run against production unless explicitly asked.

## Mobile app (manual, no CI)

Android release builds (from `apps/README.md`):
```bash
cd apps/android
ENVFILE=.env.staging     ./gradlew app:assembleRelease
ENVFILE=.env.production  ./gradlew app:assembleRelease
ENVFILE=.env.dev         ./gradlew app:assembleRelease
```

### API-based mobile store deployment

Use `apps/scripts/deploy-stores.sh` to build the production Android AAB and iOS IPA, then upload them through the Google Play and App Store Connect APIs. The script does not submit an iOS build for App Review, and defaults Google Play to the `internal` track.

```bash
# The script automatically loads the canonical private release directory first:
# `.private-release/release.env` and `.private-release/AuthKey_<ASC_KEY_ID>.p8`.
# This directory is outside generated `apps/ios/`, so Expo prebuild will not delete it.
# Restore it from the private backup repository on a new machine:
./apps/scripts/restore-release-credentials.sh

# Legacy generated paths are supported only as a fallback:
# apps/android/keystore.env, apps/android/release.jks,
# apps/ios/scripts/release.env, and apps/ios/scripts/AuthKey_<ASC_KEY_ID>.p8

# Build and validate only.
./apps/scripts/deploy-stores.sh

# Build and upload both artifacts.
./apps/scripts/deploy-stores.sh --confirm
```

The API credential files must stay outside git. `--confirm` is required for uploads; `--build-only`, `--android-only`, and `--ios-only` are available for narrower runs. Set `PLAY_TRACK=closed` or `open` only when that release destination is intentional. Production uploads additionally require `ALLOW_PLAY_PRODUCTION=YES`.

For iOS distribution, keep the certificate and provisioning profile as a matched pair. Before a release, verify the local identities with `security find-identity -v -p codesigning`, run the script with `ALLOW_PROVISIONING_UPDATES=YES` when the profile is missing or stale, and verify the exported IPA before uploading. If export reports that a profile does not include the signing certificate, do not switch certificates blindly: regenerate the profile for `com.akaiunsan.customer` with the App Store Connect API key, then retry export.

Android release task: `:app:bundleRelease` (Expo CNG-generated Gradle project).
iOS scheme: `Akaiunsan` (Expo CNG-generated Xcode project/workspace).

Signing: Android release keystores and iOS certs/profiles live in `apps/` (gitignored since the root `.gitignore` was added — see security.md for what must be provisioned manually on a fresh clone). Akaiunsan does not use Expo OTA updates; mobile changes ship through native builds and the app-store release workflow.

## Backend config on servers

`config/development.json` and `config/production.json` are gitignored, so deploys don't overwrite them — but confirm they exist with the right `db-connection`, `jwt-secret`, `omise`, `agency-connection`, and (for the import helpers) `sftp-connection` before restarting.
