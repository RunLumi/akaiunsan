# ADR 0003: Adopt RTK Query Cache Best Practices for Mobile Performance

## Status

Accepted

## Context

The Phase 5 migration replaced the deleted `useApi` axios hook with an RTK Query slice (`apps/src/redux/apiSlice.ts`). The port was deliberately mechanical: screens consume endpoints through the `portRequest` adapter, which wraps lazy-query triggers in the legacy `callback({error, response})` contract and forces a refetch on every call to preserve `useApi`'s old no-cache semantics.

The app therefore pays the cost of a server-state cache without using it: no `tagTypes`, no `providesTags`/`invalidatesTags`, no shared in-flight requests, every screen mount refetches, and mutations cannot invalidate related queries automatically. The declarative hooks are already exported from the slice but unused.

TanStack Query was evaluated as an alternative engine and rejected: it solves the same problem, would require re-solving the axios-compat transport concerns already handled and tested in `apiSlice` (URL param serialization, the `apiErrorString` contract, token injection from Redux state), and would repeat the Phase 5 strangler migration for no capability gain.

## Decision

Future mobile development treats the RTK Query cache as the standard data layer and an explicit performance goal:

- New and refactored screens use the declarative `useQuery`/`useMutation` hooks with stable query args instead of `portRequest` callbacks.
- Endpoints declare `tagTypes` with `providesTags`/`invalidatesTags` so mutations (bookings, payments, notification read-state) refresh dependent lists and counters automatically.
- Existing `portRequest` call-sites are migrated opportunistically, screen by screen, with their tests updated in the same change. The facade and its error-string contract stay in place until the last call-site is ported, then they are deleted.
- Cache freshness is tuned per endpoint (`staleTime`, refetch settings) so data that was previously always refetched (bookings, unread counts, profile) is not served stale.
- Do not introduce a second server-state library (e.g. TanStack Query) without a new ADR.

## Consequences

- Fewer redundant network requests during navigation; related data refreshes automatically after mutations instead of via hand-written refetch callbacks.
- Screens declare data requirements declaratively, simplifying loading and error handling as adoption proceeds.
- Behavior changes from always-refetch to cache-with-invalidation; each migrated screen must review its freshness requirements and update its tests in the same change.
- The `portRequest` adapter, `serializeQueryArgs`, and `paramsSerializer` workarounds are transitional and shrink as call-sites are ported.
