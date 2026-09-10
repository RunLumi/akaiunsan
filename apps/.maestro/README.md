# Maestro smoke tests

The flows map to the critical journeys in `biz-docs/content/docs/kiem-thu/`
and `biz-docs/content/docs/man-hinh/`. Run only one device lane at a time, as
required by the repository `AGENTS.md`.

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
