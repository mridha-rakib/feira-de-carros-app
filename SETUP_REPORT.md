# Environment setup acceptance report

Verified on Windows on 2026-10-18 (Asia/Dhaka), with Node 24.20.0 and npm 11.19.0.
PASS means the stated local verification ran successfully. NOT VERIFIED marks a platform,
service, or runtime that was not exercised. No commits, pushes, or destructive Git operations were performed.

## 1. Existing codebase findings — PASS

Inspected the existing Expo project, manifest and lockfile, app/TypeScript/Biome/Jest configuration,
hooks, CI, routes, providers, API client, DTOs, logger, environment, theme, components, and tests.
The workspace already contained the earlier agent's uncommitted work; it was retained and completed.

The installed Expo SDK 58 / React Native 0.88 / React 19.3 combination was valid. Expo Router,
strict TypeScript, theme support, starter screens, Zod schemas, Query provider wiring, ApiError,
ErrorBoundary, and 20 DTO/error tests already existed. Initial Expo dependency validation and
Doctor passed. Initial TypeScript and Biome checks failed; Jest passed with an invalid-option warning.

Gaps found and fixed: missing CSS declarations and Jest globals, an incompatible Router ref type,
Jest's setupFilesAfterSetup typo, import/format violations, deprecated Biome configuration,
limited tooling coverage, unused ESLint recommendation, incomplete documentation, optional unsafe
response validation, unsafe HTTP-body casts, falsy-body serialization, incorrectly classified
timeouts, deadlines ending before response parsing, auth failures silently continuing, raw payload
logging, incomplete PII redaction, leaked lifecycle subscriptions, missing native connectivity,
shared server Query cache, missing component/integration tests, and nonblocking CI Doctor checks.

## 2. Files modified or added — PASS

Configuration and developer tooling:

- package.json, package-lock.json, tsconfig.json, biome.jsonc, jest.config.js
- .gitignore, .gitattributes, .editorconfig, .nvmrc, .env.example
- .vscode/settings.json, .vscode/extensions.json
- .husky/pre-commit, .husky/pre-push, scripts/verify-hooks.mjs
- .github/workflows/ci.yml, README.md, SETUP_REPORT.md

Foundation code completed or updated:

- src/app/_layout.tsx
- src/config/env.ts
- src/lib/logger.ts, src/lib/query-client.ts
- src/providers/AppProviders.tsx, src/providers/QueryProvider.tsx
- src/services/api/client.ts, src/services/api/errors.ts
- src/features/auth/hooks/useAuth.ts, src/features/auth/dto/auth.dto.ts
- src/types/dto.ts, src/types/styles.d.ts, src/theme/index.ts
- src/components/common/ErrorBoundary.tsx
- src/components/ui/ErrorDisplay.tsx, src/components/ui/LoadingIndicator.tsx
- src/components/app-tabs.web.tsx, src/components/animated-icon.tsx

Biome formatting/import organization also touched existing routes, shared components,
src/global.css, and scripts/reset-project.js. Existing screen behavior was preserved.
The icon configuration remains unchanged. AGENTS.md was supplied by the user and retained.

Tests:

- tests/setup-env.js
- tests/unit/dto.test.ts, tests/unit/errors.test.ts
- tests/unit/client.test.ts, tests/unit/logger.test.ts, tests/unit/env.test.ts
- tests/unit/components.test.tsx, tests/unit/providers.test.tsx
- tests/unit/error-boundary.test.tsx

## 3. Dependency compatibility — PASS

Installed and checked: Expo 58.0.14; React Native 0.88.0; React/React DOM 19.3.0;
TypeScript 6.0.3; Biome 2.5.15; Query 5.104.4; Zod 4.6.7; Jest 30.5.2;
jest-expo 58.0.11; React Native Testing Library 14.1.0; Husky 9.1.7; lint-staged 17.6.0.
The only runtime dependency added during this continuation was expo-network 58.0.3, selected
by Expo's SDK-aware npm installer for connectivity events. No SDK or React version changed.

Compared against Expo's [official compatibility table](https://docs.expo.dev/versions/latest/),
[Jest guidance](https://docs.expo.dev/develop/unit-testing/), installed bundledNativeModules.json,
package peer dependencies, and the official SDK 58 versions metadata.
`npm ls --depth=0` reports a valid tree. `npx expo install --check` passes;
`npx expo-doctor` passes all 20 checks.

## 4. Completed integrations — PASS

Strict TypeScript and path aliases work for native and web code. Root providers wrap Expo Router.
Zod schemas infer DTO types; the pagination type now derives from its schema instead of duplicating
its structure. All API responses require schemas; outgoing requests support request schemas.
The API client normalizes failures to ApiError, supports JSON and no-content responses, injects
credentials, distinguishes timeout/cancellation/network errors, cleans timers/listeners, and enforces
its deadline across credential loading and response parsing. Auth-provider failures stop requests.

Query clients are created per provider mount, preventing shared SSR user caches. Native AppState
and Expo Network update focus/connectivity with cleanup. Browser Query listeners remain available.
Query hooks forward AbortSignals; validation/client/cancellation failures are not retried.
ErrorBoundary catches rendering failures and supports retry. Status/retry components work.

Environment variables are read with Expo-compatible direct property access and validated with Zod.
The API URL is required, so startup cannot silently use an unintended localhost endpoint.
.env.example documents local configuration; .env* is ignored except .env.example.

## 5. TypeScript verification — PASS

`npm run typecheck` completed with exit 0 and no unresolved errors.
Strict mode remains enabled. CSS declarations describe existing assets without suppressions.
Tests import typed Jest globals. The Router tab button omits an incompatible unused ref contract;
no unsafe ref cast was introduced.

## 6. Biome verification — PASS

`npm run lint`, `npm run format:check`, and `npm run check` all completed with exit 0.
The final combined check processes 52 supported source/config/test/script files with no diagnostics.
Import organization is included; Biome's configuration was migrated to the current preset syntax.
Source, test, script, and configuration checks use the same tool in npm scripts and hooks.

## 7. Husky and lint-staged verification — PASS

Husky 9 uses core.hooksPath=.husky/_. Its generated wrappers run successfully through Git.
Hook bodies use the modern format, without deprecated husky.sh initialization.
The pre-commit hook runs lint-staged; pre-push runs npm run validate with failure propagation.

`npm run hooks:verify` executed the real hook bodies in a disposable repository and verified:

- PASS: pre-commit rejects staged invalid syntax.
- PASS: lint-staged formats valid code and re-stages it.
- PASS: pre-push accepts a project passing the real validation gate.
- PASS: pre-push rejects an introduced TypeScript error.

The working project's index and commits were not changed. On Windows, Git/Husky executes
hook bodies through its shell; the generated wrapper is the executable entry point.

## 8. Test and quality-gate results — PASS

| Executed command | Result |
| --- | --- |
| npm run typecheck | PASS |
| npm run lint | PASS |
| npm run format:check | PASS |
| npm run check | PASS |
| npm run test:ci | PASS: 8 suites, 42 tests |
| npm run validate | PASS |
| npx expo install --check | PASS |
| npx expo-doctor | PASS: 20/20 |
| npm run deps:check | PASS |
| npm run doctor | PASS |
| npm run hooks:verify | PASS: four hook scenarios |
| npm run export:web | PASS |
| npm ls --depth=0 | PASS |
| git diff --check | PASS |

Tests cover DTOs, normalized errors, invalid success/error bodies, request validation, credentials,
falsy JSON bodies, 204 responses, cancellation, native network failures, timeout during fetch,
credential loading and body parsing, timer cleanup, redaction and circular data, environment
validation, status components, ErrorBoundary recovery, and provider focus/network cleanup.
Overall statement coverage is 65.38%; API client statement coverage is 90.66% and logger coverage
is 92.68%. The original animated starter screens are not comprehensively unit-tested.
No passWithNoTests suppression remains.

## 9. Expo startup verification — PASS with native limits

| Verification | Result and evidence |
| --- | --- |
| Metro startup | PASS: Expo starts, loads .env, selects src/app, and enables React Compiler |
| Router resolution | PASS: / and /explore return HTTP 200 and render in headless Chrome |
| Browser runtime | PASS: client providers initialized; no captured exceptions or console errors |
| Native Android bundling | PASS: Expo Router entry bundles, 1,929 modules; bundle is about 9.95 MB |
| Production web/server export | PASS: Expo emits client chunks, server renderer, assets, and routes to dist/ |
| Android emulator boot | PASS: existing Pixel_10_Pro AVD booted; adb reports boot_completed=1 |
| App running on Android | NOT VERIFIED: compatible Expo Go client installation did not finish |
| Physical Android device | NOT VERIFIED: no connected physical device |
| iOS simulator/device | NOT VERIFIED: no supported iOS runtime was available on Windows |

The emulator had Expo Go 57.0.9. Expo CLI began upgrading it for SDK 58, removed that incompatible
client, and stalled while fetching Expo Go 58.0.4. A separate command to download/install the
SDK 58 APK was rejected by the execution policy as 'blocked by policy'; no specific reason was
provided. The pending CLI update was stopped. The emulator therefore needs a compatible Expo Go
client installed before the application can be verified there. No native runtime success is claimed.

During local verification, --host localhost bound only to IPv6 ::1 on this Windows host;
--host lan bound to all interfaces. Normal npm start uses Expo's LAN default. For Android USB
forwarding, use a server reachable on IPv4 and adb reverse for its actual port.

## 10. Logging verification — PASS with native limits

Logger DEBUG/INFO/WARN/ERROR output and secret/PII redaction pass tests. Browser DevTools captured
'Application entry loaded' and 'Application providers initialized'. Expo terminal output captured
server-render startup logs and bundle diagnostics. API request/failure/validation diagnostics are
covered by mocked network tests and exclude raw payloads, URLs, query values, headers and bodies.
Circular objects and bigint cannot crash routine logging.

Application logs are disabled outside development builds/development configuration. Static log
messages and diagnostic metadata are required; arbitrary personal text must never be passed to
the logger. Redaction is a backup rather than a classifier for every possible unlabeled value.

Native React Native DevTools and native terminal forwarding are NOT VERIFIED because the
compatible native client could not be installed. Use Expo's supported [debugging workflow](https://docs.expo.dev/debugging/tools/),
including j for DevTools. No deprecated remote JS debugger or unsupported terminal logger was added.

## 11. CI and reproducibility — PASS locally / NOT VERIFIED hosted

CI now uses Node 24 from .nvmrc and npm ci, checks Expo compatibility and Doctor without ignoring
failures, checks TypeScript/Biome/imports, runs tests and hook integration, and exports web/server
code with explicit public test environment values.

PASS: actual npm ci completed in a clean temporary directory containing package.json and the
lockfile, installing 1,106 packages. npm ls --depth=0 also passed for that installation. HUSKY=0
was used only there because the temporary installation was not a Git checkout; project hooks
were verified separately. The existing workspace node_modules was not blindly replaced.

PASS: no .env files or credential files matched the tracked-file check. Git ignore checks confirm
.env, .env.staging and .env.test are ignored; .env.example remains eligible for tracking.

NOT VERIFIED: GitHub-hosted workflow execution, branch protection, remote secrets, native release
builds, signing and store submission. No workflow was pushed or triggered remotely.

## 12. Remaining issues and external blockers

- FAIL: npm audit reports 56 transitive findings (30 high, 26 moderate), from four underlying
  advisories and their dependent chains. The current published versions of braces (3.0.3),
  node-forge (1.4.0), and sprintf-js (1.1.3) have no patched release. uuid 7.0.3 enters through
  xcode/@expo/config-plugins; the advisory requires uuid >=11.1.1, outside that dependency's
  supported range. No forced cross-major override or Expo downgrade was applied.
  See [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
  [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv),
  [sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), and
  [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq).
- NOT VERIFIED: live backend and authentication integration; no backend credentials/contracts or
  live API were supplied. API boundary behavior is tested with mocks; the example current-user
  query deliberately remains disabled until authentication is implemented.
- NOT VERIFIED: Android application runtime and iOS runtime, for the reasons above.
- NOT VERIFIED: hosted GitHub Actions run and native release build pipelines.
- npm emitted transitive deprecation notices and install-script review notices for @parcel/watcher
  and unrs-resolver. The clean install, Jest, Biome and Metro checks passed with prebuilt binaries;
  no global npm execution policy was changed.

The local development foundation passes its quality gates. The outstanding security advisories
and unverified native/hosted behavior prevent an unconditional claim of production readiness.

## 13. Exact development commands

From this project folder:

```powershell
# For a fresh checkout:
npm ci
# Run the next command only if .env does not exist:
Copy-Item .env.example .env
# Configure EXPO_PUBLIC_API_URL in .env for your backend.
npm start
```

Then press a for Android or w for web. Alternatively use npm run android or npm run web.
Android requires Expo Go compatible with SDK 58 or a compatible development build.
Run npm run validate before pushing. See README.md for architecture, API patterns, logging,
environment rules, hook troubleshooting and the complete npm script reference.
