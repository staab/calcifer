#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

IOS_PBX="ios/App/App.xcodeproj/project.pbxproj"
ANDROID_GRADLE="android/app/build.gradle"

new_version="$(node -p "require('./package.json').version")"

# --- iOS ---
cur_ios_version="$(grep -m1 -E 'MARKETING_VERSION = [0-9.]+;' "$IOS_PBX" | sed -E 's/.*MARKETING_VERSION = ([0-9.]+);/\1/')"
cur_ios_build="$(grep -m1 -E 'CURRENT_PROJECT_VERSION = [0-9]+;' "$IOS_PBX" | sed -E 's/.*CURRENT_PROJECT_VERSION = ([0-9]+);/\1/')"
[ "$new_version" != "$cur_ios_version" ] && ios_build=$((cur_ios_build + 1)) || ios_build="$cur_ios_build"

sed -i '' -E "s/MARKETING_VERSION = [0-9.]+;/MARKETING_VERSION = $new_version;/g" "$IOS_PBX"
sed -i '' -E "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = $ios_build;/g" "$IOS_PBX"

# --- Android ---
cur_android_version="$(grep -E 'versionName "[^"]+"' "$ANDROID_GRADLE" | sed -E 's/.*versionName "([^"]+)".*/\1/')"
cur_android_code="$(grep -E 'versionCode [0-9]+' "$ANDROID_GRADLE" | sed -E 's/.*versionCode ([0-9]+).*/\1/')"
[ "$new_version" != "$cur_android_version" ] && android_code=$((cur_android_code + 1)) || android_code="$cur_android_code"

sed -i '' -E "s/versionCode [0-9]+/versionCode $android_code/" "$ANDROID_GRADLE"
sed -i '' -E "s/versionName \"[^\"]+\"/versionName \"$new_version\"/" "$ANDROID_GRADLE"

echo "package.json -> ios/android version: $new_version (ios build $ios_build, android code $android_code)"