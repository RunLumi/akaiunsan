# API Reference (route inventory)

Base path: none (routes are mounted at root of the express app, default port 5000).

## Authentication model

The former shared `app_key` / `x-app-key` header gate (`headerValidator`) has been removed — the API relies on Bearer JWT auth below.

| Tier | Prefix | Auth | Middleware sets |
|---|---|---|---|
| Public | `/auth`, `/banners`, `/blog`, `/guest` | none | — |
| Client | `/client/*` | customer JWT | `clientValidator` → `req.customer` |
| Back office | `/back-office/*` | admin JWT | `backofficeValidator` → `req.admin`, `recordHistory` (non-GET), `checkPermission` per section |
| Agency | `/agency/*` | agency-specific | see `routes/agency.route.js` |
| Bot | `/bot/*` | bot-specific | `routes/bot.route.js` |

JWT format: `Authorization: Bearer <token>`; tokens are issued/verified by `helpers/security.js`.

## Public routes (`routes/public.route.js`)

- `POST /auth/signin|signup|forget-password|reset-password` — customer accounts
- `POST /auth/admin/signin|signup|forget-password|reset-password` — admin accounts
- `GET /banners/:lang_code`
- `POST /blog/content`, `GET /blog/search`, `GET /blog`
- `GET /guest/provinces`, `GET /guest/provinces/:province_id/districts`, `GET /guest/districts/:district_id/sub-districts`
- `GET /guest/supporters`, `/count`, `/view-count`, `/:supporter_id` — public helper profiles
- `POST /guest/contact-us`, `/guest/biz-quotation`, `/guest/employment-request` — mail forms
- `POST /guest/error-logs` — frontend error reporting

## Client routes (`routes/client.route.js`)

- `GET /client/verify-token`
- Addresses CRUD: `/client/addresses` (list/count/detail/create/update/delete)
- Credit cards: `/client/credit-cards` (list/count/detail/create/delete) — Omise-backed
- Customer profile: `GET /client/user`, `PUT /client/user`, `PUT /client/user/password`, profile image upload/remove (multer → `uploads/customers`)
- Request helper workflow: `/client/user/request-helper` (history/count/detail/create/last)
- Jobs, reviews, subscriptions (see the route file for the full list)

## Back-office routes (`routes/backoffice.route.js`, ~290 lines)

Mounted under `/back-office/*` with `recordHistory` on all non-GET and `checkPermission` gating sections by role permission string:

| URL contains | Required role permission |
|---|---|
| `/admins`, `/roles` | `User` |
| `/banners` | `Banner` |
| `/request-helpers`, `/request-helper-status` | `Request` |
| `/supporters` | `Supporter` |

Covers admins, roles, banners, supporters, request helpers, and more — read the file when adding endpoints so the permission gate is placed correctly.

## Misc (mounted in `routes/index.js`)

- `GET /back/office/install` — one-time first-admin bootstrap
- `GET /uploads/*` — static file serving from `backend/uploads`
- `GET /import/supporter-*`, `/import/supporter-agency*` — one-off legacy data migration endpoints (agency DB → new schema; require the SFTP/agency credentials)

## Response conventions

Controllers return JSON; list endpoints use Sequelize `findAndCountAll` (pagination via `page`/`limit`, plus `order`, `sortBy`, `keyword`, and entity-specific filters). The mobile `useApi` hook unwraps `responseData.data.data` and surfaces `data.errors[0].message` as the error string — keep that envelope shape when adding endpoints.
