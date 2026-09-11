# Postmortem M-04: Inbox mutation of RTK Query response objects

Date: 2026-09-11
Status: Fixed in the current mobile worktree; extended Maestro retest pending
Affected component: `apps/src/screens/Main/Inbox.tsx`

## Summary

Inbox notification and promotion rows came from RTK Query state. The screen
copied only the outer array and then mutated the original row object for
read/delete selection. RTK Query state may be frozen or shared with the cache,
so this could throw at runtime or violate cache ownership.

## Detection and evidence

- The old code used `valueDelete[index].isDeleted =` and
  `data[index].isRead =` after copying only the array.
- The current implementation maps the array and creates a new object for the
  changed row.
- Stable notification and promotion IDs were added so the read/detail path can
  be tested without text-only ambiguity.

## Root cause

The screen retained the mutation style of the former callback/axios path after
the data source moved to RTK Query. The migration changed response ownership
and immutability guarantees, but the screen did not change its update strategy.

## Remediation

- Replace shallow-array-copy-plus-row-mutation with immutable `map` updates.
- Compute unread state before updating the row so badge actions run only for an
  unread item.
- Add stable accessibility IDs for notification and promotion rows.

## Verification

- The changed code no longer assigns into an RTK response object.
- Existing Inbox contract tests cover fetch-driven delete/read request paths.
- The extended iOS flow remains the runtime verification for detail navigation,
  pending M-05.

## Prevention

1. Treat RTK Query responses as immutable at screen boundaries.
2. Add a test that freezes a response row before invoking read/delete handlers.
3. Require stable IDs for list items used by device smoke flows.

## What we will not claim

- This source-level risk is not quantified as a production crash without crash
  logs or request traces.
- Passing notification detail does not prove push delivery.
