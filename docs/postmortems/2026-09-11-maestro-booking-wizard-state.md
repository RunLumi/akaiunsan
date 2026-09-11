# Postmortem M-03: Booking wizard invalid dates and stale step transitions

Date: 2026-09-11
Status: Fixed in the current mobile worktree; extended Maestro retest pending
Affected component: `ServiceScreen`, `HelperSelect`, booking wizard navigation

## Summary

The service-booking wizard could reach helper selection or the next step with
empty/invalid date-time state. Helpers then called `toISOString()` on an invalid
Day.js value, producing:

```text
RangeError: Date value out of bounds
```

The Next action also used a render-captured `currentStep + 1`, which could lose
an immediately preceding state update after a date selection or rapid tap.

## Detection and evidence

- The failure occurred while walking the date/service wizard in the iOS Maestro
  flow.
- `HelperSelect` previously serialized `dayjs(startTime).toISOString()` and
  `dayjs(endTime).toISOString()` without validating either value.
- `ServiceScreen.onNextStep` serialized booking dates without a valid date-time
  guard.
- The current source uses `validTimeParams`, validates booking date/hour, and
  uses functional state updates for step changes.

## Root causes

### Confirmed: unchecked date serialization

The API parameter builder assumed a date and end time were always present. The
UI can temporarily render with incomplete state while the user chooses date,
time, or service option.

### Confirmed: stale React state capture

The transition handler derived the next step from the current render instead of
using React's functional updater. A quick interaction could advance from the
wrong step.

## Remediation

- Validate every date before ISO conversion.
- Omit optional `startTime` and `endTime` parameters when invalid.
- Keep the user on the current step and show the existing selection error when
  required values are absent.
- Use `setCurrentStep((step) => step + 1)` for transitions.
- Add stable `service-next-button` and `service-back-button` selectors.

## Verification

- The HelperSelect focused test covers guarded parameter behavior.
- The source no longer calls `toISOString()` on unvalidated wizard values.
- The full extended iOS flow must be rerun after M-05 is repaired; a later
  screen cannot prove this behavior while the native crash stops the run.

## Prevention

1. Treat partially completed form state as normal.
2. Keep date serialization behind one tested helper.
3. Use functional state updates for transitions following another update.
4. Give every wizard control a stable accessibility ID.

## What we will not claim

- Unit coverage is not complete simulator proof of every locale/calendar path.
- Fixing date serialization does not prove payment or booking submission; this
  smoke flow intentionally does not charge or submit a booking.
