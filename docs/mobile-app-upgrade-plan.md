# Mobile App Upgrade Plan — TDD, Expo SDK 57 Replatform, TypeScript Hardening

Status: **proposed, not started**. Audit performed 2026-09-07 against `main@104a04e` (post-rebrand).
Scope: `apps/` only. Companion docs: [mobile-app.md](mobile-app.md) · [conventions.md](conventions.md) · [deployment.md](deployment.md) · [security.md](security.md) · sibling: [backend-upgrade-plan.md](backend-upgrade-plan.md).

---

## 1. Audit findings

### 1.1 Platform gap — five years behind

| | Current | Latest stable (2026-09) |
|---|---|---|
| React Native | **0.64.3** (Mar 2021) | 0.86 |
| Expo SDK | **43** (bare workflow) | 57 |
| React | 17.0.1 | 19.2 |
| TypeScript | 4.3.5 | 5.x |
| JS engine | JSC (`expo.jsEngine=jsc`, Hermes **off**) | Hermes (default) |
| Architecture | Old (bridge) | New Architecture mandatory since RN 0.76 |
| Android build | AGP 4.2.1 / Gradle 6.9 / compileSdk 33 / targetSdk 31 / jcenter() | AGP 8.x / compileSdk 36 / targetSdk 36 |
| iOS | platform 12.0 | platform 15.1 (SDK 57) |
| Navigation | React Navigation 6 | React Navigation 7 (8 in development) |

Consequences of the gap: Play Store targetSdk requirements are already unmet for new listings; **OTA updates are silently dead** — `expo-updates` 0.10.15 points at the retired classic-updates service (`exp.host/@anonymous/…`); New-Architecture-incompatible library versions throughout.

### 1.2 Code health

- 27,674 LOC TypeScript in `src/` — 49 screens (13 folders), 20 shared components. **Already 100% `.ts/.tsx`** (only `index.js` entry is JS).
- `strict: true` is on, but **399 `: any`** occurrences across 80 files — mostly `(state: any) =>` selector idiom, refs, and props. Zero `@ts-ignore`.
- **Zero tests.** `jest` key is `{"preset": "jest-expo"}` with no test files, no `jest.config.*`, no `__tests__/`.
- Redux is thin: 3 reducers (`auth`, `tools`, `language`), persist whitelist `auth`+`language` on AsyncStorage, and **one active saga** (logout) — `login()` is defined but never registered. All server state lives in components through `useApi` (48 importing files, ~90 endpoint paths in `Constants.API`).
- `redux-logger` runs in every build, including production.
- Bottom-tab route names are **i18n-translated strings** (`i18n.t("Home")`) — locale switch breaks navigation state persistence and deep links; a latent bug to pin, then fix.
- Android scripts are malformed (`app:--variant=…` referencing flavors that don't exist; `ENVFILE` + `./gradlew` per README is the real path). iOS scheme `AysanStaging` is a typo; four schemes still named `Ayasan*`.
- Duplicate `.babelrc` + `babel.config.js`; no reanimated babel plugin despite reanimated 2.2 (works only because JSC + old-arch laziness).
- `AppDelegate.m` imports `FBSDKApplicationDelegate` but no FBSDK pod exists — stale native code that will not survive prebuild.

### 1.3 Dependency risk

| Package | State | Risk |
|---|---|---|
| `react-native-push-notification` 8.1.1 | **deprecated/archived** | **High** — used for channels + local notifications |
| Push stack ×4 | RN-push-notification **+** `push-notification-ios` **+** `notifee` 7 **+** `firebase/messaging` 14 (+ unused `expo-notifications`) | Consolidate on notifee + messaging |
| `react-native-action-button` | personal **git fork** | **High** — supply-chain + unmaintained; vendor or replace |
| `react-native-snap-carousel`, `react-native-swiper` | unmaintained | **High** — no New Arch support; replace (Flash List / pager-view) |
| axios 0.21.4 | old major, known CVE line | upgrade to 1.x |
| `moment` + `moment-timezone` | maintenance mode; backend already moved to dayjs | consolidate on dayjs |
| `react-native-fast-image` | superseded by `expo-image` on SDK 57 | replace |
| `react-native-restart` 0.0.23, `react-native-render-html` 6, `react-native-stars`, `react-native-table-component`, `react-native-elements` 3 | stale majors | upgrade or vendor small pieces |
| `react-native-maps` 0.28, reanimated 2.2, gesture-handler 1.10, screens 3.8, safe-area 3.3, webview 11, firebase 14, notifee 7, config 1.4 | all far below New-Arch-compatible majors | mass upgrade at replatform |
| `react-native-web` 0.17 + `react-messenger-customer-chat` imported in native screens | web-only code in native bundle | decision: drop web target (default) |
| `@unimodules/core` + `react-native-unimodules` | SDK-43 era glue, long removed | deleted by replatform |

### 1.4 Secrets & hygiene (must fix before any public build)

- Committed at repo root: `grabtasker.jks`, `grabtasker.keystore`, `*.mobileprovision`, two `*.p12` + private keys, `aps*.cer`, `ios/AuthKey_*.p8` (APNs); plaintext keystore passwords in `android/gradle.properties`; deploy passwords in `apps/README.md`.
- `.env*` files are **committed and not gitignored** (values include Omise keys).
- Google Maps API key hardcoded in three places (`app.json`, `Constants.ts`, `AppDelegate.m`).

### 1.5 What is already fine

- 100% TypeScript, single `useApi` data layer, endpoints centralized in `Constants.API` — a thin, mockable seam.
- Redux surface is tiny (3 reducers, 1 saga) — migration to Redux Toolkit is cheap, not a rewrite.
- Custom native code is essentially **zero** (template-only `MainActivity/MainApplication/AppDelegate`; no custom pods or gradle plugins beyond libraries) — the native folders are regenerable, which makes the replatform strategy (Phase 2) safe.
- i18n is complete: en + th, 312 keys each — parity-testable.
- The rebrand already made `app.json` the identity source of truth (bundle ID, scheme, plugins, `googleServicesFile` pointers) — exactly what prebuild consumes.

---

## 2. Target stack (end state)

| Concern | Choice | Why |
|---|---|---|
| Platform | **Expo SDK 57** (RN 0.86, React 19.2), **CNG** (prebuild from `app.json`) | Latest stable; native folders are near-stock so regeneration beats 14 rungs of ladder-upgrades |
| Engine / arch | **Hermes + New Architecture** | Default and mandatory path; old arch removed |
| Language | **TypeScript 5.x strict, `any`-budgeted** | Already strict; harden, don't convert |
| Navigation | **React Navigation 7** (`native-stack`, static API, typed routes) | Incremental from v6; expo-router explicitly deferred (backlog) |
| Data layer | **Redux Toolkit + RTK Query** strangler over `useApi`; saga deleted | One data pattern, cache, typed hooks; only 1 saga exists today |
| Persist | `redux-persist` (auth + language only) on AsyncStorage | Keep semantics |
| Push | **notifee + @react-native-firebase/messaging only** | Kills deprecated RN-push-notification and the 3 redundant stacks |
| Testing | **Jest + @testing-library/react-native v14** (unit/integration), **Maestro** (E2E smoke) | RNTL supports modern RN; Maestro is the pragmatic Expo E2E |
| API mocking | axios adapter mock (or MSW) behind `useApi`/RTK Query fetch | Tests the real unwrap/error contract |
| OTA | **EAS Update** (or disabled) | Classic updates endpoint is dead already |
| Builds | **EAS Build** profiles (development / staging / production) | Replaces malformed gradle scripts + README runbook |
| i18n | i18n-js now; typed keys backlog | No migration cost justified yet |
| CI | GitHub Actions: typecheck + lint + jest on every PR; Maestro nightly on macOS runner | Repo lives on GitHub since the rebrand PR |

---

## 3. Guiding principles

1. **TDD means characterization first.** The app has zero tests. Before any upgrade, pin the contracts that upgrades threaten: `useApi` envelope/error semantics, auth-gated navigation, redux/persist shape, i18n parity, deep-link config. Upgrades then run under a green suite; new code is red-green-refactor.
2. **The rebrand freed us from continuity.** This is a **new store listing with zero installed users** — no OTA-compat chains, no keep-every-rung-shippable constraint. That licenses a one-shot replatform (Phase 2) instead of a 14-SDK ladder, gated by tests + Maestro smoke instead of "ship every step".
3. **Replatform ≠ rewrite.** All 49 screens, components, redux, i18n, and `Constants` are carried over as-is; only the platform, build system, and dead libraries change. Screen rewrites are out of scope.
4. **Behavior-preserving changes separated from behavior changes.** (SDK jump = environment change verified by characterization; lib swaps = same UX; RTK Query = same requests/responses.)
5. Rollback = `git revert`. No data migrations, no server coupling — every phase is trivially revertible.

---

## 4. Phased plan

### Phase 0 — Hygiene & safety net (≈2–3 days)
Goal: make change cheap and verifiable; remove live credentials from the repo. No app behavior changes.

1. **Secrets out**: gitignore + `git rm --cached` the keystores/`*.p12`/`*.p8`/`.env*` (keep local copies via secure storage); rotate: new upload keystore, new APNs key, Omise keys, README passwords scrubbed. Coordinate with backend (docs/security.md).
2. Tooling: ESLint 9 (typescript-eslint) + Prettier; delete duplicate `.babelrc`; fix malformed android scripts or delete them (EAS replaces them in Phase 6); `.nvmrc` (22) + `engines`.
3. Jest wired for real: `jest-expo` for now (tests must run on the *current* stack), `jest.config.js`, `scripts.test = jest` (not watch), TypeScript 4.3 → 5.x here (low risk, tests are TS).
4. GitHub Actions: `apps-ci.yml` — typecheck + lint + jest on every PR touching `apps/`.
5. Pin two latent bugs with tests (`// pins current behavior`): translated tab route names; `redux-logger` in production.

**DoD:** CI green with a trivial suite; `git log` shows no credential files added; no behavior change.

### Phase 1 — Characterization tests on SDK 43 (≈4–6 days)
Goal: lock the contracts the replatform threatens. Still zero production changes.

1. **`useApi` contract** (highest value): unwrap `data.data`, `errors[0].message` error path, statusText fallback, the 400→`home.error_400` i18n mapping, `autoRequest` + `InteractionManager` behavior, per-call overrides. Mock axios adapter, not the hook.
2. **Redux + persist**: auth token gate in navigation (`!token` → Login group), LOG_OUT saga effect, whitelist persistence of `auth`+`language` (mount store with mock AsyncStorage).
3. **Navigation**: linking config (`akaiunsan://` prefixes, Login route mapping), FCM `data.type` 0–4 deep-link switch, tab structure snapshot.
4. **i18n parity**: en/th key-sets identical (312 keys), no missing translations — a pure data test that survives everything.
5. **Shared components**: render smoke tests for the 20 components (mock `useApi` consumers where needed) + `Utils.ts` pure functions.
6. **Golden files**: `Constants.API` endpoint inventory (~90) snapshotted — regression-detects accidental endpoint drift during later phases.

**DoD:** `shared/` + `redux/` + `hooks/` ≥80% line coverage; component smoke green; CI fails on any drift. These tests must be written to be **platform-agnostic** (no SDK-43-only APIs) so they survive Phase 2.

### Phase 2 — Replatform to Expo SDK 57 (≈8–12 days; the milestone)
Goal: RN 0.86 / React 19.2 / Hermes / New Architecture / CNG, carrying all app code. One branch, merged when the characterization suite + Maestro smoke are green.

1. **Adopt CNG**: regenerate `ios/` + `android/` from `app.json` via `prebuild` (the rebrand already made it the identity source of truth: bundle ID `com.akaiunsan.customer`, scheme, intent filters, `googleServicesFile`, plugins). Delete hand-maintained native folders; custom native code is nil. GoogleMaps pod via config plugin; drop the stale FBSDK AppDelegate code (Facebook SDK comes through `expo-apple-authentication`/FB pod only if still needed — audit at execution).
2. **Mass dependency jump** (exact versions pinned by `npx expo install --fix` at execution): firebase v20+ (14→latest breaking changes), notifee 7→latest, maps 0.28→1.x, reanimated 2→4, gesture-handler 1→2, screens 3→4, safe-area 3→5, webview 11→13, async-storage 1→2, device-info 8→14, config stays; remove `@unimodules/*`, `react-native-unimodules`, `expo-notifications` (unused), `react-native-web`-only bits per decision.
3. **JS/API breakage pass** (known list): React 19 (no string refs/propTypes patterns), RN component removals, `AppState`/`Appearance` changes, AsyncStorage 2 API, reanimated 3+ worklets + babel plugin (finally add it), Flipper removed (SDK 50+), interop layer for any remaining old-arch JS-only libs until Phase 4 replaces them.
4. **Push stack unification** (do it here, not later — it's native): all local notifications/channels through notifee; delete `react-native-push-notification`, `push-notification-ios`; keep messaging for FCM. The notification channel ID stays `com.akaiunsan.customer`.
5. **Boot-critical flows verified with Maestro** (write the flows here, they become the release smoke suite): cold start → splash → login screen renders; login (mock/staging creds) → Home; tab navigation; deep link `akaiunsan://…` opens Login route.
6. Update `docs/mobile-app.md` + README for the new toolchain.

**DoD:** app boots on iOS + Android simulators with Hermes + New Arch on; full Phase 1 suite green; Maestro smoke green; `expo-doctor` clean; buildable via `eas build --profile development`.

> Fallback: if prebuild regeneration stalls >3 days on a plugin gap, switch to the ladder (43 → 50 → 53 → 57) — same phases, more rungs. Decision point documented in the execution log.

### Phase 3 — TypeScript hardening (≈3–5 days)
1. Drive `: any` from 399 → **<50** with an lint budget (`no-explicit-any` warn, count ratcheted down): typed `RootState`, typed selector hooks (`useAppSelector`), typed `useApi<T>` generics per endpoint group, typed component props for the 20 shared components.
2. React Navigation 7 **static API + typed routes** (`RootStackParamList` from the static config) — also fixes the translated-route-name bug deliberately (route names become constants; labels stay translated). Pin-then-fix from Phase 0/1.
3. `moment` → **dayjs** (align with backend; mechanical, i18n locale files included).

**DoD:** `any` count under budget enforced by lint; navigation typed; date suite green.

### Phase 4 — Library replacement sweep (≈4–6 days)
1. `snap-carousel` → **Flash List**/reanimated carousel; `swiper` → `react-native-pager-view`; `action-button` git fork → vendored local component (small, MIT-style check) or removed.
2. `fast-image` → `expo-image`; `render-html` → current major; `react-native-restart` usage audited (likely removable after language-switch flow check).
3. axios 0.21 → 1.x (error-shape change — the Phase 1 `useApi` contract tests catch regressions).
4. Dead code: `expo-app-loading` (unused), `@types/*` out of `dependencies`, `react-messenger-customer-chat` (web-only).

**DoD:** zero deprecated/unmaintained runtime deps on the New Architecture; bundle size before/after recorded.

### Phase 5 — State & data modernization (≈6–10 days)
1. Introduce **Redux Toolkit** store (same reducers, `configureStore`), typed hooks; `redux-logger` → dev-only.
2. **RTK Query strangler**: define the API slice over `Constants.API`; migrate `useApi` call-sites module-by-module (Auth first — it gates navigation — then Home/Booking/Inbox/Payment). Each module: characterization tests already define the expected requests; port → delete its `useApi` usage. ~48 files, mechanical once the first two modules set the pattern.
3. Delete `redux-saga` (its one logout effect becomes a thunk or mutation lifecycle).

**DoD:** no `useApi` imports outside the RTK Query adapter (or gone entirely); saga dependency removed; auth flows green under tests.

### Phase 6 — Release engineering (≈3–5 days)
1. `eas.json`: development / preview(staging) / production profiles; credentials managed by EAS (new keystore from Phase 0 rotation); internal distribution for staging.
2. **EAS Update** channel decision (or OTA disabled — it is dead today anyway).
3. Version reset to **1.0.0** (new listing, new identity); Android `versionCode`/iOS build number under EAS management.
4. Maestro smoke suite in CI (nightly + pre-release); store listings, icons, splash with the Akaiunsan branding (the outstanding rebrand follow-ups).
5. Update [deployment.md](deployment.md); GitLab CI untouched (backend only).

**DoD:** `eas build` produces installable dev + staging builds; production build submitted to internal test tracks; docs current.

### Backlog (explicitly out of scope)
- expo-router adoption (would replace React Navigation structure wholesale).
- react-native-web target revival (drop is the default in Phase 2).
- Sentry alongside Crashlytics; typed i18n keys; dark-mode audit (`userInterfaceStyle: automatic` already set).
- Omise → newer SDK/payment web-flow review (needs backend coordination).

---

## 5. TDD workflow (applies to every step)

- **Characterization (Phases 0–1):** test current behavior, even bugs; annotate `// pins current behavior` (translated route names, prod logger) for deliberate fixes later.
- **Replatform (Phase 2):** suite must stay green across the jump — that's the definition of done for the environment change; Maestro flows are the runtime gate CI can't give.
- **Library/data changes (Phases 3–5):** red-green-refactor; a behavior change without a failing-test-first commit is rejected in review.
- Layout mirrors src: `apps/src/components/__tests__/`, `apps/src/hooks/__tests__/`; Maestro flows in `apps/.maestro/`.
- CI gate: typecheck + lint + jest on every PR; Maestro nightly; EAS build only after merge to `main`.

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 5-year platform jump hides runtime breakage tests can't see | Maestro smoke on both platforms gates Phase 2; interop layer keeps old JS-only libs alive until Phase 4 |
| Prebuild/plugin gap (maps pod, FBSDK remnants, env-config) | 3-day timebox then documented ladder fallback; custom native code audited as nil |
| React Native Firebase 14 → 20+ API drift (messaging, crashlytics) | Push flows covered by characterization + Maestro; upgrade guide followed inside Phase 2, not spread out |
| Reanimated 2 → 4 worklet semantics | Add babel plugin at jump; animations are light in this app (audit found no custom worklets) |
| `useApi` → RTK Query regression across 48 files | Endpoint golden-file snapshot from Phase 1; module-by-module strangler with per-module PRs |
| Secrets rotation breaks existing builds mid-flight | Rotate at Phase 0, keep old credentials valid in parallel for one release cycle; EAS takes over in Phase 6 |
| iOS scheme/provisioning profile chaos (`Ayasan*` schemes, committed profiles) | New Apple App ID `com.akaiunsan.customer` (needed anyway for the new listing); EAS-managed credentials |
| Team muscle memory (gradle scripts, README runbook) | Phase 6 rewrites docs; `eas build` is a single command |

## 7. Sequencing & effort

| Phase | Est. | Ships independently? |
|---|---|---|
| 0 Hygiene & safety net | 2–3 d | yes |
| 1 Characterization tests | 4–6 d | yes (CI value alone) |
| 2 Replatform to SDK 57 | 8–12 d | yes — this is the milestone |
| 3 TypeScript hardening | 3–5 d | yes |
| 4 Library replacement | 4–6 d | yes, per-PR |
| 5 RTK Query migration | 6–10 d | yes, per-module |
| 6 Release engineering | 3–5 d | yes |

Total ≈ **30–47 focused days**. Recommended first milestone: Phases 0–2 (≈3 weeks) — that alone moves the app to a supported platform with a test suite, clearing the store-listing blockers for the Akaiunsan launch.

## 8. Execution log (updated as phases land)

| Date | Milestone | Evidence |
|---|---|---|
| — | — | — |
