# Postmortem: SpringBoard accessibility crash during iOS Maestro smoke

Date: 2026-09-11
Status: Open — external simulator-runtime blocker
Affected component: iOS Simulator / XCTest accessibility automation
Tested application: `com.akaiunsan.customer`

## Summary

An iOS Maestro login smoke run did not reach the authenticated Home screen.
After the login action, the app remained on the Login screen with the entered
credentials and a visible sign-in loading state. Maestro repeatedly evaluated
the `Home.*` visibility assertion for 15 seconds, then captured a failure
screenshot.

Immediately after that screenshot request, the iOS Simulator's `SpringBoard`
process crashed with `EXC_BAD_ACCESS` in Apple's `XCTAutomationSupport`
accessibility framework. The Akaiunsan process did not crash, and Maestro's
crash detector reported no crash for the Akaiunsan bundle.

This is a test-infrastructure incident, not evidence of an Akaiunsan native
crash. The reason the login transition did not complete remains unresolved by
this incident record.

## Impact

- The affected local iOS Maestro run failed at the login-to-Home gate.
- The simulator's SpringBoard accessibility service became unreliable for the
  session.
- No production outage, customer count, data loss, or store-binary impact is
  inferred from this local test failure.

## Detection and evidence

- Crash report process: `SpringBoard` (`com.apple.springboard`).
- Exception: `EXC_BAD_ACCESS (SIGSEGV)`, invalid address `0x20`.
- Faulting frame: `XCTAutomationSupport` —
  `-[XCTAutomationSession initWithAccessibilityFramework:dataSource:]_block_invoke`.
- Triggered queue: `com.apple.root.user-initiated-qos`.
- Host: Apple Silicon `Mac16,10`, macOS `26.6.2`.
- Automation environment recorded by Maestro: Maestro `2.10.0`, Xcode
  `26.6`, arm64.
- Maestro run: `2026-09-11_093545`, external debug flow
  `production-login-debug.yaml`.
- The flow log recorded `Assertion is false: "Home.*" is visible` at
  approximately `09:36:33.883`, followed by a screenshot request at
  approximately `09:36:34.012`.
- The simulator log then recorded SpringBoard accessibility snapshot and
  attribute requests immediately before the crash report at approximately
  `09:36:35`.
- Maestro recorded `crashFile=none` for bundle ID `com.akaiunsan.customer`.

The report and local run logs are diagnostic evidence for this incident; they
contain test-account material and must not be committed or copied into the
repository.

## Root cause

### Confirmed: Apple XCTest accessibility runtime fault

The crashing process and faulting symbols belong to the simulator's
`SpringBoard` and `XCTAutomationSupport`, not to Akaiunsan. The crash occurred
while XCTest was inspecting accessibility elements and taking a screenshot.
The repository cannot repair the crashed Apple binary.

### Unresolved: login transition failure

The app was still showing Login when the `Home.*` assertion timed out. The
available evidence does not distinguish among an authentication/API delay, a
test-account or environment problem, and an app navigation/state problem. The
SpringBoard crash must not be used as evidence for any of those explanations.

## Contributing factors

- The failed `extendedWaitUntil` assertion caused frequent accessibility tree
  snapshots during the timeout window.
- Maestro's failure handling requested another hierarchy/screenshot operation
  after the assertion failed.
- The host uses a recent Apple Silicon / macOS / Xcode / iOS Simulator stack
  with known iOS 26.x Maestro/XCTest accessibility instability. Related public
  reports describe `kAXErrorInvalidUIElement`, driver hangs, and accessibility
  failures on Apple Silicon iOS 26.x simulators:
  [Maestro issue #3137](https://github.com/mobile-dev-inc/maestro/issues/3137),
  [Maestro issue #3148](https://github.com/mobile-dev-inc/maestro/issues/3148).
- The previous Firebase simulator guard was already merged as PR #78. This
  report is a different process and failure class; it does not reopen that
  Firebase incident.

## Immediate containment

1. Stop the affected Maestro/XCTest session and do not reuse the crashed
   simulator as clean evidence.
2. Reset or recreate the simulator before another run. Do not erase a user
   device or terminate competing work without confirming ownership.
3. Keep iOS and Android lanes strictly serialized, with one explicit device ID
   and no concurrent Xcode, simulator, Gradle, Metro, or Maestro process.
4. Re-run the login flow independently before attempting the extended screen
   flow. Record whether the app reaches Home separately from whether SpringBoard
   remains alive.

## Follow-ups

| Priority | Follow-up | Acceptance evidence |
|---|---|---|
| P1 | Re-run the login smoke on a fresh simulator, first on a supported iOS 18.x runtime and then on the target iOS 26.x runtime | Home becomes visible; no `SpringBoard` or `XCTAutomationSupport` crash report is produced |
| P1 | Record Maestro version, Xcode version, simulator runtime, device ID, and competing-process state for every iOS lane | A machine-readable run note exists for each attempt and identifies infrastructure versus app failures |
| P1 | Investigate the login-to-Home timeout separately using API response timing and app-side navigation logs | A reproduced timeout has a confirmed app/API cause or is closed as an environment/account failure |
| P2 | Evaluate splitting the long extended flow into shorter independently launched flows | Each flow has an isolated XCTest session and the complete suite can be rerun without reusing a degraded driver session |
| P2 | Evaluate reducing high-frequency accessibility polling and post-failure screenshot pressure on iOS 26.x | A controlled comparison shows lower automation instability without weakening the functional assertion |

## What went well

- The crash report identified the process and Apple framework precisely.
- Maestro logs preserved the order of assertion failure, screenshot request, and
  SpringBoard crash.
- The app-side crash detector distinguished the system-process crash from an
  Akaiunsan bundle crash.
- The serial-lane rule limited the incident to one explicit simulator.

## What did not go well

- The test run combined an unresolved login timeout with a system automation
  crash, making the visible failure easy to misattribute.
- The external debug flow was not part of the repository's tracked Maestro
  evidence, so its exact configuration is not reproducible from the checkout
  alone.
- The current host's CoreSimulator service became unavailable after the
  incident, preventing an immediate clean retry.

## What we will not claim

- Akaiunsan crashed in this incident.
- Firebase caused this incident.
- The login API, test credentials, or navigation code caused the SpringBoard
  segmentation fault.
- A local Maestro failure proves a production outage or customer impact.
- A successful retry on another simulator proves physical-device or store
  release readiness.
