import { chmodSync } from 'fs';
import { execSync } from 'child_process';

try {
  chmodSync('./android/gradlew', 0o755);
  console.log('Permissions updated for gradlew');
  
  console.log('Running gradle assembleDebug...');
  execSync('./android/gradlew assembleDebug -p android', { stdio: 'inherit' });
  console.log('APK built successfully!');
} catch (error) {
  console.error('Failed to build APK:', error);
  process.exit(1);
}
