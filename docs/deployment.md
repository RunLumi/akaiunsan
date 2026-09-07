# Deployment

## Backend

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
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/secure/path/play-service-account.json
export ASC_API_KEY_JSON=/secure/path/app-store-connect-api-key.json
export APPLE_TEAM_ID=7MBXZKYSY4

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
