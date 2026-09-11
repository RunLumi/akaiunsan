# Postmortem M-02: Mobile signup contract mismatch

Date: 2026-09-11
Status: Resolved and deployed to `prod`
Affected component: `POST /auth/signup`, mobile registration

## Summary

The mobile client submitted `fullName` and `phoneNumber`. The backend helper
only copied its legacy snake-case fields (`firstname`, `lastname`, and
`phone_number`). The signup request could therefore reach the controller
without the name and phone values expected by the customer model and welcome
email template, blocking reliable account setup for the Maestro flow.

## Detection and evidence

- The mobile signup contract uses camel-case fields.
- `backend/helpers/util.ts` previously applied a whitelist without normalizing
  `fullName` or `phoneNumber`.
- A focused test asserts that `Maestro Production Smoke` becomes
  `firstname: "Maestro"`, `lastname: "Production Smoke"`, and that
  `phoneNumber` becomes `phone_number`.
- Production was redeployed at `708a09f`; the public health response is HTTP
  200 with `db: "up"`.

## Root cause

The mobile and legacy/back-office request contracts evolved independently. The
backend retained the old whitelist but did not provide an explicit compatibility
mapping at the request boundary.

## Contributing factor: welcome email dependency

SMTP availability was able to become part of the perceived signup success path.
The agreed behavior is fail-open: customer creation and token issuance succeed
even if the welcome email cannot be sent. The failure is logged and recorded,
but must not roll back the account.

## Remediation

- Normalize `fullName` into first and last name components while retaining the
  legacy snake-case contract.
- Normalize `phoneNumber` to `phone_number`.
- Catch welcome-email failures after customer creation and return the successful
  signup response.
- Cover normalization with a focused Vitest test.

## Verification

- The focused helper test passes the legacy whitelist and mobile camel-case
  cases.
- Production health is green at the deployed `prod` SHA.
- A production mobile-style signup returned HTTP 200 during smoke setup;
  disposable credentials are intentionally not recorded here.

## Prevention

1. Treat the mobile request shape as a versioned API contract.
2. Add contract tests for every mobile auth payload and response envelope.
3. Keep welcome-email delivery outside the account-creation transaction unless
   verified email is explicitly required before login.
4. Record status and response shape without storing test credentials.

## What we will not claim

- HTTP 200 proves request acceptance, not inbox delivery.
- The health endpoint proves deployment availability, not every signup branch.
- No customer-count or rollback claim is valid without access-log and database
  evidence.
