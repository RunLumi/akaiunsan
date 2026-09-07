# Mobile App (`apps/` — mobile-app)

Customer-facing React Native app for Ayasan. React Native 0.64 + Expo SDK 43 (bare workflow), TypeScript 4.3, React 17.

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
yarn ios:staging       # scheme 'AysanStaging'
yarn ios:prod          # scheme 'AyasanProduction'

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
ios/                 # Xcode project "Ayasan" (schemes: AyasanProduction, AysanStaging), CocoaPods
android/             # gradle project with dev/staging/production variants
```

## Environment & config

- `.env`, `.env.dev`, `.env.staging`, `.env.production` are read at build time by `react-native-config` (API base URL, keys).
- Firebase: `google-services.json` (Android), `GoogleService-Info.plist` (iOS) — Analytics, Crashlytics, Messaging.
- i18n via `i18n-js` with translations under `src/shared/I18n` (en/th); language is kept in redux (`reducers/language.ts`).

## Patterns to follow

- New screen: add a folder under `src/screens/<Feature>/`, register it in `src/navigation/`, use shared components from `src/components` (import via the barrel `components`).
- Data fetching / side effects go through redux-saga (`redux/sagas/`); state via reducers + redux-persist for auth.
- Use `src/shared/{Colors,Styles,Layout,Constants}` for theming — don't hardcode colors/sizes inline.
- API calls use a central axios setup; check `src/shared/Constants.ts` and `.env.*` for base URLs.
- Push notifications: channel `com.ayasan.yoda.android` created in `App.tsx`; foreground handling in `src/components/Notifications.tsx`.

## Signing / release notes (from apps/README.md)

Android release keystore (`grabtasker.keystore` / `grabtasker.jks`) and iOS certs/provisioning profiles are present in the repo root of `apps/` — see docs/security.md. iOS bundles are named after "Ayasan"; the historical "grabtasker" naming also appears in signing assets. Release builds are manual (no CI for the app).
