# Postmortem M-05: iOS Favourite Provider native navigation crash

Date: 2026-09-11
Status: Open; root cause not yet proven
Affected component: iOS React Navigation screen container, Favourite Provider

## Summary

The extended iOS Maestro flow repeatedly crashed when navigating from the
Favourite menu to Favourite Provider. The visible assertion failed after the
app stopped, and the native crash reported:

```text
NSGenericException: NSArray mutated while being enumerated
RNSScreenContainerView updateContainer
```

This is the current blocker for claiming the complete iOS important-screen
flow. Android testing was intentionally not started while the requested iOS
first lane was unresolved.

## Detection and evidence

- The crash reproduced on the single designated iOS simulator, not a concurrent
  device lane.
- It occurred after the Favourite Provider route opened, not at app startup or
  production API health.
- The stack included `RNSScreenContainerView updateContainer` and the
  `NSArray` mutation exception.
- Removing the Provider screen's dynamic `navigation.setOptions` effect and
  moving the Favourite Service effect from `useLayoutEffect` to `useEffect` did
  not eliminate the latest failure.

## Root cause assessment

### Confirmed

- The app terminates while React Navigation's native screen container updates
  the route.
- The failure is iOS-native and reproducible in the Favourite Provider route.

### Unconfirmed hypothesis

Dynamic header/options updates during route transition are a plausible trigger,
because both Favourite screens previously changed header content in effects and
the exception is an array mutation during container update. Partial removal did
not prove that hypothesis. Other candidates include a React Navigation 7/native
screen-container interaction or another state update scheduled during transition.

## Remediation attempted

- Removed the Provider screen's dynamic header-options effect.
- Changed the Favourite Service header effect to normal effect timing.
- Added empty/error response guards so a failed provider request cannot pass
  `undefined` into list rendering.
- Added stable menu selectors to isolate the route in Maestro.

These changes improved defensive behavior but did not close the incident.

## Required next steps

1. Reproduce the route with a fresh app install and capture the exact native log
   window around termination.
2. Remove or statically define both Favourite route headers for one controlled
   experiment; do not infer causality from a partial header change.
3. If the crash persists, bisect route transition updates and test with
   native-stack animation disabled for diagnosis only.
4. Re-run the full extended flow on the same explicit simulator after the
   isolated route is stable.

## Acceptance evidence

M-05 is resolved only when Favourite Provider completes two consecutive runs
with no native termination and the full iOS flow reaches logout. Record the
simulator UDID, app build, flow result, and cleanup state.

## What we will not claim

- A passing API response or visible route before the crash is not screen
  stability proof.
- Removing one header effect is not proof that navigation options caused it.
- Current iOS evidence does not support starting Android as if iOS were complete.
