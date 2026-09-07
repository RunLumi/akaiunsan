# Data Model (backend/models/)

All models are Sequelize `define()` exports aggregated in `models/index.js` into the `db` object; associations are declared once in `models/relations.js`. Geography (Province/District/SubDistrict) backs the address pickers.

## Entity groups

**Customers & access**
- `Customer` — app user; facebook/json columns store social login payloads; password hashed with bcrypt
- `Address` — service locations, tied to Customer + Province/District/SubDistrict
- `CreditCard` — Omise tokenized cards per customer
- `Admin` / `Role` / `AdminHistory` — back-office users; `Role.permission` is a list of section names (`User`, `Banner`, `Request`, `Supporter`) checked by `middlewares/admin.js`
- `BizCustomer` — business customers (quotation flow)

**Service delivery (core)**
- `Supporter` — maids/drivers; sub-models: `SupporterEducation`, `SupporterExperience`, `SupporterLanguage`, `SupporterSkill`, `SupporterViewCount`
- `Job` / `JobDetail` — bookings performed for a Customer at an Address by a Supporter
- `JobReview` — ratings
- `RequestHelper` / `RequestMaid` / `RequestDriver` / `RequestHelperStatus` — the "request a helper" funnel from the app

**Commerce**
- `Subscription` / `SubscriptionTransaction` — recurring plans
- `Charge`, `PurchaseOrder` / `PurchaseOrderDetail` — Omise payments
- `CustomerSupply` / `CustomerSupplyDetail`, `SupplyOrder` / `SupplyOrderDetail` — cleaning-supply orders
- `CleaningSupply` — the supply catalog; `Supplier` / `SupplierProduct` — suppliers

**CMS & ops**
- `Banner` / `BannerLanguage` — localized banners
- `ErrorLog` — errors recorded by middleware and the app's `/guest/error-logs`
- `ImportData` — bookkeeping for the legacy agency import endpoints

## Working with the models

- New model checklist: `models/Foo.js` with `sequelize.define`, add associations in `models/relations.js`, then use `db.Foo` in controllers.
- `db.sequelize.sync()` runs on every boot (`app.js`); in production it only creates missing tables — treat schema changes as manual SQL.
- A second MySQL connection (`agency-connection` in config) is opened by `helpers/util.js` / `helpers/agencyData.js` to read the legacy agency database; imported supporters are matched via the `/import/*` endpoints in `routes/index.js`.
- Timestamps/conventions follow Sequelize defaults (`createdAt`/`updatedAt`); soft deletes are not used consistently — check the model before assuming.
