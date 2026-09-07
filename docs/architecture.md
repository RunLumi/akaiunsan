# Architecture Overview

## System at a glance

Ayasan is a home-services marketplace (cleaning, maid/driver helpers, supplies) operating mainly in Thailand/Vietnam. The repo contains two deployables:

1. **backend/** — `ayasan-admin-api`: a single Express server serving
   - the customer mobile app (client routes),
   - an admin back office (backoffice routes),
   - an agency data source sync (agency routes, reading a separate legacy DB),
   - a chat bot API (bot routes).
2. **apps/** — `mobile-app`: the customer-facing React Native app (booking, payments, subscriptions, promotions).

## Data flow

```
mobile app (apps/)
   │  axios over HTTPS, JWT auth (see backend/helpers/security.js)
   ▼
Express API (backend/app.js)
   │  Sequelize 6
   ▼
MySQL / MariaDB ("ayasan_db")
   ▲
   │  separate "agency" connection (models/agency*) for legacy data import
```

External services integrated by the backend:

- **Omise** — payments/credit cards (`helpers/omise.js`, `payment.controller.js`, `Charge`/`CreditCard`/`PurchaseOrder` models)
- **Nodemailer** — transactional email with templates in `mail-template/{en,th}`
- **SSH/SFTP** (`ssh2-sftp-client`) — file transfer/export helpers
- **Facebook login** (passport-facebook, `account/` controllers)

The mobile app additionally uses Firebase (Analytics, Crashlytics, Messaging/notifications via `@react-native-firebase/*` and Notifee), Google Sign-In, Apple Auth, Google Places/maps.

## Core domain models (backend/models/)

- **Customer** / **Address** — app users and their service locations (Province/District/SubDistrict geography)
- **Supporter** — the service helpers (maids/drivers), with Education/Experience/Language/Skill/ViewCount sub-models
- **Job** / **JobDetail** / **JobReview** — service bookings and reviews
- **Subscription** / **SubscriptionTransaction** — recurring plans
- **CustomerSupply** / **CustomerSupplyDetail** / **SupplyOrder** — cleaning supplies orders
- **CleaningSupply** / **Supplier** / **SupplierProduct** — supply catalog
- **Admin** / **Role** / **AdminHistory** — back-office users and permissions
- **RequestHelper** / **RequestMaid** / **RequestDriver** / **RequestHelperStatus** — helper request workflow
- **Banner** / **BannerLanguage** — localized CMS banners
- **BizCustomer**, **PurchaseOrder**, **ErrorLog**, **ImportData**

Model relations are declared once in `models/relations.js` — register new associations there.

## Routing tiers (backend/routes/)

| File | Auth | Purpose |
|---|---|---|
| `public.route.js` | none | login, registration, public content |
| `client.route.js` | customer JWT | main app API |
| `backoffice.route.js` | admin JWT + role | back office |
| `agency.route.js` | special | legacy agency DB sync/import |
| `bot.route.js` | special | chat bot |
| `index.js` | — | mounts everything on the express app + one-off `/import/*` data-migration endpoints |

## Environments

- Backend NODE_ENV: `local`, `development`, `production` → `backend/config/<env>.json`.
- Deployment: GitLab CI deploys `develop` → dev server (`dev-api.ayasan.vn`) with pm2; production runs from `/ayasan/api-prod` on a DigitalOcean host via pm2.
- Mobile: dev / staging / production flavors on both Android (gradle variants + `.env.*` via react-native-config) and iOS (Xcode schemes `AyasanProduction`, `AysanStaging`).
