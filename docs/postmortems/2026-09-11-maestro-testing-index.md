# Akaiunsan Maestro testing postmortems

Date: 2026-09-11

This index records the engineering issues found while building and running the
important-screen Maestro flows. It distinguishes confirmed causes from open
hypotheses and does not infer customer counts from local simulator evidence.

## Incident register

| ID | Incident | Status | Postmortem |
|---|---|---|---|
| M-01 | Firebase native modules and concurrent simulator/build lanes | Resolved for the simulator lane | [M-01](2026-09-11-maestro-ios-startup-and-serial-lane.md) |
| M-02 | Mobile signup payload did not match the backend field contract | Resolved and deployed to `prod` | [M-02](2026-09-11-maestro-mobile-signup-contract.md) |
| M-03 | Booking wizard emitted invalid dates and could advance from stale state | Fixed in the current mobile worktree; retest pending | [M-03](2026-09-11-maestro-booking-wizard-state.md) |
| M-04 | Inbox mutated RTK Query response objects | Fixed in the current mobile worktree; retest pending | [M-04](2026-09-11-maestro-inbox-rtk-cache-mutation.md) |
| M-05 | Favourite Provider navigation repeatedly crashed iOS | Open; root cause not yet proven | [M-05](2026-09-11-maestro-ios-favourite-provider-crash.md) |
| M-06 | Store build selected the wrong environment and Sentry symbol upload lacked stable project configuration | Resolved in source/release tooling; release verification remains artifact-specific | [M-06](2026-09-11-mobile-release-configuration.md) |
| M-07 | Focused React Native tests passed assertions but exited during async teardown | Open; does not currently block Maestro runtime | [M-07](2026-09-11-mobile-test-teardown.md) |
| M-08 | Production API login succeeded while the iOS login UI showed a generic error | Open; evidence gap between transport and visible runtime | [M-08](2026-09-11-maestro-production-login-discrepancy.md) |

## Current production evidence

At the time this document was written, the public backend health contract
returned HTTP 200 with `status: "ok"`, `env: "production"`, `db: "up"`, and
deployed `git.commit: "708a09f"` on branch `prod`. That proves backend
availability and release identity only; it does not prove that every mobile
screen or store binary works.

## Testing boundary

- The iOS lane used one explicit simulator at a time, as required by
  `AGENTS.md`.
- The extended flow reached the authenticated app, service wizard, booking,
  history, Inbox, promotion, account, and Favourite routes before M-05 stopped
  the run.
- Android was intentionally not started while the iOS lane and its open native
  crash were still under investigation.
- Direct API success is not treated as proof of a successful visible UI login;
  the discrepancy is recorded in M-08.
