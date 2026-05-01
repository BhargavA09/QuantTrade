import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  const env = { ...process.env };

  console.log("Building Unsigned Release APK...");
  execSync(`./gradlew assembleRelease`, { stdio: 'inherit', cwd: 'android', env });

  console.log("Building Unsigned Release AAB...");
  execSync(`./gradlew bundleRelease`, { stdio: 'inherit', cwd: 'android', env });

  console.log("Copying outputs to /dist/downloads...");
  fs.mkdirSync('dist/downloads', { recursive: true });
  
  if (fs.existsSync('android/app/build/outputs/apk/release/app-release-unsigned.apk')) {
    fs.copyFileSync('android/app/build/outputs/apk/release/app-release-unsigned.apk', 'dist/downloads/QuantLab-Release-Unsigned.apk');
  }

  if (fs.existsSync('android/app/build/outputs/bundle/release/app-release-unsigned.aab') || fs.existsSync('android/app/build/outputs/bundle/release/app-release.aab')) {
    const aabPath = fs.existsSync('android/app/build/outputs/bundle/release/app-release-unsigned.aab') 
      ? 'android/app/build/outputs/bundle/release/app-release-unsigned.aab' 
      : 'android/app/build/outputs/bundle/release/app-release.aab';
    fs.copyFileSync(aabPath, 'dist/downloads/QuantLab-Release-Unsigned.aab');
  }

  console.log("Operation Complete! Files available in dist/downloads.");
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}