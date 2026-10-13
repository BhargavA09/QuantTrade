# Play Store Deployment & Release Guide

Your project is already configured with **Capacitor Android** (`@capacitor/android`) and is a standard **PWA (Progressive Web App)**. This provides two seamless methods to release on the Google Play Store:

---

## Path 1: Native Android App Bundle (`.aab`) with Capacitor (Recommended)

Google Play Store requires Android App Bundles (`.aab`) for all new apps.

### 1. Build and Sync Web Assets
```bash
npm run android:build
```
This builds the production React application to `dist/` and syncs it directly into the native `android/` project.

### 2. Generate Your Android Keystore (Signing Key)
Run this once to generate your private upload key:
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias quanttrade-key
```
*(Store `my-release-key.jks` safely and never commit it to public git repositories).*

### 3. Generate the Release Android App Bundle (`.aab`)
Open in Android Studio or build directly:

#### Option A: Command Line (Fastest)
```bash
npm run android:bundle
```
The output bundle will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

#### Option B: Android Studio GUI
```bash
npm run android:open
```
Inside Android Studio:
1. Go to **Build** → **Generate Signed Bundle / APK**.
2. Select **Android App Bundle** (`.aab`).
3. Choose your `my-release-key.jks` keystore and alias.
4. Click **Finish**. Your `.aab` file is ready to upload.

---

## Path 2: Bubblewrap (Trusted Web Activity - TWA)

If you prefer Google's official CLI that wraps your live deployed HTTPS URL into a Google Play Store App Bundle without needing Android Studio:

```bash
# Install Google's Bubblewrap CLI
npm install -g @bubblewrap/cli

# Initialize your project pointing to your live URL:
bubblewrap init --manifest="https://your-domain.com/manifest.json"

# Build the signed Google Play Bundle:
bubblewrap build
```

---

## Google Play Console Upload Checklist

1. **Google Play Console Account**:
   - Sign in at [play.google.com/console](https://play.google.com/console).
   - Create a new App: Name: `QuantTrade Pro`, Default language: `English`, App or Game: `App`, Free/Paid: `Free`.
2. **Store Listing Assets**:
   - **App Icon**: 512x512 PNG (ready in `public/logo-512.png`).
   - **Feature Graphic**: 1024x500 PNG/JPEG banner.
   - **Screenshots**: At least 2 phone screenshots (e.g. 1080x1920).
3. **App Content Declarations**:
   - **Privacy Policy**: Link to your app's privacy policy page (`/privacy` or hosted URL).
   - **Target Audience & Content Rating**: 18+ / Financial Trading information.
   - **Financial Features declaration**: Check "Personal Finance / Market Data & Stock Tracking".
4. **Production / Internal Testing Release**:
   - Go to **Testing** → **Internal Testing** (or **Production**).
   - Create a new release, drag & drop `app-release.aab`.
   - Submit for review!
