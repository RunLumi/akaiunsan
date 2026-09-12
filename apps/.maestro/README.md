# Maestro smoke tests

The flows map to the critical journeys in `biz-docs/content/docs/kiem-thu/`,
`biz-docs/content/docs/man-hinh/`, and the FR acceptance criteria. Run only one
device lane at a time, as required by the repository `AGENTS.md`.

## Local smoke-test setup

Use the migrated API at `https://akai-api.cjs.vn` for the authenticated smoke
run. A local backend is optional and only works when a reachable local database
is configured; the checked-in local config currently points at an external
development database, so do not assume `npm run local` is a usable API.

Start Metro, then build/install the app on exactly one device:

```bash
# terminal 1 — Metro using the migrated API host
cd apps
yarn install
API_URL=https://akai-api.cjs.vn yarn start

# Optional terminal 2 — local API, only after its DB health is verified
cd backend
npm install
npm run local
```

The app reads `API_URL` at bundle time. The production, development, staging,
and local app environment files now use `https://akai-api.cjs.vn`. Do not commit
`.env` changes,
credentials, signing files, or test-account passwords.

For a standalone iOS Release build (no Metro), select the production env
explicitly; otherwise Expo may load the developer `.env` and embed
`http://127.0.0.1:5000` in the bundle:

```bash
cd apps
ENVFILE=.env.production EXPO_NO_DOTENV=1 \
  SENTRY_DISABLE_AUTO_UPLOAD=true \
  xcodebuild -workspace ios/Akaiunsan.xcworkspace -scheme Akaiunsan \
  -configuration Release -sdk iphonesimulator \
  -destination 'id="$IOS_UDID"' build
```

Verify the built bundle contains `https://akai-api.cjs.vn` before running a
production Maestro flow.

Do not run Maestro against whatever app happens to be installed on the
simulator. That can silently reuse an older artifact. Build, install, and
verify the exact current artifact with the repository runner:

```bash
cd apps
IOS_UDID="$IOS_UDID" \
  ./scripts/run-ios-maestro.sh \
  .maestro/ios-production-account-smoke.yaml
```

The runner requires exactly one booted simulator, uses a clean per-device
derived-data path, checks `CFBundleVersion` against `app.json`, compares the
installed executable hash with the built executable, and only then launches
Maestro.

Before every lane, verify that no other simulator, emulator, Xcode build,
Gradle, Metro, or Maestro process is running. Use one explicit device ID,
finish the flow, force-stop the app, and shut down that device before changing
platforms.

## Test account

The authenticated flow needs a disposable local/UAT customer account. Prefer
creating one through the app's Sign Up screen. If an account must be created
through the API, use a generated address and password and keep both in the
shell environment only:

```bash
export MAESTRO_EMAIL="maestro-$(date +%s)@example.test"
export MAESTRO_PASSWORD='generated-local-only-password'
```

Do not use a production account or real payment data. The flow does not submit
a booking, charge a card, delete data, cancel a subscription, or remove an
account.

## Production signup smoke

The production registration flow uses a fresh disposable account and exercises
the required address picker before submitting `/auth/signup`:

```bash
MAESTRO_SIGNUP_EMAIL="maestro-$(date +%s)@example.test" \
MAESTRO_SIGNUP_PASSWORD='generated-local-only-password' \
maestro test --device "$IOS_UDID" apps/.maestro/ios-production-signup.yaml
```

The API must return HTTP 200 and the app must return to Sign In. A duplicate
email or invalid payload must show the backend's specific error message rather
than a generic HTTP 400 alert.

## Authentication smoke

```bash
maestro test apps/.maestro/ios-auth-detail.yaml
maestro test apps/.maestro/android-auth-detail.yaml
```

## Authenticated important-screen smoke

Use a staging/UAT customer account at runtime; never commit credentials:

```bash
MAESTRO_EMAIL='tester@example.test' \
MAESTRO_PASSWORD='...' \
MAESTRO_SERVICE_DATE="$(date -v+1d +%Y-%m-%d)" \
maestro test apps/.maestro/important-screens-smoke.yaml
```

The flow covers the Home/service entry point, Booking tabs, Inbox tabs,
Account utilities, Favourite, Payment, History, Address, Subscription,
Promotions, and logout. It intentionally avoids destructive operations and
real payment or booking submission.

For a deterministic booking/payment smoke without production side effects, run
the temporary mock API and use the focused iOS flow:

```bash
node /tmp/akaiunsan-maestro-mock-api.mjs
MAESTRO_SERVICE_DATE="$(date -v+1d +%Y-%m-%d)" \\
  maestro test --device "$IOS_UDID" apps/.maestro/ios-maid-booking-mock-payment.yaml
```

The mock accepts a fake order and the flow stops after the result screen; it
does not charge a card or create a production booking.

The extended iOS lane adds the documented detail and wizard routes (AllService,
Booking calendar/detail/edit, history detail, Inbox detail, Petcare payment,
Promotion detail, My Booking, Favourite provider, profile/address picker,
referral, and About Us):

```bash
MAESTRO_EMAIL='tester@example.test' \
MAESTRO_PASSWORD='...' \
MAESTRO_SERVICE_DATE="$(date -v+1d +%Y-%m-%d)" \
maestro test --device "$IOS_UDID" apps/.maestro/ios-important-screens-80.yaml
```

## Production iOS account smoke

The production API currently supports authentication and profile/account
navigation, but the deployed backend does not yet expose the legacy mobile
service-catalog routes (`/services-management*` and `/banner/get-banner`).
Use this lane to verify production auth and account screens without masking
that catalog gap:

```bash
MAESTRO_EMAIL='disposable-production-account@example.test' \
MAESTRO_PASSWORD='...' \
maestro test --device "$IOS_UDID" apps/.maestro/ios-production-account-smoke.yaml
```
