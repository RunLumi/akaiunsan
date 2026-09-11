# Postmortem M-08: Production API login versus visible iOS login result

Date: 2026-09-11
Status: Open; investigation required
Affected component: iOS Login screen, production API/authentication follow-up

## Summary

The corrected production iOS simulator binary reached the production API host.
Direct login requests returned HTTP 200, but the visible app flow remained on
the Login screen and showed a generic error. This is a mismatch between
transport-level evidence and user-visible runtime behavior.

The issue is not closed by the backend health check or a successful curl
request.

## Detection and evidence

- The corrected binary contained `https://akai-api.cjs.vn` and no retired
  `api-mobile.ayasan.vn` host.
- Direct production `POST /auth/signin` returned HTTP 200 for the disposable
  smoke account from the host and simulator network context.
- The same production app run showed a generic error after Sign In and did not
  navigate to the Home tab shell.
- Current evidence does not identify whether the failure is response parsing,
  token persistence, a follow-up profile/language request, notification setup,
  or another post-login side effect.

## Root-cause assessment

### Confirmed

- The production API was reachable and accepted the credentials.
- The visible iOS login journey did not complete in that run.

### Unconfirmed hypotheses

Possible causes include a response-envelope mismatch in the mobile adapter,
failure to persist the returned token, a failing post-login `/client/*` request
surfaced as a generic error, or a native side effect treated as an auth failure.
No one of these is proven by the current logs.

## Required investigation

1. Re-run one clean production binary on the single designated simulator with
   redacted request/response status logging.
2. Capture the `/auth/signin` response envelope and first failing request after
   it.
3. Compare the Login error path with RTK Query auth state and token persistence.
4. Re-run the visible login flow twice after the fix and record Home-shell
   navigation, not only HTTP status.

## Acceptance evidence

M-08 is resolved only when the production iOS Maestro login flow reaches the
Home tab shell on two consecutive clean runs with the correct app build/API
host recorded and no token or password values in logs.

## What we will not claim

- A 200 `/auth/signin` response is not proof of successful mobile login.
- A valid token is not proof that persistence and post-login hydration worked.
- A generic alert does not identify the failing request without a redacted trace.
