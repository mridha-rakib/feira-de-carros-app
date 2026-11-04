# Phase 3 — native runtime acceptance and security review

Review date: 2026-10-19, Asia/Dhaka. Windows; Node 24.20.0; npm 11.19.0.
PASS applies only to the evidence stated. No commits, pushes, publishing, EAS builds,
account identifiers, release signing credentials, or execution-policy changes were made.

## 1. Android native runtime result — PASS (local development build)

The existing Pixel_10_Pro emulator is connected as emulator-5554, boots successfully,
and reports Android API 37. Its image is x86_64 with 16 KB page support. Expo Go is not
installed; the previously blocked Expo Go APK installation was not retried.

The custom development build compiled successfully (463 Gradle tasks; final build 1m 38s),
installed as com.fikiflow.localdev, and launched through the development client. This is an
actual application runtime result, beyond emulator boot or JavaScript bundling.

| Native acceptance check | Result / evidence |
| --- | --- |
| App launch and Home | PASS: native Home screen rendered; artifacts/native/home.png |
| Expo Router / tabs | PASS: Home > Explore > Home; Explore content and native tabs verified |
| Interactive content | PASS: File-based routing section expanded and collapsed; explore-expanded.xml/png |
| Root providers | PASS: native console emitted Application entry loaded and Application providers initialized |
| Logging | PASS: native INFO startup logs and ERROR ErrorBoundary diagnostics appeared in Expo terminal |
| Lifecycle | PASS: sent app to background and resumed MainActivity; app remained responsive |
| Unmatched route | PASS: app:///phase3-acceptance-missing showed Unmatched Route and recovered via Go back |
| ErrorBoundary | PASS: temporary controlled render failure was caught; fallback and retry appeared; after restoration, retry returned to a working app |
| Runtime recovery | PASS: Explore worked after controlled failure/retry; recovery-explore.xml/png |
| Unexpected application crash | PASS: no unexpected application fatal crash was observed in these checks |
| Interactive React Native DevTools | NOT VERIFIED: direct scripted inspector clients did not establish a usable session; official interactive frontend was not tested |
| Physical Android / iOS / release mode | NOT VERIFIED: outside the exercised emulator/debug-build scope |

The native controlled test exposed a real fallback layout issue: a long development stack trace
pushed the heading off screen. ErrorBoundary now uses a ScrollView with content padding, keeping
the heading and retry accessible while allowing the stack to scroll. It was retested natively:
error-boundary-fixed.xml shows the title at y=433..521 and retry at y=683..820 on a 1280x2856 screen.
The temporary root-layout injection was removed and the original layout restored byte-for-byte;
no diagnostic application feature remains. The existing Jest retry/recovery test also passes.

The initial build failed in react-native-worklets because Ninja tried to create a
263-character object directory. Installed Ninja is 1.10.2 and LongPathsEnabled is 0.
Expo SDK 58 sets its default CMake object-path limit to 1024, exceeding this toolchain's
actual capabilities. The tracked Expo config plugin now sets the documented Gradle
property expo.android.cmakeObjectPathMax=250 on Windows, restoring conservative path
shortening. The same plugin uses Android's CMake buildStagingDirectory API to keep the app's
generated codegen object paths short under ~/.cxx/fiki/. Both adjustments were needed before the
build succeeded. It changes neither dependencies nor system policy. Generated native code and
debug APK remain ignored. The installed nearby-device discovery permission prompt was denied;
direct ADB-forwarded Metro access worked without granting discovery access.

## 2. Development build readiness — PASS for local Android development

- PASS: added expo-dev-client 58.0.14 using Expo's SDK-aware npm installer; no SDK change.
- PASS: user selected local-only Android application ID com.fikiflow.localdev.
- PASS: app.json registers the development client and Windows CMake prebuild plugins.
- PASS: npx expo prebuild --platform android --no-install generates the existing project's
  Android native shell. Generated android/ remains ignored; application architecture is retained.
- PASS: JDK 17.0.20.1, compile SDK 37, target SDK 36, min SDK 24, NDK 27.1.12297006,
  Gradle 9.4.1, AGP 9.2.1 and Kotlin 2.2.10 were identified from installed/generated sources.
  Gradle installed missing Build Tools 37.0.0 using the existing accepted SDK license.
- PASS: production-mode Android export with source maps completed: 1,793 modules,
  1,800 source-map entries. Bytecode was disabled only for bundle inspection.
- PASS: clean npm ci for the updated lockfile succeeded in an isolated temporary directory,
  followed by npm ls --depth=0. Workspace dependencies were not blindly replaced.
- PASS: npx expo run:android --no-bundler --device emulator-5554 produced and installed
  android/app/build/outputs/apk/debug/app-debug.apk. No downloaded Expo Go APK was used.
- NOT VERIFIED: production application ID, release signing, store readiness, physical devices,
  iOS runtime, and native release builds. The generated debug keystore is for local development;
  the template's release signing stanza is not a production signing process.

See [Android development workflow](docs/ANDROID_DEVELOPMENT.md) for prerequisites, local builds,
debugging, manual official installation steps if policy permits, and release limitations.
Official references: [Expo local development builds](https://docs.expo.dev/develop/development-builds/introduction/?buildenv=build-locally),
[Android Gradle Plugin compatibility](https://developer.android.com/build/releases/agp-9-2-0-release-notes),
and [Expo's CMake property](https://github.com/expo/expo/blob/main/packages/expo-modules-autolinking/android/expo-gradle-plugin/README.md).

## 3. Security findings and remediation — PASS triage / FAIL open audit

Executed npm audit, npm audit --omit=dev, and npm audit --json. Full audit:
**56 findings, 30 high and 26 moderate**. Production-only audit:
**48 findings, 21 high and 27 moderate**. Both exit 1, with zero critical findings.

All 56 findings were traced to four advisories through npm explain and the JSON dependency
graph. The complete package-to-advisory table and detailed per-advisory reachability,
dependency paths, mitigations, and residual risk are in [the security review](docs/SECURITY_REVIEW.md).

| Root package | Installed | Class | Finding / compatible remediation |
| --- | --- | --- | --- |
| braces | 3.0.3 | Transitive Metro/Jest tooling | FAIL: no published patch; constrain untrusted glob/config input and isolate build jobs |
| node-forge | 1.4.0 | Transitive Expo CLI/signing tooling | FAIL: no published patch; avoid untrusted signing inputs and production verification trust boundaries |
| sprintf-js | 1.0.3 | Transitive coverage/YAML CLI formatting tooling | FAIL: latest 1.1.3 is also affected; static format strings and bounded, isolated jobs |
| uuid | 7.0.3 | Transitive xcode/config tooling | FAIL: patched >=11.1.1 is outside xcode's supported range; observed xcode v4 call does not reach the affected buffer-writing functions |

No npm audit fix --force, unsafe dependency override, incompatible Expo upgrade/downgrade,
or advisory suppression was used. No compatible safe patch currently resolves these roots.
Mitigation reduces exposure; it does not turn an open audit into PASS or authorize release.

## 4. Production versus development risk — PASS scope analysis / broader deployment NOT VERIFIED

The current Android production-mode source map contains no module from the four audited
npm packages. All application routes are present. Evidence is in
artifacts/security/android-bundle-reachability.json. This supports tooling exposure rather
than shipped JavaScript exposure for the inspected build; it is not a full APK/native SBOM.

npm's production graph retains CLI/build dependencies under Expo and React Native and optional
testing peer paths under Router. --omit=dev is not an Android bundle scan. The eight full-only
findings and every propagated package finding are listed in the security review.

Reachability findings: Metro/Jest glob matching can reach braces with configured patterns;
Expo signing tooling can reach node-forge verification primitives; argparse formatting can
reach sprintf-js but the ordinary js-yaml library loader does not load its CLI; xcode calls
uuid.v4 without a buffer, outside the advisory's exploit conditions. No application input
path reaches these installed implementations, and none appears in the inspected native export.
An independently deployed web server, signing service, future features, and native dependencies
need separate review; their security is NOT VERIFIED.

## 5. CI readiness — PASS local configuration / FAIL security gate / NOT VERIFIED hosted

- PASS: the existing quality job retains npm ci, blocking Expo checks, strict TypeScript,
  Biome, Jest, hook integration and web export.
- PASS: an independent security job runs npm ci and npm run security:report. It writes full
  and production JSON audits, npm explain evidence for all four roots, a 56-package mapping,
  and a Markdown job summary. Artifacts upload even on failure, with 14-day retention.
- FAIL: the security reporter exits 1 because vulnerabilities remain. There is no
  continue-on-error or allowlist. A reporting/network/schema failure exits 2.
- PASS: workflow YAML and audit failure/artifact semantics were checked locally. Both jobs
  have bounded timeouts; permissions are contents:read and checkout credentials are not persisted.
- PASS: local validation passed with 42 tests across eight suites; Expo dependency check passed
  and Doctor passed 20/20. Hook integration passed all four scenarios.
- NOT VERIFIED: GitHub-hosted execution, artifact download from GitHub, branch protection,
  remote secrets, and native CI execution. No workflow was triggered or pushed.

Raw local evidence is under ignored artifacts/security/; the committed workflow regenerates it.

## 6. Remaining blockers — open audit FAIL; platform/service acceptance NOT VERIFIED

- FAIL: four root advisories remain without compatible safe remediation through this SDK graph.
  Review upstream releases, then rerun audits, Expo compatibility and native acceptance.
- PASS: native debug runtime acceptance completed on the existing emulator. The remaining
  native limits are physical devices, release mode and iOS; these are NOT VERIFIED.
- NOT VERIFIED: interactive React Native DevTools Console/Network use. The native inspector
  target was advertised, but scripted probes were not a successful interactive DevTools test.
  Native terminal logging was exercised and passes independently.
- NOT VERIFIED: live backend/authentication integration; no backend implementation/contracts
  or credentials were provided. Existing mocked API/error tests do not substitute for live acceptance.
- NOT VERIFIED: release signing/distribution, physical Android devices, iOS, native release builds,
  and hosted GitHub Actions.

The emulator development runtime passes. Production release readiness is not inferred from
these debug checks or from the security reachability analysis.

Changed in this phase: app.json; package.json/package-lock.json; biome.jsonc;
.gitignore; .github/workflows/ci.yml; plugins/with-windows-cmake-paths.js;
scripts/security-report.mjs; src/components/common/ErrorBoundary.tsx; README.md;
docs/ANDROID_DEVELOPMENT.md; docs/SECURITY_REVIEW.md; and this report. The root layout was
restored exactly after its temporary acceptance probe. Prior uncommitted setup work was retained.

## 7. Commands to continue development — PASS documented workflow

From the existing project directory with .env configured:

```powershell
# First build, or after native dependency/config changes:
npm run android:build -- --device emulator-5554

# Later JavaScript/TypeScript development:
npm run start:dev

# Quality and dependency checks:
npm run validate
npm run deps:check
npm run doctor
npm run hooks:verify

# Security evidence: currently expected to exit 1:
npm run security:report
```

Use the device serial reported by adb devices. The detailed workflow covers split Metro/build
terminals, backend addressing, ADB reverse, native DevTools, Expo Go fallback, and official
manual installation steps without bypassing policy. Production identity/signing are intentionally
not invented. The earlier SETUP_REPORT.md remains the historical acceptance record for phase 2.
