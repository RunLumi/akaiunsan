# Maestro smoke tests

The flows map to the critical journeys in `biz-docs/content/docs/kiem-thu/`,
`biz-docs/content/docs/man-hinh/`, and the FR acceptance criteria. Run only one
device lane at a time, as required by the repository `AGENTS.md`.

## Local smoke-test setup

Use a local API for repeatable development. Start the backend first, then Expo
Metro, then build/install the app on exactly one device:

```bash
# terminal 1 — API (requires the repository's local DB/config)
cd backend
npm install
npm run local

# terminal 2 — Metro
cd apps
yarn install
API_URL=http://127.0.0.1:5000 yarn start
```

The app reads `API_URL` at bundle time. Do not commit `.env` changes,
credentials, signing files, or test-account passwords.

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
maestro test apps/.maestro/important-screens-smoke.yaml
```

The flow covers the Home/service entry point, Booking tabs, Inbox tabs,
Account utilities, Favourite, Payment, History, Address, Subscription,
Promotions, and logout. It intentionally avoids destructive operations and
real payment or booking submission.
