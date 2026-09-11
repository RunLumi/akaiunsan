# Postmortem M-01: iOS simulator Firebase startup and resource contention

Date: 2026-09-11
Status: Resolved for the simulator smoke lane
Affected component: iOS app startup, Firebase adapters, local device-test operations

## Summary

The iOS Maestro lane had two distinct failure modes. Firebase native modules
could be reached from a simulator even though it did not provide the device/APNs
runtime expected by those modules. Separately, multiple simulator, Xcode, and
build lanes competed for CPU, disk, and simulator state. Earlier builds reported
`No space left on device`, and user-owned Lumi jobs repeatedly occupied
simulators.

No customer impact or production outage is inferred from these local failures.

## Detection and evidence

- LuLu showed connections to Firebase Crashlytics and Installations hosts. Those
  hosts identify Firebase services; they do not alone prove Analytics tracking
  was enabled.
- The Firebase adapter has a simulator guard and a test named
  `does not initialize Firebase native modules on a simulator`.
- `apps/firebase.json` disables automatic data, Analytics, Crashlytics, and
  Messaging initialization by default.
- Earlier iOS builds exhausted temporary storage, and concurrent `xcodebuild`
  jobs made it unsafe to claim exclusive simulator ownership.

## Root causes

### Confirmed: device-only Firebase assumption

The app selected native Firebase services from environment and collection
settings but did not also require a physical device. An ARM64 simulator can
expose the module surface without the complete device runtime those services
expect.

### Confirmed: un-serialized heavy lanes

Builds and Maestro sessions were not consistently constrained to one explicit
destination with cleanup between runs. This created resource exhaustion and
device ownership collisions.

## Remediation

- `apps/src/shared/firebase.ts` now requires `expo-constants` `isDevice ===
  true` before loading Analytics, Crashlytics, or Messaging.
- Optional Firebase telemetry errors are contained and cannot block
  authentication or booking.
- `AGENTS.md` rule 12 requires one explicit simulator/emulator, no concurrent
  Xcode/Gradle/Metro/Maestro lanes, and shutdown before changing platform.
- iOS builds use one destination, active architecture only, and SSD-backed
  derived data.

## Verification

- The simulator guard is covered by the Firebase adapter test suite.
- The iOS lane reached the login screen and authenticated app shell without the
  earlier startup failure.
- The remaining extended-flow stop was M-05, a later Favourite Provider native
  crash, not Firebase startup.

## Follow-ups

| Priority | Follow-up | Acceptance evidence |
|---|---|---|
| P1 | Preserve the serial-device policy in runbooks and scripts | One active destination before every lane; device shut down afterward |
| P2 | Verify physical-device Firebase behavior separately | Named-device run with request logs and collection settings |
| P2 | Keep local/dev telemetry policy explicit | Build config and runtime adapter tests remain green |

## What we will not claim

- A LuLu prompt is not proof that Analytics collected data.
- A simulator pass is not proof that Firebase push or Crashlytics works on a
  physical device.
- A successful build is not proof that concurrent simulator work was prevented.
