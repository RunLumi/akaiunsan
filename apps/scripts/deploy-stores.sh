#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_ROOT="$APP_ROOT/android"
IOS_ROOT="$APP_ROOT/ios"

ANDROID_PACKAGE="${ANDROID_PACKAGE:-com.akaiunsan.customer}"
ANDROID_VARIANT="${ANDROID_VARIANT:-ProductionRelease}"
ENVFILE="${ENVFILE:-.env.production}"
PLAY_TRACK="${PLAY_TRACK:-internal}"
IOS_SCHEME="${IOS_SCHEME:-AyasanProduction}"
BUILD_ROOT="${BUILD_ROOT:-$APP_ROOT/build/store-release}"

CONFIRM_UPLOAD=0
BUILD_ONLY=0
TARGET_ANDROID=1
TARGET_IOS=1

usage() {
  cat <<'EOF'
Usage:
  ./apps/scripts/deploy-stores.sh [options]

Builds production artifacts and, only with --confirm, uploads them through API
clients. Without --confirm the script stops after building and validating files.

Options:
  --confirm       Upload the built artifacts to the selected stores.
  --build-only    Build and validate artifacts; never upload.
  --android-only  Build/upload Android only.
  --ios-only      Build/upload iOS only.
  -h, --help      Show this help.

Environment:
  Android build:
    ENVFILE=.env.production
    ANDROID_VARIANT=ProductionRelease
    PLAY_TRACK=internal            # internal|closed|open|production
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/secure/path/play-service-account.json

  iOS build/upload:
    IOS_SCHEME=AyasanProduction
    APPLE_TEAM_ID=7MBXZKYSY4
    ASC_API_KEY_JSON=/secure/path/app-store-connect-api-key.json

  Optional:
    ALLOW_PROVISIONING_UPDATES=YES
    ALLOW_PLAY_PRODUCTION=YES      # required when PLAY_TRACK=production
    BUILD_ROOT=/absolute/path/for/artifacts

The script uploads iOS to App Store Connect/TestFlight; it does not submit an
iOS version for App Review. Google Play uploads to the selected track and do
not publish to production unless PLAY_TRACK=production is explicitly chosen.
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

require_file() {
  [[ -f "$1" ]] || die "required file not found: $1"
}

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "required environment variable is not set: $name"
}

while (($# > 0)); do
  case "$1" in
    --confirm)
      CONFIRM_UPLOAD=1
      ;;
    --build-only)
      BUILD_ONLY=1
      ;;
    --android-only)
      TARGET_IOS=0
      ;;
    --ios-only)
      TARGET_ANDROID=0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
  shift
done

if ((BUILD_ONLY == 1)); then
  CONFIRM_UPLOAD=0
fi

if ((TARGET_ANDROID == 0 && TARGET_IOS == 0)); then
  die "select at least one platform"
fi

if [[ "$PLAY_TRACK" != "internal" && "$PLAY_TRACK" != "closed" && "$PLAY_TRACK" != "open" && "$PLAY_TRACK" != "production" ]]; then
  die "PLAY_TRACK must be internal, closed, open, or production"
fi

require_command find
if ((TARGET_ANDROID == 1)); then
  require_command java
  require_file "$ANDROID_ROOT/gradlew"
  require_file "$ANDROID_ROOT/app/build.gradle"
  require_file "$APP_ROOT/$ENVFILE"
  if ((CONFIRM_UPLOAD == 1)); then
    require_env GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
    require_file "$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"
  fi
fi

if ((TARGET_IOS == 1)); then
  require_command xcodebuild
  require_file "$IOS_ROOT/Ayasan.xcworkspace/contents.xcworkspacedata"
  require_env APPLE_TEAM_ID
  if ((CONFIRM_UPLOAD == 1)); then
    require_env ASC_API_KEY_JSON
    require_file "$ASC_API_KEY_JSON"
  fi
fi

if ((CONFIRM_UPLOAD == 1)); then
  require_command fastlane
fi

if [[ "$PLAY_TRACK" == "production" && "${ALLOW_PLAY_PRODUCTION:-NO}" != "YES" ]]; then
  die "PLAY_TRACK=production requires ALLOW_PLAY_PRODUCTION=YES"
fi

mkdir -p "$BUILD_ROOT"

ANDROID_AAB=""
IOS_IPA=""

if ((TARGET_ANDROID == 1)); then
  echo "==> Building Android :app:bundle${ANDROID_VARIANT}"
  (
    cd "$ANDROID_ROOT"
    ENVFILE="$ENVFILE" ./gradlew ":app:bundle${ANDROID_VARIANT}"
  )

  ANDROID_ARTIFACTS=()
  while IFS= read -r artifact; do
    ANDROID_ARTIFACTS+=("$artifact")
  done < <(find "$ANDROID_ROOT/app/build/outputs/bundle" -type f -name '*.aab' -print | sort)
  ((${#ANDROID_ARTIFACTS[@]} > 0)) || die "Gradle completed but no Android AAB was found"
  ((${#ANDROID_ARTIFACTS[@]} == 1)) || die "expected exactly one Android AAB, found ${#ANDROID_ARTIFACTS[@]}"
  ANDROID_AAB="${ANDROID_ARTIFACTS[0]}"
  cp "$ANDROID_AAB" "$BUILD_ROOT/"
  ANDROID_AAB="$BUILD_ROOT/$(basename "$ANDROID_AAB")"
  echo "    artifact: $ANDROID_AAB"
fi

if ((TARGET_IOS == 1)); then
  IOS_ARCHIVE="$BUILD_ROOT/${IOS_SCHEME}.xcarchive"
  IOS_EXPORT_DIR="$BUILD_ROOT/ios-export"
  IOS_EXPORT_OPTIONS="$BUILD_ROOT/export-options.plist"

  rm -rf "$IOS_ARCHIVE" "$IOS_EXPORT_DIR"
  rm -f "$IOS_EXPORT_OPTIONS"
  plutil -create xml1 "$IOS_EXPORT_OPTIONS"
  plutil -insert method -string app-store "$IOS_EXPORT_OPTIONS"
  plutil -insert signingStyle -string automatic "$IOS_EXPORT_OPTIONS"
  plutil -insert teamID -string "$APPLE_TEAM_ID" "$IOS_EXPORT_OPTIONS"
  plutil -insert uploadSymbols -bool false "$IOS_EXPORT_OPTIONS"
  plutil -insert compileBitcode -bool false "$IOS_EXPORT_OPTIONS"

  echo "==> Archiving iOS scheme $IOS_SCHEME"
  XCODEBUILD_PROVISIONING_FLAGS=()
  if [[ "${ALLOW_PROVISIONING_UPDATES:-NO}" == "YES" ]]; then
    XCODEBUILD_PROVISIONING_FLAGS+=("-allowProvisioningUpdates")
  fi
  (
    cd "$APP_ROOT"
    xcodebuild \
      -workspace "$IOS_ROOT/Ayasan.xcworkspace" \
      -scheme "$IOS_SCHEME" \
      -configuration Release \
      -sdk iphoneos \
      -archivePath "$IOS_ARCHIVE" \
      "${XCODEBUILD_PROVISIONING_FLAGS[@]}" \
      archive
  )

  echo "==> Exporting iOS IPA"
  (
    cd "$APP_ROOT"
    xcodebuild \
      -exportArchive \
      -archivePath "$IOS_ARCHIVE" \
      -exportOptionsPlist "$IOS_EXPORT_OPTIONS" \
      -exportPath "$IOS_EXPORT_DIR"
  )

  IOS_ARTIFACTS=()
  while IFS= read -r artifact; do
    IOS_ARTIFACTS+=("$artifact")
  done < <(find "$IOS_EXPORT_DIR" -type f -name '*.ipa' -print | sort)
  ((${#IOS_ARTIFACTS[@]} > 0)) || die "Xcode completed but no iOS IPA was found"
  ((${#IOS_ARTIFACTS[@]} == 1)) || die "expected exactly one iOS IPA, found ${#IOS_ARTIFACTS[@]}"
  IOS_IPA="${IOS_ARTIFACTS[0]}"
  cp "$IOS_IPA" "$BUILD_ROOT/"
  IOS_IPA="$BUILD_ROOT/$(basename "$IOS_IPA")"
  echo "    artifact: $IOS_IPA"
fi

echo "==> Build validation"
if ((TARGET_ANDROID == 1)); then
  [[ "$(unzip -p "$ANDROID_AAB" base/manifest/AndroidManifest.xml 2>/dev/null | strings | grep -F -m1 "$ANDROID_PACKAGE" || true)" != "" ]] || \
    die "Android AAB does not contain package $ANDROID_PACKAGE"
fi
if ((TARGET_IOS == 1)); then
  require_file "$IOS_IPA"
fi

if ((CONFIRM_UPLOAD == 0)); then
  echo "==> Upload skipped. Re-run with --confirm to upload the validated artifacts."
  exit 0
fi

echo "==> Upload plan"
((TARGET_ANDROID == 1)) && echo "    Google Play: $ANDROID_AAB -> $ANDROID_PACKAGE ($PLAY_TRACK)"
((TARGET_IOS == 1)) && echo "    App Store Connect: $IOS_IPA -> $IOS_SCHEME/TestFlight"

if ((TARGET_ANDROID == 1)); then
  echo "==> Uploading Android through Google Play API"
  fastlane supply \
    --aab "$ANDROID_AAB" \
    --package_name "$ANDROID_PACKAGE" \
    --track "$PLAY_TRACK" \
    --json_key "$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" \
    --skip_upload_metadata true \
    --skip_upload_images true \
    --skip_upload_screenshots true \
    --skip_upload_changelogs true
fi

if ((TARGET_IOS == 1)); then
  echo "==> Uploading iOS through App Store Connect API"
  fastlane pilot upload \
    --ipa "$IOS_IPA" \
    --api_key_path "$ASC_API_KEY_JSON" \
    --skip_waiting_for_build_processing true
fi

echo "==> Store upload commands completed"
