# Local Development Setup

## Prerequisites

- Node.js (v14–v16 era recommended; the backend uses `sharp@0.27` and `bcrypt@5`, which may need rebuilds on newer Node)
- Docker (for MariaDB)
- Yarn classic + CocoaPods (for the mobile app), Xcode 13+ / Android Studio

## 1. Backend

```bash
cd backend
npm install
docker compose up -d        # MariaDB 10.9 on localhost:15506
```

Create `config/local.json` (gitignored — do not commit). Schema per `config/readme.md`:

```json
{
  "db-connection": { "database": "", "user": "", "password": "", "host": "" },
  "jwt-secret": "",
  "omise": { "secretKey": "", "omiseVersion": "" },
  "agency-connection": { "host": "", "user": "", "password": "", "database": "" },
  "app_key": ""
}
```

Notes:

- For `local`, point `db-connection` at `127.0.0.1:15506` (database/credentials from `docker-compose.yml`). Get the real values from the team's password store — they are intentionally not in git.
- Optional `"sftp-connection": { "host": "", "username": "", "password": "" }` key is used by the legacy agency import helpers (`helpers/agencyData.js`, `helpers/util.js`); env vars `SFTP_HOST` / `SFTP_USER` / `SFTP_PASSWORD` override it.
- First run: `db.sequelize.sync()` creates tables; visit `GET /back/office/install` once to create the first admin.
- `app_key` is the header key the mobile app must send; set it to any value and mirror it in the app's `.env` if needed.

```bash
npm run local    # NODE_ENV=local, node app.js (port 5000 by default)
```

## 2. Mobile app

```bash
cd apps
yarn install
cd ios && pod install && cd ..    # macOS only
```

`.env` (gitignored) keys used by `react-native-config`:

```
API_URL=https://...            # backend base URL
OMISEKEY=pkey_...              # Omise public key
OMISELINK=https://...          # hosted card-list page
OMISEADDCARD=https://...       # hosted add-card page
```

Point `API_URL` at your local backend. Run:

```bash
yarn start:expo      # expo dev client
yarn android         # or: yarn ios
```

Because it's the bare workflow, native dependency changes require a full rebuild (`pod install` / gradle sync), not just metro reload.

## 3. Verifying the pair

1. Start the backend, confirm the ASCII banner and `env: local` in the console.
2. From the app (simulator + `API_URL=http://localhost:5000`), hit a public route like `GET /guest/provinces` with the `app_key` header — a 401 from `headerValidator` means the header doesn't match `config/local.json`'s `app_key`.
