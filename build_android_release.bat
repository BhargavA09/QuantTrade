@echo off
echo ===================================================
echo   QUANTLAB WINDOWS MOBILE APP BUILDER
echo ===================================================

echo.
echo [1/5] Building Web Assets...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: Web build failed.
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Syncing Capacitor with Android Project...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo Error: Capacitor sync failed.
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Checking/Generating Release Keystore...
if not exist my-release-key.jks (
    echo Creating a new release keystore (my-release-key.jks)...
    keytool -genkey -v -keystore my-release-key.jks -alias alias_name -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=QuantLab, OU=QuantLab, O=QuantLab, L=City, ST=State, C=US" -storepass password123 -keypass password123
    if %ERRORLEVEL% neq 0 (
        echo Warning: Could not generate keystore with keytool automatically.
        echo Make sure Java SDK is installed and keytool is in your PATH.
    )
) else (
    echo Re-using existing my-release-key.jks...
)

echo.
echo [4/5] Building Signed Release APK & Play Store AAB...
cd android

:: Use gradle wrapper to build
call gradlew.bat assembleRelease bundleRelease -Pandroid.injected.signing.store.file=../my-release-key.jks -Pandroid.injected.signing.store.password=password123 -Pandroid.injected.signing.key.alias=alias_name -Pandroid.injected.signing.key.password=password123
if %ERRORLEVEL% neq 0 (
    echo Error: Gradle build failed. Ensure Android SDK and JDK 17+ are installed.
    cd ..
    exit /b %ERRORLEVEL%
)

cd ..

echo.
echo [5/5] Copying Assets to dist\downloads...
if not exist dist\downloads mkdir dist\downloads

copy /y android\app\build\outputs\apk\release\app-release.apk dist\downloads\QuantLab-Release.apk >nul 2>nul
if %ERRORLEVEL% neq 0 (
    copy /y android\app\build\outputs\apk\release\app-release-unsigned.apk dist\downloads\QuantLab-Release.apk >nul 2>nul
)

copy /y android\app\build\outputs\bundle\release\app-release.aab dist\downloads\QuantLab-Release.aab >nul 2>nul
if %ERRORLEVEL% neq 0 (
    copy /y android\app\build\outputs\bundle\release\app-release-unsigned.aab dist\downloads\QuantLab-Release.aab >nul 2>nul
)

echo ===================================================
echo   BUILD COMPLETED SUCCESSFULLY!
echo ===================================================
echo.
echo Saved outputs:
echo - APK: dist\downloads\QuantLab-Release.apk (For testing on your phone)
echo - AAB: dist\downloads\QuantLab-Release.aab (For uploading to Google Play Console)
echo.
pause
