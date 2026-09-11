# Postmortem M-07: React Native test teardown exits non-zero after passing assertions

Date: 2026-09-11
Status: Open; not a Maestro runtime blocker
Affected component: Jest/Jest-Expo teardown for `HelperSelect`

## Summary

The focused mobile test command reported all assertions as passing—11 tests in
2 suites—but exited with status 1 because callbacks fired after the Jest
environment had been torn down:

```text
ReferenceError: You are trying to access a property or method of the Jest
environment after it has been torn down.
```

This is a verification-pipeline defect: the green assertion summary cannot be
treated as a green command while the process exit is non-zero.

## Detection and evidence

- Command:

  ```bash
  cd apps
  yarn jest src/shared/__tests__/firebase.test.ts \
    src/components/__tests__/helperSelect.test.tsx --runInBand
  ```

- Jest reported 2 passed suites and 11 passed tests.
- The process then emitted multiple post-teardown `ReferenceError` messages and
  Yarn returned exit code 1.
- `apps/jest.setup.js` already resets RTK Query state and waits one scheduler
  tick, so the remaining work is likely screen-specific timer or async update.

## Root cause assessment

### Confirmed

- At least one asynchronous callback outlives the test environment.
- The command exit status is non-zero despite passing assertions.

### Unconfirmed hypothesis

`DateTimeSelect` contains a delayed state update for its slider path, and the
HelperSelect render tree has other deferred React Native work. The exact timer
or promise owner must be isolated before changing global teardown.

## Remediation required

1. Run the HelperSelect file alone with open-handle diagnostics.
2. Identify the timer/promise owner and cancel or await it in the component/test
   lifecycle.
3. Add a regression check that the focused command exits with status 0.
4. Keep global teardown changes narrow; do not hide leaks with a broad forced
   exit.

## Acceptance evidence

M-07 is resolved when the focused command returns exit code 0 with no
post-teardown logs, and the full mobile test command preserves that result.

## What we will not claim

- A passing assertion summary is not a passing test command when exit code is 1.
- This does not prove the iOS simulator crashed; it is a separate Node/Jest
  lifecycle problem.
