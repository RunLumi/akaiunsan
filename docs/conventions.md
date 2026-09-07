# Code Conventions

Patterns distilled from the existing codebase. When editing, match the surrounding code first; these notes fill the gaps.

## Backend (CommonJS, JavaScript)

- `require` / `module.exports` only — no ESM `import`/`export`, no transpiler.
- One controller file per domain (`foo.controller.js`); multi-part domains get a folder with an `index.controller.js`.
- Standard controller surface: `create`, `getById`, `getList` (pagination `page`/`limit`, `order`, `sortBy`, `keyword`, filters), `updateById`, `deleteById`.
- Pagination/search is implemented inline in controllers with Sequelize `findAndCountAll`; keep the same query-parameter names when adding endpoints.
- Models: PascalCase file per table (`models/Customer.js`), `sequelize.define` export, associations registered centrally in `models/relations.js`.
- Route files map URL paths to controllers and are mounted by tier (public/client/backoffice/agency/bot) — never add routes to `app.js`.
- Validation via `middlewares/validator.js` / `helpers/validator.js`; admin auth via `middlewares/admin.js`.
- Date/time: both `moment` and `dayjs` are available; existing code uses `moment` more often — match the file you're editing.
- No linter/formatter is configured; follow existing style (2-space indent, double quotes, semicolons in backend).

## Mobile app (TypeScript)

- TS strictness is whatever `tsconfig.json` allows (4.3-era); do not introduce newer TS syntax than the toolchain supports.
- Feature screens grouped in `src/screens/<Feature>/`; shared UI in `src/components` with a barrel `index.ts` — extend the barrel when adding components.
- Redux flow: `actions.ts` → `sagas/` (side effects, axios) → `reducers/`; persisting via redux-persist in `store.ts`.
- Theming/constants from `src/shared/`; i18n strings in `src/shared/I18n` — no hardcoded user-facing copy.
- ESLint config exists (`.eslintrc.json`); keep imports ordered as existing files do.
- Native changes require rebuilding the app (bare workflow — expo updates exist via `expo-updates`, see `updateSource` hook).

## Git

- Main branch: `main`. CI deploys `develop`.
- Repo mixes two package managers historically: backend uses npm (`package-lock.json` + `yarn.lock` both exist — prefer npm for backend), apps use yarn (`yarn.lock` only).
- No commit convention is established; keep messages plain and descriptive.
