# Mobile App (`apps/` — Akaiunsan customer app)

Customer-facing React Native app for Akaiunsan. React Native 0.64 + Expo SDK 43 (bare workflow), TypeScript 4.3, React 17.

## Commands

```bash
cd apps
yarn install
yarn start:expo        # expo dev client
yarn start             # metro bundler
yarn android           # default debug
yarn ios               # default debug

# Android flavors (react-native-config picks .env.dev / .env.staging / .env.production)
yarn android:dev           yarn android:dev-release
yarn android:staging       yarn android:staging-release
yarn android:prod          yarn android:prod-release

# iOS schemes
yarn ios:staging       # scheme 'AkaiunsanStaging'
yarn ios:prod          # scheme 'AkaiunsanProduction'

# Release APK builds (from apps/README.md)
cd android && ENVFILE=.env.staging  && ./gradlew app:assembleRelease
cd android && ENVFILE=.env.production && ./gradlew app:assembleRelease
```

## Layout

```
App.tsx              # root: Provider + PersistGate + navigation + push notification setup
index.js             # RN entry point (registers App)
src/
  navigation/        # root.ts (root switch), index.tsx (stacks), BottomTab.tsx
  screens/           # feature folders: Auth, Main, Booking, MyBooking, History, Payment,
                     #   Address, Favourite, Promotion, Subscription, ServiceScreen,
                     #   EditAndReOrderServiceScreen, Other
  components/        # shared UI (Button, Header, TextInput, Picker, PlanCard, ...), index.ts barrel
  redux/
    store.ts         # store + redux-persist
    actions.ts       # action creators
    reducers/        # auth, language, tools
    sagas/           # auth saga, root saga
  shared/            # Colors, Constants, Enum, Layout, Styles, Utils, Geocoding, I18n/
  hooks/             # useCachedResources, updateSource
  assets/
ios/                 # Xcode project "Akaiunsan" (schemes: AkaiunsanProduction, AkaiunsanStaging), CocoaPods
android/             # gradle project with dev/staging/production variants
```

## Environment & config

- `.env`, `.env.dev`, `.env.staging`, `.env.production` are read at build time by `react-native-config` (API base URL, keys).
- Firebase: `google-services.json` (Android), `GoogleService-Info.plist` (iOS) — Analytics, Crashlytics, Messaging.
- **Sentry**: `@sentry/react-native@^8` (v8.25.0, Expo 57 / RN 0.86). Initialized in `instrument.ts`, imported first in `index.js`, root component wrapped with `Sentry.wrap()`; route tracking via `Sentry.reactNavigationIntegration()` registered on the `NavigationContainer` in `src/navigation/index.tsx`. DSN has a built-in default compiled in; `EXPO_PUBLIC_SENTRY_DSN` in `apps/.env` (inlined by Expo CLI at bundle time) or the `react-native-config` keys override it. `EXPO_PUBLIC_SENTRY_ENV` (`development`/`staging`/`production`) tags the environment.
- **Sentry release uploads**: `"@sentry/react-native/plugin"` is registered in `app.json` `plugins` — it wires Android source-map uploads and the iOS dSYM upload build phase during `expo prebuild`. Uploads authenticate with `SENTRY_AUTH_TOKEN` (env var) or `apps/sentry.properties` (copy from `sentry.properties.example`, add an API token; gitignored).
- i18n via `i18n-js` with translations under `src/shared/I18n` (en/th); language is kept in redux (`reducers/language.ts`).

## Patterns to follow

- New screen: add a folder under `src/screens/<Feature>/` with an `index.ts`, register it in `src/navigation/` (screen-name constants live in `src/shared/Constants.ts`), use shared components from `src/components` (import via the barrel `components`).

## Production API configuration

The production mobile client must use `https://akai-api.cjs.vn` as `API_URL`.
Set `APP_KEY` in the ignored mobile environment file to the same value as the
backend deployment's `APP_KEY`; `useApi` sends it as `x-app-key` so it survives
the Caddy proxy. Do not restore the retired `api-mobile.akaiunsan.vn` or any
legacy host.
- **All HTTP calls go through the `useApi` hook** (`src/hooks/useApi.ts`): it reads the base URL from `react-native-config` (`API_URL`), attaches `Authorization: Bearer <token>` from redux, `Accept-Language`, and `platform` headers, and unwraps the API's `{ data }` envelope (surfacing `errors[0].message` as the error string). Use it (or the sagas that wrap it) rather than raw axios.
- Data fetching / side effects go through redux-saga (`redux/sagas/`); state via reducers + redux-persist for auth. Action types are declared in `redux/actions.ts` with `success`/`failure` suffix helpers.
- Use `src/shared/{Colors,Styles,Layout,Constants}` for theming — don't hardcode colors/sizes inline.
- Navigation from outside components: `src/navigation/root.ts` exposes `NavigationRoot.{navigate,push,replace,pop}` via a navigation ref.
- i18n via `i18n-js`; translations in `src/shared/I18n/{en,th}.ts`; current language in redux (`reducers/language.ts`).
- Push notifications: channel `com.akaiunsan.yoda.android` created in `App.tsx`; foreground handling in `src/components/Notifications.tsx`.

## Signing / release notes (from apps/README.md)

Android release keystore (`grabtasker.keystore` / `grabtasker.jks`) and iOS certs/provisioning profiles are present in the repo root of `apps/` — see docs/security.md. iOS bundles are named after "Akaiunsan"; the historical "grabtasker" naming also appears in signing assets. Release builds are manual (no CI for the app).
