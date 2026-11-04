# Android development workflow

Status: development-client integration and prebuild PASS. Native build/runtime status and the
exact machine evidence are recorded in [PHASE_3_REPORT.md](../PHASE_3_REPORT.md).

## Local development build (preferred)

This project uses Expo SDK 58, React Native 0.88, and expo-dev-client 58.0.14. The Android package
is **com.fikiflow.localdev**, explicitly selected for local use. It is not an agreed production
application ID. No EAS account, project ID, cloud build, release keystore, or signing credentials
are configured. Expo's generated debug signing configuration is only for local debugging.

Windows supports local Android compilation with Expo CLI. Follow the official
[development-build setup](https://docs.expo.dev/develop/development-builds/introduction/?buildenv=build-locally)
and [Android Studio setup](https://docs.expo.dev/workflow/android-studio-emulator/).
The installed React Native version catalog and generated Gradle project select:

| Tool | Required by this installed project |
| --- | --- |
| Node / npm | Node 24.x / npm 11.x |
| Java | JDK 17 (JAVA_HOME must point to it) |
| Android platform | compile SDK 37; target SDK 36; min SDK 24 |
| Android Build Tools | 37.0.0 |
| NDK | 27.1.12297006 |
| Gradle | 9.4.1 (project wrapper downloads it) |
| Android Gradle Plugin | 9.2.1 |
| Kotlin plugin | 2.2.10 as resolved by the build |

Verify the SDK root in Android Studio > Settings > Languages & Frameworks > Android SDK.
Set ANDROID_HOME and ANDROID_SDK_ROOT to the same installed SDK; include platform-tools and
emulator in PATH. Install the listed tools through SDK Manager if missing. Review and accept
SDK licenses yourself if prompted; do not bypass license or execution policies.

```powershell
node --version
npm --version
java -version
adb devices -l
emulator -list-avds
```

Start Pixel_10_Pro from Android Studio Device Manager if it is not already running. Wait until
`adb shell getprop sys.boot_completed` returns 1. For a physical device enable Developer Options
and USB debugging, then approve the device's debugging prompt; never assume an unauthorized
ADB device is ready.

On a fresh checkout:

```powershell
npm ci
# Only if .env does not exist:
Copy-Item .env.example .env
# Set EXPO_PUBLIC_API_URL to the backend address appropriate for the target.
npm run android:build -- --device emulator-5554
```

The emulator serial can differ: use the value shown by adb devices. The build script invokes
`expo run:android`. When android/ does not exist, Expo generates it from app.json and installed
plugins, compiles a debug build, installs it, and starts Metro. The generated android/ and ios/
folders remain ignored. No new Expo project is created.

For a split build/server workflow:

```powershell
# Terminal 1: use a private, trusted network and restrict Metro in Windows Firewall.
npm run start:dev -- --host lan --port 8081

# Terminal 2:
npm run android:build -- --no-bundler --device emulator-5554
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

For later JavaScript-only edits, use `npm run start:dev`, then press a, or open the installed
client and select the running server. Do not rebuild for every TypeScript edit. Rebuild after
adding native libraries or changing native app configuration. Existing generated native projects
need their configuration synchronized with `npx expo prebuild --platform android --no-install`
before rebuilding; review the diff or make a backup if you have manually customized generated
native files. Do not delete native directories containing manual work.

On this Windows host `--host localhost` resolved to IPv6 ::1 during previous verification;
ADB reverse targets an IPv4 loopback socket. Verify the actual listening address and port if the
client cannot connect. The LAN mode binds all interfaces, so keep it behind the Windows Firewall
and never expose Metro to an untrusted/public network. Match adb reverse to the chosen port.

The Android emulator reaches a backend on Windows via http://10.0.2.2:3000 (adjust port).
localhost inside the emulator is the emulator itself. A physical device needs a reachable LAN
address or a separate ADB reverse for the backend. No backend is started by Expo.

## Windows C++ object paths

The installed CMake 3.22.1 bundles Ninja 1.10.2, and Windows long paths are disabled on this
machine. SDK 58's default CMake object-path limit of 1024 can exceed those actual tool limits.
The local plugins/with-windows-cmake-paths.js plugin applies only on Windows: it sets Expo's
documented expo.android.cmakeObjectPathMax property to 250 and moves the app's generated CMake
staging files to a short, checkout-specific folder under ~/.cxx/fiki/. Source files, dependency
code and APK output locations remain unchanged. The plugin is applied through normal prebuild.
It does not change registry settings, disable native features or downgrade dependencies.

See [Expo's Gradle property documentation](https://github.com/expo/expo/blob/main/packages/expo-modules-autolinking/android/expo-gradle-plugin/README.md),
[Android's CMake staging API](https://developer.android.com/reference/tools/gradle-api/9.2/com/android/build/api/dsl/Cmake),
and [Reanimated's Windows guidance](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/).
The latter recommends a newer Ninja for long-path support; updating Android's CMake/Ninja via
SDK Manager remains an alternative for your approved machine setup. Never change registry or
execution policies merely to force a build through. If your own checkout/user path is much longer,
review the actual failing path and use the documented toolchain setup before retrying.

## Native acceptance checklist

PASS requires the installed app to run; bundling or an emulator boot alone is insufficient.

1. Launch com.fikiflow.localdev and confirm Home content, including the animated starter image.
2. Confirm the native Explore tab opens, then return to Home. Open and close an Explore section.
3. Inspect the Console for Application entry loaded and Application providers initialized.
4. Background and resume the app and confirm it still renders and responds.
5. Test an unmatched route and recovery, and exercise the ErrorBoundary in a controlled debug
   session or the existing error-boundary test. Record which checks ran natively versus in Jest.
6. Check for unexpected AndroidRuntime/ReactNativeJS failures. Save logs and screenshots under
   ignored artifacts/native/. Do not commit logs containing personal data or credentials.

Debug with React Native DevTools: press j in the Expo terminal while the native client is
connected. The Console and Network tabs support diagnostics. Press m, or use
`adb shell input keyevent 82`, for the developer menu. Do not use deprecated remote JS debugging.
Application logger output is enabled only for __DEV__ builds with EXPO_PUBLIC_APP_ENV=development.
Use static messages and safe metadata. The existing app has no working authentication/backend;
mocked API tests are not live backend acceptance.

Useful diagnostics:

```powershell
adb -s emulator-5554 shell pidof com.fikiflow.localdev
adb -s emulator-5554 shell dumpsys activity activities
adb -s emulator-5554 logcat -d -t 300 ReactNativeJS:V AndroidRuntime:E '*:S'
npm run validate
npm run deps:check
npm run doctor
npm run security:report
```

## Expo Go fallback (manual, only when permitted)

A custom development build is preferred. If you need an Expo Go smoke test, the native modules
must all be supported by the chosen SDK 58 client. Expo Go does not validate custom native
configuration or replace development-build acceptance.

1. Visit the official [Expo Go download selector](https://expo.dev/go), choose Android Emulator
   and SDK 58, and download the offered compatible APK. Do not install an SDK 57 client for SDK 58.
2. If your system policy allows manual installation, drag the APK onto the running emulator,
   following the official [Android Emulator installation instructions](https://developer.android.com/studio/run/emulator-install-add-files).
   If blocked, use your administrator's approved installation procedure; do not bypass the policy.
3. Run `npm run android:go`. This explicitly selects Expo Go even though expo-dev-client is installed.
4. Verify the app and record results specifically as Expo Go acceptance, not a custom native build.

The earlier direct APK download/install command was blocked. This phase does not retry that
operation through another shell, downloader, or installer.

## Release boundary

The generated native template signs local debug builds with Expo's standard debug keystore.
Its default release signing stanza may also reference that debug configuration: it is not a
production signing pipeline. Before distribution, select a production application ID, configure
release signing through the team's approved process, review manifest permissions/backups/cleartext
traffic, and verify a release build on supported devices. Never commit signing keys or credentials.
The generated development-client build is not store-ready evidence.
