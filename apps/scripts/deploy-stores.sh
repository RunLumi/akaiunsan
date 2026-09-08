#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_ROOT="$APP_ROOT/android"
IOS_ROOT="$APP_ROOT/ios"

# The ignored local release files are the default credential source.
load_env_file() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

load_env_file "$ANDROID_ROOT/keystore.env"
load_env_file "$IOS_ROOT/scripts/release.env"

ANDROID_PACKAGE="${ANDROID_PACKAGE:-com.akaiunsan.customer}"
ANDROID_VARIANT="${ANDROID_VARIANT:-Release}"
ENVFILE="${ENVFILE:-.env.production}"
PLAY_TRACK="${PLAY_TRACK:-internal}"
PLAY_STATUS="${PLAY_STATUS:-completed}"
IOS_SCHEME="${IOS_SCHEME:-Akaiunsan}"
IOS_CONFIGURATION="${IOS_CONFIGURATION:-Release}"
BUILD_ROOT="${BUILD_ROOT:-$APP_ROOT/build/store-release}"
if [[ -z "${PLAY_UPLOADER:-}" && -x "/Volumes/SSD/imc/lcn-lumi/lumi/android/scripts/play_upload.sh" ]]; then
  PLAY_UPLOADER="/Volumes/SSD/imc/lcn-lumi/lumi/android/scripts/play_upload.sh"
fi

# Normalize names used by this script from the Lumi-compatible local files.
ANDROID_SIGNING_STORE_FILE="${ANDROID_SIGNING_STORE_FILE:-${KEYSTORE_PATH:-}}"
ANDROID_SIGNING_STORE_PASSWORD="${ANDROID_SIGNING_STORE_PASSWORD:-${KEYSTORE_PASSWORD:-}}"
ANDROID_SIGNING_KEY_ALIAS="${ANDROID_SIGNING_KEY_ALIAS:-${KEY_ALIAS:-}}"
ANDROID_SIGNING_KEY_PASSWORD="${ANDROID_SIGNING_KEY_PASSWORD:-${KEY_PASSWORD:-}}"
PLAY_SERVICE_ACCOUNT_JSON="${PLAY_SERVICE_ACCOUNT_JSON:-${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:-}}"
APPLE_TEAM_ID="${APPLE_TEAM_ID:-${TEAM_ID:-}}"

CONFIRM_UPLOAD=0
BUILD_ONLY=0
TARGET_ANDROID=1
TARGET_IOS=1

usage() {
  cat <<'EOF'
Usage:
  ./apps/scripts/deploy-stores.sh [options]

Builds production artifacts and, only with --confirm, uploads them through
Google Play and App Store Connect API clients. Without --confirm the script
stops after building and validating files.

Options:
  --confirm       Upload the validated artifacts to the selected stores.
  --build-only    Build and validate artifacts; never upload.
  --android-only  Build/upload Android only.
  --ios-only      Build/upload iOS only.
  -h, --help      Show this help.

Local credential files loaded automatically when present:
  apps/android/keystore.env
  apps/android/release.jks
  apps/ios/scripts/release.env
  apps/ios/scripts/AuthKey_<ASC_KEY_ID>.p8

Important environment:
  ANDROID_VARIANT=Release       Gradle bundle task suffix.
  PLAY_TRACK=internal            internal|closed|open|production|all
  PLAY_STATUS=completed          Google Play release status.
  PLAY_SERVICE_ACCOUNT_JSON      or GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
  ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH
  APPLE_TEAM_ID                  or TEAM_ID

Optional:
  ALLOW_PROVISIONING_UPDATES=YES
  ALLOW_PLAY_PRODUCTION=YES      required when PLAY_TRACK=production
  PLAY_UPLOADER=/path/to/uploader API uploader; fastlane is the fallback.
  POD_INSTALL=YES                run pod install when iOS Pods are absent.
  SENTRY_DISABLE_AUTO_UPLOAD=true  skip Sentry upload unless explicitly enabled.
  BUILD_ROOT=/absolute/path/for/artifacts

The script uploads iOS to App Store Connect/TestFlight; it does not submit an
iOS version for App Review.
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

absolute_path() {
  local value="$1"
  if [[ "$value" = /* ]]; then
    printf '%s\n' "$value"
  else
    printf '%s/%s\n' "$APP_ROOT" "$value"
  fi
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

case "$PLAY_TRACK" in
  internal|closed|open|production|all) ;;
  *) die "PLAY_TRACK must be internal, closed, open, production, or all" ;;
esac

ENVFILE_PATH="$(absolute_path "$ENVFILE")"
require_command node

APP_VERSION="$(cd "$APP_ROOT" && node -p 'require("./app.json").expo.version')"
ANDROID_VERSION_CODE="$(cd "$APP_ROOT" && node -p 'require("./app.json").expo.android.versionCode')"
IOS_BUILD_NUMBER="$(cd "$APP_ROOT" && node -p 'require("./app.json").expo.ios.buildNumber')"

require_command find
require_command mkdir
require_command cp

if [[ "${PREBUILD_NATIVE:-YES}" == "YES" ]]; then
  EXPO_CLI="$APP_ROOT/node_modules/.bin/expo"
  require_file "$EXPO_CLI"
  echo "==> Syncing generated native metadata from app.json"
  if ((TARGET_IOS == 1)); then
    (cd "$APP_ROOT" && "$EXPO_CLI" prebuild --platform ios --no-install)
  fi
  if ((TARGET_ANDROID == 1)); then
    (cd "$APP_ROOT" && "$EXPO_CLI" prebuild --platform android --no-install)
  fi
fi

if ((TARGET_ANDROID == 1)); then
  require_command java
  require_command keytool
  require_file "$ANDROID_ROOT/gradlew"
  require_file "$ANDROID_ROOT/app/build.gradle"
  require_file "$ENVFILE_PATH"
  require_env ANDROID_SIGNING_STORE_FILE
  require_env ANDROID_SIGNING_STORE_PASSWORD
  require_env ANDROID_SIGNING_KEY_ALIAS
  require_env ANDROID_SIGNING_KEY_PASSWORD
  require_file "$ANDROID_SIGNING_STORE_FILE"
  grep -Fq "versionCode $ANDROID_VERSION_CODE" "$ANDROID_ROOT/app/build.gradle" || \
    die "Android native metadata is not synced to versionCode $ANDROID_VERSION_CODE"
  grep -Fq "versionName \"$APP_VERSION\"" "$ANDROID_ROOT/app/build.gradle" || \
    die "Android native metadata is not synced to version $APP_VERSION"
  keytool -list -keystore "$ANDROID_SIGNING_STORE_FILE" \
    -storepass "$ANDROID_SIGNING_STORE_PASSWORD" \
    -alias "$ANDROID_SIGNING_KEY_ALIAS" >/dev/null 2>&1 || \
    die "Android release keystore or alias could not be opened"
  if ((CONFIRM_UPLOAD == 1)); then
    require_env PLAY_SERVICE_ACCOUNT_JSON
    require_file "$PLAY_SERVICE_ACCOUNT_JSON"
  fi
fi

if ((TARGET_IOS == 1)); then
  require_command xcodebuild
  require_command plutil
  require_file "$IOS_ROOT/Akaiunsan.xcodeproj/project.pbxproj"
  require_file "$IOS_ROOT/Podfile"
  grep -Fq "MARKETING_VERSION = $APP_VERSION;" "$IOS_ROOT/Akaiunsan.xcodeproj/project.pbxproj" || \
    die "iOS native metadata is not synced to version $APP_VERSION"
  grep -Fq "CURRENT_PROJECT_VERSION = $IOS_BUILD_NUMBER;" "$IOS_ROOT/Akaiunsan.xcodeproj/project.pbxproj" || \
    die "iOS native metadata is not synced to build $IOS_BUILD_NUMBER"
  require_env APPLE_TEAM_ID
  if ((CONFIRM_UPLOAD == 1)); then
    require_env ASC_KEY_ID
    require_env ASC_ISSUER_ID
    require_env ASC_KEY_PATH
    require_file "$ASC_KEY_PATH"
    if ! command -v xcrun >/dev/null 2>&1 && ! command -v fastlane >/dev/null 2>&1; then
      die "neither xcrun/altool nor fastlane is available for App Store Connect upload"
    fi
  fi
fi

if ((CONFIRM_UPLOAD == 1)) && [[ "$PLAY_TRACK" == "production" || "$PLAY_TRACK" == "all" ]] && [[ "${ALLOW_PLAY_PRODUCTION:-NO}" != "YES" ]]; then
  die "PLAY_TRACK=$PLAY_TRACK requires ALLOW_PLAY_PRODUCTION=YES"
fi

mkdir -p "$BUILD_ROOT"

ANDROID_AAB=""
IOS_IPA=""

if ((TARGET_ANDROID == 1)); then
  echo "==> Building Android :app:bundle${ANDROID_VARIANT}"
  ANDROID_BUILD_MARKER="$BUILD_ROOT/.android-build-started"
  touch "$ANDROID_BUILD_MARKER"
  (
    cd "$ANDROID_ROOT"
    ANDROID_SIGNING_STORE_FILE="$ANDROID_SIGNING_STORE_FILE" \
    ANDROID_SIGNING_STORE_PASSWORD="$ANDROID_SIGNING_STORE_PASSWORD" \
    ANDROID_SIGNING_KEY_ALIAS="$ANDROID_SIGNING_KEY_ALIAS" \
    ANDROID_SIGNING_KEY_PASSWORD="$ANDROID_SIGNING_KEY_PASSWORD" \
    SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}" \
    ENVFILE="$ENVFILE_PATH" ./gradlew --no-configuration-cache ":app:bundle${ANDROID_VARIANT}"
  )

  ANDROID_ARTIFACTS=()
  while IFS= read -r artifact; do
    [[ -n "$artifact" ]] && ANDROID_ARTIFACTS+=("$artifact")
  done < <(find "$ANDROID_ROOT/app/build/outputs/bundle" -type f -name '*.aab' -newer "$ANDROID_BUILD_MARKER" -print 2>/dev/null | sort)
  ((${#ANDROID_ARTIFACTS[@]} == 1)) || die "expected exactly one new Android AAB, found ${#ANDROID_ARTIFACTS[@]}"
  ANDROID_AAB="${ANDROID_ARTIFACTS[0]}"
  cp "$ANDROID_AAB" "$BUILD_ROOT/"
  ANDROID_AAB="$BUILD_ROOT/$(basename "$ANDROID_AAB")"
  echo "    artifact: $ANDROID_AAB"
fi

IOS_XCODE_INPUT=()
if ((TARGET_IOS == 1)); then
  if [[ "${POD_INSTALL:-YES}" == "YES" && ! -d "$IOS_ROOT/Pods" ]]; then
    require_command pod
    echo "==> Installing iOS pods"
    (cd "$IOS_ROOT" && pod install)
  fi

  if [[ -f "$IOS_ROOT/Akaiunsan.xcworkspace/contents.xcworkspacedata" ]]; then
    IOS_XCODE_INPUT=(-workspace "$IOS_ROOT/Akaiunsan.xcworkspace")
  else
    IOS_XCODE_INPUT=(-project "$IOS_ROOT/Akaiunsan.xcodeproj")
  fi

  IOS_ARCHIVE="$BUILD_ROOT/${IOS_SCHEME}.xcarchive"
  IOS_EXPORT_DIR="$BUILD_ROOT/ios-export"
  IOS_EXPORT_OPTIONS="$BUILD_ROOT/export-options.plist"

  rm -rf "$IOS_ARCHIVE" "$IOS_EXPORT_DIR"
  rm -f "$IOS_EXPORT_OPTIONS"
  plutil -create xml1 "$IOS_EXPORT_OPTIONS"
  plutil -insert method -string app-store "$IOS_EXPORT_OPTIONS"
  plutil -insert destination -string "$([[ "$CONFIRM_UPLOAD" == "1" ]] && echo upload || echo export)" "$IOS_EXPORT_OPTIONS"
  plutil -insert signingStyle -string automatic "$IOS_EXPORT_OPTIONS"
  plutil -insert teamID -string "$APPLE_TEAM_ID" "$IOS_EXPORT_OPTIONS"
  plutil -insert uploadSymbols -bool false "$IOS_EXPORT_OPTIONS"

  XCODEBUILD_AUTH_FLAGS=()
  if [[ -n "${ASC_KEY_ID:-}" && -n "${ASC_ISSUER_ID:-}" && -n "${ASC_KEY_PATH:-}" ]]; then
    require_file "$ASC_KEY_PATH"
    XCODEBUILD_AUTH_FLAGS=(
      -authenticationKeyPath "$ASC_KEY_PATH"
      -authenticationKeyID "$ASC_KEY_ID"
      -authenticationKeyIssuerID "$ASC_ISSUER_ID"
    )
  fi

  XCODEBUILD_PROVISIONING_FLAGS=()
  if [[ "${ALLOW_PROVISIONING_UPDATES:-NO}" == "YES" ]]; then
    XCODEBUILD_PROVISIONING_FLAGS+=(-allowProvisioningUpdates)
  fi

  echo "==> Archiving iOS scheme $IOS_SCHEME"
  (
    cd "$APP_ROOT"
    set +u
    SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}" xcodebuild \
      "${IOS_XCODE_INPUT[@]}" \
      -scheme "$IOS_SCHEME" \
      -configuration "$IOS_CONFIGURATION" \
      -sdk iphoneos \
      -archivePath "$IOS_ARCHIVE" \
      DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
      CODE_SIGN_STYLE=Automatic \
      "${XCODEBUILD_AUTH_FLAGS[@]}" \
      "${XCODEBUILD_PROVISIONING_FLAGS[@]}" \
      archive
  )

  echo "==> Exporting iOS IPA"
  (
    cd "$APP_ROOT"
    set +u
    xcodebuild \
      -exportArchive \
      -archivePath "$IOS_ARCHIVE" \
      -exportOptionsPlist "$IOS_EXPORT_OPTIONS" \
      -exportPath "$IOS_EXPORT_DIR" \
      DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
      "${XCODEBUILD_AUTH_FLAGS[@]}" \
      "${XCODEBUILD_PROVISIONING_FLAGS[@]}"
  )

  IOS_ARTIFACTS=()
  while IFS= read -r artifact; do
    [[ -n "$artifact" ]] && IOS_ARTIFACTS+=("$artifact")
  done < <(find "$IOS_EXPORT_DIR" -type f -name '*.ipa' -print | sort)
  ((${#IOS_ARTIFACTS[@]} == 1)) || die "expected exactly one iOS IPA, found ${#IOS_ARTIFACTS[@]}"
  IOS_IPA="${IOS_ARTIFACTS[0]}"
  cp "$IOS_IPA" "$BUILD_ROOT/"
  IOS_IPA="$BUILD_ROOT/$(basename "$IOS_IPA")"
  echo "    artifact: $IOS_IPA"
fi

echo "==> Build validation"
if ((TARGET_ANDROID == 1)); then
  require_command unzip
  require_command strings
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
  PLAY_TRACKS=("$PLAY_TRACK")
  if [[ "$PLAY_TRACK" == "all" ]]; then
    PLAY_TRACKS=(internal closed open production)
  fi
  for play_track in "${PLAY_TRACKS[@]}"; do
    echo "    track: $play_track"
    if [[ -n "${PLAY_UPLOADER:-}" ]]; then
      require_file "$PLAY_UPLOADER"
      "$PLAY_UPLOADER" \
        --aab "$ANDROID_AAB" \
        --package "$ANDROID_PACKAGE" \
        --service-account "$PLAY_SERVICE_ACCOUNT_JSON" \
        --track "$play_track" \
        --status "$PLAY_STATUS"
    else
      fastlane supply \
        --aab "$ANDROID_AAB" \
        --package_name "$ANDROID_PACKAGE" \
        --track "$play_track" \
        --release_status "$PLAY_STATUS" \
        --json_key "$PLAY_SERVICE_ACCOUNT_JSON" \
        --skip_upload_metadata true \
        --skip_upload_images true \
        --skip_upload_screenshots true \
        --skip_upload_changelogs true
    fi
  done
fi

if ((TARGET_IOS == 1)); then
  echo "==> Uploading iOS through App Store Connect API"
  if command -v xcrun >/dev/null 2>&1 && xcrun --find altool >/dev/null 2>&1; then
    ASC_UPLOAD_HOME="$(mktemp -d /private/tmp/akaiunsan-asc-home.XXXXXX)"
    mkdir -p "$ASC_UPLOAD_HOME/.appstoreconnect/private_keys"
    cp "$ASC_KEY_PATH" "$ASC_UPLOAD_HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
    chmod 600 "$ASC_UPLOAD_HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
    trap '[[ -n "${ASC_UPLOAD_HOME:-}" ]] && rm -rf "$ASC_UPLOAD_HOME"' EXIT
    HOME="$ASC_UPLOAD_HOME" xcrun altool \
      --upload-app \
      --file "$IOS_IPA" \
      --type ios \
      --apiKey "$ASC_KEY_ID" \
      --apiIssuer "$ASC_ISSUER_ID"
  else
    require_command fastlane
    ASC_API_KEY_JSON_TEMP="$(mktemp /private/tmp/akaiunsan-asc-key.XXXXXX.json)"
    node -e 'const fs=require("fs"); const [keyId,issuerId,keyPath,out]=process.argv.slice(1); fs.writeFileSync(out, JSON.stringify({key_id:keyId,issuer_id:issuerId,key_filepath:keyPath,in_house:false})+"\n", {mode:0o600});' \
      "$ASC_KEY_ID" "$ASC_ISSUER_ID" "$ASC_KEY_PATH" "$ASC_API_KEY_JSON_TEMP"
    trap '[[ -n "${ASC_API_KEY_JSON_TEMP:-}" ]] && rm -f "$ASC_API_KEY_JSON_TEMP"' EXIT
    fastlane pilot upload \
      --ipa "$IOS_IPA" \
      --api_key_path "$ASC_API_KEY_JSON_TEMP" \
      --skip_waiting_for_build_processing true
  fi
fi

echo "==> Store upload commands completed"
