#!/bin/bash
set -e

echo "Building web assets..."
npm run build

echo "Syncing capacitor..."
npx cap sync android

echo "Generating keystore..."
if [ ! -f my-release-key.jks ]; then
  keytool -genkey -v -keystore my-release-key.jks -alias alias_name -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=QuantLab, OU=QuantLab, O=QuantLab, L=City, ST=State, C=US" -storepass password123 -keypass password123
fi

export KEYSTORE_FILE=$(pwd)/my-release-key.jks

cd android

echo "Building Release APK..."
./gradlew assembleRelease -Pandroid.injected.signing.store.file=$KEYSTORE_FILE -Pandroid.injected.signing.store.password=password123 -Pandroid.injected.signing.key.alias=alias_name -Pandroid.injected.signing.key.password=password123

echo "Building Release AAB (App Bundle for Play Store)..."
./gradlew bundleRelease -Pandroid.injected.signing.store.file=$KEYSTORE_FILE -Pandroid.injected.signing.store.password=password123 -Pandroid.injected.signing.key.alias=alias_name -Pandroid.injected.signing.key.password=password123

cd ..

echo "Copying outputs to dist/ for download..."
mkdir -p dist/downloads
cp android/app/build/outputs/apk/release/app-release.apk dist/downloads/QuantLab-Release.apk 2>/dev/null || cp android/app/build/outputs/apk/release/app-release-unsigned.apk dist/downloads/QuantLab-Release.apk
cp android/app/build/outputs/bundle/release/app-release.aab dist/downloads/QuantLab-Release.aab

echo "Done! You can download the APK from /downloads/QuantLab-Release.apk and the AAB from /downloads/QuantLab-Release.aab"
