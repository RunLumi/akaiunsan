# Postmortem M-06: Mobile release environment and symbol-upload configuration

Date: 2026-09-11
Status: Resolved in source/release tooling; verify each artifact independently
Affected component: iOS build environment, API endpoint selection, Sentry dSYM/source-map upload

## Summary

Two release-time configuration defects produced misleading verification results:

1. A production iOS build was invoked with an environment-file path relative to
   the wrong working directory. React Native Config embedded the local fallback
   API URL (`127.0.0.1`) instead of the production host.
2. The Sentry debug-symbol upload phase lacked a stable organization
   configuration in the generated release path, producing an
   “organization ID is not configured” error.

Neither issue should be diagnosed from the app screen alone. Embedded binary
configuration and upload logs are the authoritative evidence.

## Detection and evidence

- Binary inspection of the first production simulator artifact found the local
  API URL. The corrected artifact contained `https://akai-api.cjs.vn` and no
  `api-mobile.ayasan.vn` reference.
- From `apps/`, the correct invocation is `ENVFILE=.env.production` with
  `EXPO_NO_DOTENV=1`; `../.env.production` selected the wrong path.
- `apps/app.json` declares Sentry organization `akaiunsan` and project
  `react-native`; iOS and Android Sentry properties use the same organization.
- The release script passes the selected `ENVFILE` into archive and validates
  the export destination rather than treating an upload-only xcodebuild
  destination as an IPA export.
- The live production API currently responds HTTP 200 with deployed commit
  `708a09f`, but API health does not prove a binary embedded the correct URL.

## Root causes

### Confirmed: working-directory-relative environment path

The build command and environment path were specified as if the working
directory were the repository root while the script executed from `apps/`, so
the build fell back to another environment file.

### Confirmed: symbol upload lacked an explicit stable org path

The Sentry upload phase relied on generated/native configuration that was not
consistently available in the release build. The upload tool requires an
organization and project to resolve the release destination.

## Remediation

- Standardize production builds on `apps/` with
  `ENVFILE=.env.production EXPO_NO_DOTENV=1`.
- Pass `ENVFILE` explicitly into `xcodebuild archive` from
  `apps/scripts/deploy-stores.sh`.
- Keep Sentry organization/project configuration in `apps/app.json` and
  generated platform properties; keep tokens outside Git.
- Inspect the binary before upload for bundle ID, version/build number,
  production API URL, and absence of retired hosts.
- Set `ITSAppUsesNonExemptEncryption: false` for the app's exempt/system
  encryption use, so App Store Connect does not repeat the questionnaire.

## Verification

- Corrected simulator artifact contained the new host and not the old host.
- App Store Connect accepted the corrected build as a valid processed build.
- The backend release health gate is green at `708a09f`.
- A production UI login still showed a generic error in one simulator run even
  though direct API login returned HTTP 200; M-08 tracks that separately.

## Prevention checklist

1. Resolve environment files relative to the script's declared working
   directory, not the caller's assumption.
2. Print only non-secret effective configuration keys during a build.
3. Inspect archive/IPA metadata before upload and record the exact artifact.
4. Treat Sentry symbol upload, App Store processing, and visible runtime as
   separate proof layers.

## What we will not claim

- A successful archive is not proof that the IPA embedded the intended URL.
- A Sentry project page or DSN is not proof that dSYM symbols were uploaded.
- Direct API login success is not proof that the login screen navigated.
