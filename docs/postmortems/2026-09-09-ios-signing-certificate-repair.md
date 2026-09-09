# Postmortem: Akaiunsan iOS distribution profile mismatch

Date: 2026-09-09  
Repository: `streamentry/akaiunsan`  
App: `com.akaiunsan.customer`  
Release: `4.0.2` / iOS build `6`

## Summary

The Akaiunsan archive completed, but IPA export initially failed because the selected provisioning profile did not include the distribution certificate selected by Xcode:

```text
Provisioning profile "iOS Team Store Provisioning Profile: com.akaiunsan.customer"
doesn't include signing certificate
"iPhone Distribution: CLOUDJET SOLUTIONS PTE. LTD. (7MBXZKYSY4)"
```

The repair was to export with App Store Connect authentication and `-allowProvisioningUpdates`. Xcode created a new managed profile for the exact bundle identifier and included the valid local distribution certificates. The corrected archive exported successfully as an IPA and uploaded to App Store Connect/TestFlight.

## Impact

- The first signed archive was not exportable as an App Store IPA.
- No invalid IPA was submitted to Apple.
- The repaired IPA was accepted by Apple for processing; App Store Connect returned delivery UUID `0c54c09c-d543-415a-9084-57fed9b502ac` with state `PROCESSING`.

## Evidence

The local keychain contained two valid distribution identities for team `7MBXZKYSY4`:

| Certificate SHA-1 | Role |
|---|---|
| `ED93B445276A434D6A933F21EF5D9DC887EB391F` | iPhone Distribution |
| `77F9813E3BC697BF0BD0AEF6D2F9F9BED52E06DD` | iPhone Distribution used by the repaired export |

Xcode created managed profile UUID `a53e2794-070b-4c62-b9ef-498fc04c3304` for `com.akaiunsan.customer`. Its certificate hash set included `77F9813E3BC697BF0BD0AEF6D2F9F9BED52E06DD` and `ED93B445276A434D6A933F21EF5D9DC887EB391F`.

The final exported IPA was:

```text
/private/tmp/akaiunsan-store-release/build/store-release-ios/ios-export/Akaiunsan.ipa
```

Apple Content Delivery recorded `UPLOAD SUCCEEDED with no errors` for build `4.0.2` (build `6`), followed by App Store processing.

## Root cause

The generated Xcode project used automatic signing, but the initial export was run without allowing provisioning updates. Xcode therefore attempted to export with an existing profile whose certificate set did not match the selected local distribution identity. The archive succeeding did not prove that the export profile/certificate pair was valid.

## Corrective action

Use the App Store Connect API key and allow Xcode to repair managed signing:

```bash
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_DIR" \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  -allowProvisioningUpdates
```

Then verify the IPA bundle identifier and marketing/build versions before calling `altool` or another App Store Connect uploader.

## Prevention checklist

1. Treat the certificate and provisioning profile as one release dependency.
2. Record the certificate SHA-1 used by the archive and compare it with the profile's `DeveloperCertificates` before export.
3. Keep `ASC_KEY_ID`, `ASC_ISSUER_ID`, and `ASC_KEY_PATH` in ignored release env files; never commit them.
4. Run `ALLOW_PROVISIONING_UPDATES=YES ./apps/scripts/deploy-stores.sh --ios-only --build-only` when profiles may be stale.
5. Export to an IPA first and inspect it; upload only after the IPA exists and has the expected bundle/version metadata.
6. Keep an encrypted backup of the exact distribution identity (`.p12`) and matching profile in the private `lumi-keys-backups` repository. Never use an archive containing unrelated signing identities.
7. Record the App Store Connect delivery UUID and distinguish `UPLOAD SUCCEEDED` from the later `PROCESSING` and `READY TO TEST` states.

## Remaining handoff

The matching provisioning profile is available from the repaired archive. The exact distribution identity still requires a Keychain-authorized, single-identity `.p12` export before it can be added to the encrypted backup bundle. The backup procedure must keep the p12 password outside Git and deliver it through a separate secure channel.
