# ADR 0002: Remove Remote Mobile Version Checking

## Status

Accepted

## Context

The mobile app queried `/configuration/versions` during navigation startup and could block users behind a mandatory store-update modal. The check was also unreliable on simulator and offline environments, and it coupled app availability to mutable server metadata.

## Decision

Akaiunsan no longer performs remote mobile version checks. The version endpoint, update modal, store-link prompt, and related client translations are removed. Release versioning is defined by the native `app.json` metadata and enforced during the native store-build workflow.

## Consequences

- App startup and navigation do not depend on `/configuration/versions`.
- Users are not blocked by stale or unavailable server version metadata.
- Store releases remain responsible for communicating important updates through normal release channels.
- Reintroducing client-side version gating requires a new ADR with an offline-safe and non-blocking design.
