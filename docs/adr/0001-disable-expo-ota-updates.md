# ADR 0001: Disable Expo OTA Updates

- Status: Accepted
- Date: 2026-09-08

## Context

Akaiunsan is distributed as native iOS and Android builds. The previous startup path called Expo Updates before rendering navigation. That added an unnecessary network-dependent gate: on a simulator or an unavailable update service, the app could remain on the splash screen and prevent the login screen from rendering. The repository also had no active OTA release channel or operational contract for safely shipping JavaScript independently of native binaries.

## Decision

Akaiunsan does not use Expo OTA updates. The app must not call Expo update-check, fetch, or reload APIs during startup. The direct `expo-updates` dependency and the unused `updateSource` hook are removed. Mobile JavaScript and native changes ship together through native iOS and Android builds and the app-store release workflow.

The Sentry Expo plugin keeps its non-secret organization and project configuration in `app.json`; upload authentication remains environment- or local-secret-based. Application fonts are bundled locally through the `expo-font` plugin. Startup must not fetch fonts or any other remote resource before rendering navigation.

## Consequences

- Startup no longer depends on an OTA network request.
- Startup no longer depends on runtime font loading; the app uses fonts bundled in the native binary.
- Every mobile release requires a native build and store distribution.
- Rollback uses a prior native app release or a new native patch release.
- If OTA delivery is reconsidered, it requires a new ADR covering channels, runtime-version compatibility, signing, staged rollout, rollback, and monitoring.

## Verification

The login Maestro smoke flow must be run against one explicit iOS simulator and one explicit Android emulator sequentially. Native builds remain the runtime source of truth.
