# Backend (`backend/` — ayasan-admin-api)

Express 4 + Sequelize 6 + MySQL/MariaDB, plain CommonJS, no TypeScript, no build step.

## Commands

```bash
cd backend
npm install
docker compose up -d        # local MariaDB on port 15506 (see config/local.json)
npm run local               # NODE_ENV=local, node app.js
npm run dev                 # NODE_ENV=development
npm run prod                # NODE_ENV=production
```

`npm test` is a stub — there is no test suite.

## Layout

```
app.js               # express bootstrap: cors, body-parser, db.sequelize.sync(), routes
config/              # per-env JSON: local / development / production (+ g-cred.json)
controllers/         # business logic, one file (or folder) per domain
helpers/             # security (JWT), mail, omise, payment, validation, utils
middlewares/         # validator.js, admin.js (admin auth/role guard)
models/              # Sequelize models; index.js builds `db` from config; relations.js
routes/              # public / client / backoffice / agency / bot route groups
mail-template/       # en + th HTML email templates
exports/             # generated exports
```

## Request lifecycle

1. `app.js` mounts cors + body-parser.
2. `routes/index.js` mounts route groups (see architecture.md for the auth tiers).
3. Auth: `helpers/security.js` issues/verifies JWTs; `middlewares/admin.js` guards back-office routes and checks roles.
4. Controllers use the `db` object from `models/index.js` (e.g. `db.Customer`, `db.Job`).

Auth details and the endpoint inventory are in [api-reference.md](api-reference.md); the model catalog is in [data-model.md](data-model.md); local setup is in [setup.md](setup.md).

## Configuration

`config/<NODE_ENV>.json` schema (documented in `config/readme.md`):

```json
{
  "db-connection": { "database": "", "user": "", "password": "", "host": "" },
  "jwt-secret": "",
  "omise": { "secretKey": "", "omiseVersion": "" },
  "agency-connection": { "host": "", "user": "", "password": "", "database": "" },
  "app_key": ""
}
```

Production uses a Unix socket (`/var/run/mysqld/mysqld.sock`); local/dev use TCP (local expects MariaDB from `docker-compose.yml`).

## Conventions

- Controllers follow a standard CRUD shape: create, getById, getList (pagination + ordering + keyword search + filters), updateById, deleteById. See `backend/work-note.txt` for the original team notes (a known bug: keyword search when keyword is empty).
- Controllers are grouped in folders for multi-part domains: `controllers/account/`, `agency/`, `bot/`, `requesthelper/`.
- New model checklist: create `models/Foo.js` exporting `sequelize.define(...)`, add associations in `models/relations.js`, require it in `models/index.js` pattern if needed, then use `db.Foo` in controllers.
- `db.sequelize.sync()` runs on every boot — do not rely on it for schema migration in production; there is no migration tool.
- Uploaded files are served from `/uploads/*` directly off the filesystem.

## Deployment

- `.gitlab-ci.yml`: on push to `develop`, rsync to `/home/dev-api.ayasan.vn`, `npm install`, restart pm2 with `--watch`.
- Production: manual `git pull origin master` + `pm2 restart` on the prod host, folder `/ayasan/api-prod` (credentials are in the team's password store — see docs/security.md before touching deploys).
