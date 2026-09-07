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
| **`mariadb`** | MariaDB 10.9.6 | 3306 | Internal only (`db_net`) |

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
ssh ubuntu@15.235.202.219 'cd /opt/akaiunsan && git rev-parse HEAD && sudo docker inspect --format "{{.State.Health.Status}}" ayasan_backend'
```

Accept only when the public response is HTTP 200 with `status: "ok"`, `db: "up"`, and the expected `git.commit`, and the backend container reports `healthy`. The verified incident and recovery record is in [docs/postmortems/2026-09-07-backend-healthcheck-prod-deployment.md](postmortems/2026-09-07-backend-healthcheck-prod-deployment.md).

---

## Legacy Backend (PM2)

**Development** (automated): `.gitlab-ci.yml` — on push to `develop`, a gitlab-runner tagged `dev-api.ayasan.vn`:
1. rsyncs the repo to `/home/dev-api.ayasan.vn`
2. `npm install`
3. `pm2 delete all` + `pm2 start app.js --env development --watch` + `pm2 save`

A MariaDB container (`dev-api.ayasan.vn-db`, from `backend/docker-compose.yml`) serves the dev database on the dev host.

**Production** (manual, per `backend/README.md`): on the prod server, folder `/ayasan/api-prod`:
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
# Reuse the ignored Lumi release env files without copying their credentials.
set -a
source /Volumes/SSD/imc/lcn-lumi/lumi/android/keystore.env
source /Volumes/SSD/imc/lcn-lumi/lumi/ios/scripts/release.env
set +a

export PLAY_UPLOADER=/Volumes/SSD/imc/lcn-lumi/lumi/android/scripts/play_upload.sh
export APPLE_TEAM_ID="$TEAM_ID"

# Build and validate only.
./apps/scripts/deploy-stores.sh

# Build and upload both artifacts.
./apps/scripts/deploy-stores.sh --confirm
```

The API credential files must stay outside git. `--confirm` is required for uploads; `--build-only`, `--android-only`, and `--ios-only` are available for narrower runs. Set `PLAY_TRACK=closed` or `open` only when that release destination is intentional. Production uploads additionally require `ALLOW_PLAY_PRODUCTION=YES`.

Android variants: `dev|staging|production` × `debug|release` (`yarn android:*` scripts).
iOS schemes: `AyasanProduction`, `AysanStaging` (note the typo — it's the real scheme name).

Signing: Android release keystores and iOS certs/profiles live in `apps/` (gitignored since the root `.gitignore` was added — see security.md for what must be provisioned manually on a fresh clone). OTA updates go through `expo-updates` (see the `updateSource` hook in `App.tsx`).

## Backend config on servers

`config/development.json` and `config/production.json` are gitignored, so deploys don't overwrite them — but confirm they exist with the right `db-connection`, `jwt-secret`, `omise`, `agency-connection`, `app_key`, and (for the import helpers) `sftp-connection` before restarting.
