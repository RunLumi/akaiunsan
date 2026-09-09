# Agent brief — Phase 5 RTK Query ports (Home/Booking/Inbox/Payment), saga removal, store wiring + Phase 3 leftovers

You are working inside `/Volumes/SSD/akaiunsan`, the **akaiunsan** monorepo, mobile app under `apps/` (React Native 0.86 + Expo SDK 57 + TypeScript; **yarn** is the package manager). **Read `AGENTS.md` and `docs/mobile-app-upgrade-plan.md` first** and follow their ground rules (TS backend untouched — never stage/edit `backend/*` or `admin/*`; secrets are gitignored — never print/commit config values).

## Mission (in order)

1. **Phase 5 — port the Home, Booking, Inbox, Payment modules from `useApi` (axios) to RTK Query**, TDD-first.
2. **Delete `redux-saga`** and **wire the app entry to the RTK store** (store.ts → RTK `configureStore`; `redux-logger` → dev-only).
3. **Phase 3 leftovers**: any-ratchet (<50), Navigation 7 typed routes, `moment` → `dayjs`.
4. **Remove EAS/OTA from the plan doc** (owner decision 2026-09-09: Phase 6 is dropped).

Hard gates after every commit: **jest suite green (report the observed suite/test count)**, **`tsc --noEmit` exit 0**, **ESLint 0 errors**, coverage floor `ci/check-floors.js` (overallLines ≥ 50 — do not raise it), **`expo-doctor` 21/21**. These are the Phase-4-era verified numbers; re-verify, don't trust stale ones.

## Current state (verified 2026-09-09, local `main` @ 2e76e33)

- **42 suites / 285 tests green**, overall jest line coverage **63.76%**, typecheck 0, lint 0 errors.
- Phase 5 strangler already started and **merged**:
  - `apps/src/redux/apiSlice.ts` — RTK Query slice (`@reduxjs/toolkit` 2.12) with `login` + `signup` mutations using `fetchBaseQuery({ baseUrl: Config.API_URL, prepareHeaders })` that mirrors `useApi`'s transport contract (Bearer token from `state.auth.token`, `Accept-Language` from `state.language`, `platform`, `x-app-key`). Your new endpoints must reuse that same `prepareHeaders` contract verbatim.
  - `apps/src/redux/listenerMiddleware.ts` — `setupListenerMiddleware(preloadedState?)` = `configureStore` composing legacy slices `{ auth, tools, language }` + `[apiSlice.reducerPath]: apiSlice.reducer` with `apiSlice.middleware` (serializableCheck/immutableCheck off). This IS the target store shape for the app entry.
  - `apps/src/redux/__tests__/apiSlice.test.tsx` — contract tests for the login/signup ports (the pattern to copy for every new endpoint).
  - `apps/src/test-utils/helpers.tsx` — `makeStore` (legacy redux store) vs `makeApiStore`/`createWithApiStore` (RTK strangler store). Ported screens must be tested with the RTK store.
- **Not yet ported**: `useApi` (`apps/src/hooks/useApi.ts`, axios-based) is still used by ~30 screens. Store boot (`apps/src/redux/store.ts`) is still the **legacy** store: `createStore` + `persistReducer` + saga middleware + unconditional `redux-logger`. App entry `apps/App.tsx` → `import redux from "./src/redux/store"` → `<Provider store={redux.store}><PersistGate persistor={redux.persistor}>`.
- `redux-saga` footprint: `apps/src/redux/sagas/auth.ts` (one watcher: `TYPES.AUTH.LOG_OUT` → put `success(TYPES.AUTH.LOG_OUT)` + invoke `action.callback`), `sagas/index.ts`, `store.ts` import, and `apps/src/redux/__tests__/sagas.test.ts` (characterizes that watcher).

## Modules to port exactly (named screens)

| Module | Screens (port these files) | Endpoints (read each screen's `useApi({...})` block for exact url/method/params) |
|---|---|---|
| Home | `src/screens/Main/Home.tsx` | `update_language`, `list_favourite_service`, `get_profile` (userMe), `get_banner`, plus whatever else its `useApi` blocks call (`Constants.API.*`) |
| Booking | `src/screens/Main/Booking.tsx` | `get_booking` (list + history = same URL), plus any detail fetch it drives |
| Inbox | `src/screens/Main/Inbox.tsx` | `get_notification` (paged), `delete_notification`, `read_all`, (badge count via notifee is kept) |
| Payment | `src/screens/Payment/PaymentList.tsx` | `payment_card_list`, `payment_card_delete`, `payment_card_default` |

Scope boundary: **only these 4 screen files** (plus whatever `Constants.API` endpoints they alone need). Sibling features (Address, Favourite, History, MyBooking, ServiceScreen/EditAndReOrder wizards, Subscription, FixPlan/FlexiblePlan, Promotion, Other/*, helper feature screens) remain on `useApi` for a later pass — do **not** port them now. The final Phase-5 DoD ("delete `useApi` entirely") is **out of scope** for this brief; leave `useApi` in place for the unported screens.

## How to port a module (TDD repeat per module, one commit per module)

1. **Read the characterization first.** The screen's existing `screens.smoke` / `screens.interactions` cases already define the requests it makes and the response shapes its callbacks read. Cite that data shape in your new tests.
2. **Add endpoints to `apiSlice`** with the exact URL strings from `Constants.API`, correct method, and typed payload/result. RTK Query `query` hooks for GETs (pagination → `params`), `mutation` hooks for deletes/creates. Follow the exact `useApi` callback contract the screen relies on (which response field it reads: `response.items`? `response.data`? errors array → `error` string?). If the screen's callback reads `error`, surface thrown fetch errors as strings the same way (mirror 400 → `i18n.t("home.error_400")`).
3. **Contract tests first** in `apps/src/redux/__tests__/apiSlice.test.tsx` (or a new sibling file) — cover: successful data, the error branch, and any params it sends. Mirror the login/signup port's test style (use the URL-aware fetch stub; see infra notes).
4. **Swap the screen's data layer:** replace each `useApi({...})` + callback with the RTK hook, keeping UI behavior pixel-identical. Port the `autoRequest` semantics with `InteractionManager.runAfterInteractions` if the screen used it (useApi only fires `autoRequest` after interactions).
5. **Make the suites characterise it on the RTK store.** The smoke/interaction cases for that screen must now run against `makeApiStore`/`createWithApiStore`, and the **`global.fetch` stub in `apps/jest.setup.js` must be extended to return a shaped body for that endpoint's path** (it is URL-aware today and only special-cases `/auth/signin`; everything else falls back to a geocode-shaped body which will starve ported screens of real data). Route by the endpoint path, keyed on `Constants.API.<name>`, returning the same shapes the axios router (`installApiRoutes` in `src/test-utils/api-mock.ts`) serves to the not-yet-ported screens.
6. **Verify no other suite regresses**: ported screens are mounted by `screens.smoke`/`screens.interactions`/`screens.variants`/`app-state` and others — run the full suite each time. Update any case that pinned the old axios behavior.

`Constants.API` note: **three constants share the URL `/client/subscriptions`** (`get_plan`/`get_subscription`/`cancel_subscription`) — if your ports touch subscriptions, serve one coherent payload that satisfies every consumer (see the `get_plan` merged-payload pattern already in `screens.smoke.test.tsx`).

## Task B — delete redux-saga + wire store

1. **Replace the logout watcher** (the only saga effect) with a saga-free mechanism that preserves the exact observed behavior:
   - A `LOG_OUT` dispatch (or thunk) must (a) reset `auth.token` to `""` **and** (b) dispatch `success(TYPES.AUTH.LOG_OUT)` **and** (c) invoke an optional `action.callback`. Those three behaviors are pinned by `store.test.ts` ("dispatching LOG_OUT triggers the saga's LOG_OUT/SUCCESS put") and `sagas.test.ts`. Prefer a thunk (`redux-thunk` via RTK default middleware) or a plain reducer case + a tiny helper that screens call. Keep callers compatible — search every use of `TYPES.AUTH.LOG_OUT`/`dispatch({ type: TYPES.AUTH.LOG_OUT` across `src/` and the tests.
   - **Update the pin tests in the same commit**: rewrite `sagas.test.ts` into an equivalent characterization test for the new mechanism (rename responsibly, e.g. `logout.test.ts`, and re-point the import), and update the two store.test.ts cases that assumed a saga.
2. **`src/redux/store.ts` → RTK.** Compose it exactly like `setupListenerMiddleware` plus persistence:
   - `configureStore` with `reducer: persistReducer(config, rootReducers+api combined)`, middleware = RTK defaults (`serializableCheck: false` for persist actions) `+ apiSlice.middleware` **+ `redux-logger` only behind `__DEV__`** (today it's unconditional; the store.test case pins that — update the test to pin dev-only). Persist config must keep `whitelist: ['auth','language']`, `blacklist: ['tools']`, key `'root'`, `AsyncStorage`. Keep the exported shape `{ store, persistor }` so `App.tsx` needs only its import path to change.
   - The api reducer must be in the persisted root **unless** persisting it breaks rehydration of legacy slices — verify with the existing persistence-path test behavior and keep behavior identical (auth token must still rehydrate; navigation gate reads `auth.token`).
3. **Remove the `redux-saga` dependency** from `package.json` and delete `src/redux/sagas/`. Grep to confirm zero imports of `redux-saga` remain (including in tests).
4. Keep `App.tsx` functionally unchanged (FCM/notifee/permissions untouched) — only its store import benefits; do not change it unless the switch requires it.

## Task C — Phase 3 leftovers (in this order, low risk first)

1. **`moment` → `dayjs`** (backend already on dayjs). 18 files import `moment` (`src/shared/Utils.ts`, Booking calendar/detail/history, FixPlan/*, PaymentPetcare, FlexiblePlan/ListPlan, AllSubscriptionPlan, ListMyBooking, HistoryDetail, InboxDetail, SelectTimeModal, tests). Replace line-for-line (`moment(x).format(...)` → `dayjs(x).format(...)`; note **`dayjs` uses lowercase `yyyy`/`DD` tokens like moment but check `H:mm` vs `HH:mm`**, and `moment().locale("en")` → `dayjs.locale("en")`; Calendar month-matrix builds via clones/`startOf('month')` translate directly). Add `dayjs`, remove `moment`; keep format outputs byte-identical — the suites assert rendered strings (snapshots exist). Best done with a parallel-grep list, module by module, running the full suite after.
2. **Navigation 7 typed routes (React Navigation 7).** Read `docs/mobile-app-upgrade-plan.md` §Phase 3 item 141: migrate to the **static API + typed routes** (`RootStackParamList` derived from the static config), route names become constants (also fixes the pinned translated-route-name bug — find that pin test in `src/navigation/__tests__`). The navigation tree is `src/navigation/index.tsx` + `BottomTab.tsx`; pure contracts live in `src/navigation/contracts.ts`. There are **7 route names currently string-typed** — make them typed constants. Keep `navigation.test.ts`/`app.test.tsx`/`BottomTab.test.tsx` green (they mount the real navigator; the Node-renderer late-wizard hang is documented, don't chase it).
3. **any-ratchet (<50).** plan §140: drive `: any` from the current count (measure it: `grep -rEc ": any\b|as any\b|any\[" src --include=*.ts --include=*.tsx`) **down toward <50** using a lint budget: `no-explicit-any` set to `warn` today (it already is, ratcheting mechanism is the goal). Create `scripts/count-explicit-any.mjs` (or extend `ci/`) so the CI floor mirrors `check-floors.js` but for the any-count, initial cap = **current measured count**, then reduce the cap as you land type-safety wins. Quick wins (keep the suite green): typed selector hooks (`useAppSelector`/`useAppDispatch`) in `src/redux/hooks.ts` and migrate hot paths; typed props for the shared components in `src/components`; guards around the handful of literal `any` casts. Do **not** chase <50 in one pass — set up the mechanism and land your first reduction (a few hundred is nice but even ~100 is progress); record the new cap and remaining delta in your report.

## Task D — remove EAS/OTA from `docs/mobile-app-upgrade-plan.md`

Delete Phase 6 scope and all EAS references: the **Phase 6 section (lines ~161–168)**, the Phase-0 tooling aside "EAS replaces them in Phase 6", the two EAS/OTA rows in the risks table (line ~84 area and ~195), the architecture table's Builds row, the Phase-2 DoD line that says `eas build --profile development`, the CI gate line referencing "EAS build only after merge to main", and the "Remaining work" line about EAS project link/credentials. Replace the removed Phase 6 section with a one-line note: "**Phase 6 (EAS/OTA/release engineering) removed from scope by owner decision 2026-09-09.**" Keep Maestro/device-smoke as an optional Phase 2 runtime-gate note if it doesn't mention EAS. `App.tsx` already ships with OTA off ("OTA updates are intentionally not part of the Akaiunsan runtime") — leave that as-is.

## Testing infrastructure — read me once

- **`jest.setup.js`** provides the whole dependency mock surface (notifee, FCM messaging/analytics, RNGH incl. Switch, pager-view, expo-image, async-storage, settings, etc.) and a **URL-aware `global.fetch`** used by RTK `fetchBaseQuery`. Extend it per Task A step 5. Also has a `FormDataStub` and a `Platform` pin — do not disturb.
- **`src/test-utils/api-mock.ts`** `installApiRoutes(axiosMock, routes, fallbackData)` + `defaultEnvelope` — still the router for `useApi`/axios on the un-ported screens. Ported screens will *not* hit axios anymore; ported-screen tests must drive fetch instead.
- **jest-each `done` trap**: a test fn declaring more params than the table row provides receives `done()` last and hangs ~90s. Derive variants from labels, never extra params.
- **FCM 900ms debounce**: mounting Login/Home/Inbox arms an FCM-token debounce that can fail the process post-run. Don't add new suites that mount those screens without settling (existing suite already handles it — don't reintroduce the race).
- **`pressAll`/`typeAll`** in helpers.tsx are the interaction drivers; compose with their `skipPatterns` param rather than forking.
- All API data in tests flows through shaped routes — never rely on the empty fallback for data your ported screen's callbacks read.

## Workflow rules (shared repo — parallel agents may be committing)

- Default branch is `main`; current tree is `main` with a pre-existing dirty file `M apps/src/screens/__tests__/addfixplan-variants.test.tsx` — **do not steal/adopt that in-progress edit**; leave it untouched or stash/work around it, and never commit someone else's WIP.
- The shared worktree moves around: before pushing, re-verify `git branch --show-current` + status. For anything that isn't a clean direct commit on `main`, use the **git-worktree PR flow**: `git worktree add <dir> origin/main`, symlink `<dir>/apps/node_modules` and `<dir>/apps/.jest-cache` from the main checkout, cherry-pick your commit(s), push a branch, `gh pr create --base main`, merge.
- Stage **only** `apps/` + `docs/agent-prompts`/plan-doc changes relevant to your work. Never commit `backend/`/`admin/` or any config/secret.
- Commit per module/unit with a message matching repo style, e.g. `feat(mobile): port Main/Home to RTK Query (apiSlice: list_favourite_service, get_profile, get_banner)` or `chore(mobile): drop redux-saga in favor of logout thunk (store -> RTK configureStore)`. Include a WIP-doing log row in `docs/mobile-app-upgrade-plan.md`'s execution log table per landed step (date plus what/verified numbers).
- Push changes to `main` only when explicitly told; otherwise raise PRs and leave them for review/merge.

## Verification (run before you report done)

```bash
cd apps
yarn typecheck            # tsc --noEmit exit 0
yarn lint                 # ESLint 0 errors (warnings OK = the any budget)
CI=true yarn test --ci --coverage   # full suite green; note suite/test counts
npx expo-doctor           # expect 21/21 (baseline; expo-doctor version pinned)
node ci/check-floors.js   # floors pass (overallLines >= 50)
```

(Obey PROMPT: do not copy a cached `--coverage` value — report the number from your own run.)

## Report back

1. Suites/tests green count + overall jest line coverage after each commit and at the end.
2. Per module: endpoints added to apiSlice, screens moved, what tests characterize them, any shape you had to fix in the fetch stub.
3. Saga removal: what replaced the logout watcher, how `store.test.ts`/`sagas.test.ts` were updated, `redux-saga` removal verified by grep + `yarn why`/`package.json`.
4. any-ratchet: mechanism added, measured before/after count, new cap.
5. Navigation typed routes: which 7 routes, what the ParamList looks like, pins preserved/updated.
6. dayjs: files touched, any format-token differences you had to neutralize, suite green proof.
7. EAS/OTA removal: exact doc lines deleted/replaced.
8. Anything you left un-done and why (blockers, risk, or out-of-scope boundaries you respected).