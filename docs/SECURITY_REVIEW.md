# Dependency security review

Reviewed 2026-10-19 (Asia/Dhaka) against the installed SDK 58 graph.

## Results — FAIL (open advisories), PASS (triage completed)

Executed `npm audit`, `npm audit --omit=dev`, and `npm audit --json`.
The full audit exits 1: **56 affected package findings, 30 high and 26 moderate**.
The production-only audit exits 1: **48 findings, 21 high and 27 moderate**.
Both have zero critical findings. All 56 package findings trace to four root advisories;
they are not 56 independent vulnerabilities. Raw evidence and dependency explanations are
in ignored artifacts/security/. The complete mapping is in artifacts/security/summary.md.

The eight full-only findings are @jest/environment, @jest/fake-timers,
@react-native/jest-preset, jest-environment-node, jest-expo, jest-haste-map,
jest-message-util, and jest-watch-typeahead. npm propagates classifications through its
dependency/peer graph, so severity-count subtraction does not identify mobile runtime risk.

`npm run security:report` regenerates both validated JSON reports, runs npm explain for
each root, maps every affected package, and writes a Markdown summary. Exit 1 preserves
vulnerability failures; exit 2 indicates a reporting/registry/schema failure. No findings
are suppressed, no dependency overrides were added, and no incompatible downgrade was applied.

## Native JavaScript reachability — PASS for inspected bundle

Executed an Android production-mode export with source maps and bytecode disabled for inspection:

```powershell
npx expo export --platform android --source-maps --no-bytecode --output-dir artifacts/android-export --max-workers 2
```

The export completed with 1,793 bundled modules and 1,800 source-map entries, including
Home, Explore, and the root layout. None came from the installed npm implementations of
braces, node-forge, sprintf-js, or uuid. Evidence: artifacts/security/android-bundle-reachability.json.
Normal Hermes build settings were not changed. expo-modules-core's own UUID wrapper calls
native functions and is a different implementation from the audited npm uuid package.

This supports tooling classification for the current native bundle. It is not an APK SBOM,
an audit of Maven/native libraries, proof about future features, or production web-server acceptance.
Broader deployed runtime exposure is NOT VERIFIED. `--omit=dev` retains build tooling under
Expo/React Native dependencies and peer paths. Expo Router's optional testing-library peer
also keeps test-related packages visible in npm's production graph. These 48 findings must
not be equated with 48 exploitable flaws in the Android application.

## braces 3.0.3 — high — FAIL: no compatible patch

- Root: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), CVE-2026-93687.
- Transitive paths include Expo > @expo/metro-config > @expo/metro > metro-file-map >
  micromatch > braces, React Native CLI/Metro, and Jest/Babel file-matching paths.
  Exact paths are retained in explain-braces.json.
- Versions through 3.0.3 are affected. Registry latest was 3.0.3; no published patch was available.
- Reachability: deeply nested attacker-controlled glob/brace expressions can exhaust the Node
  stack. Metro watcher matching reaches micromatch with configured globs. That primitive is
  reachable in tooling; no application user-input-to-glob path exists in src/, and this package
  was absent from the inspected native export. No exploit payload was run.
- Mitigation: restrict Metro to trusted devices/networks and the Windows Firewall; review glob,
  test and build configuration changes; run untrusted PRs on ephemeral runners without secrets
  and with timeouts/read-only tokens. Never process untrusted glob expressions in a persistent
  privileged service. Monitor a compatible upstream fix and revalidate it.
- Residual risk: conditional build/test denial of service remains. Mobile JavaScript
  reachability was not observed; a production Node/web deployment needs separate review.

## node-forge 1.4.0 — high — FAIL: no compatible patch

- Root: [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), CVE-2026-85393.
- Transitive paths: Expo > @expo/cli > node-forge and Expo > @expo/cli >
  @expo/code-signing-certificates > node-forge. Registry latest was 1.4.0; no published patch
  was available for the affected range through 1.4.0.
- Reachability: malformed nested digest-algorithm structures can be accepted during RSA
  PKCS#1 v1.5 signature verification. Source inspection found certificate, public-key signature,
  and CSR verification in @expo/code-signing-certificates/build/main.js. The primitive is
  reachable in tooling that accepts signing input. The application has no certificate-input
  feature, and the package was absent from the inspected native bundle.
- Mitigation: do not accept untrusted certificates, CSRs or signatures through this tooling or
  use it as a production verification trust boundary while unpatched. Use trusted signing material,
  keep private keys out of source control and PR runners, and review any future OTA/signing service.
  No EAS credentials, release keys or signing service were created in this phase.
- Residual risk: authenticity/integrity risk remains for tooling integrations that verify
  attacker-controlled signing input. A separate deployed signing service is NOT VERIFIED.

## sprintf-js 1.0.3 — moderate — FAIL: no compatible patch

- Root: [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), CVE-2026-97058.
- Transitive path: Jest transforms > babel-plugin-istanbul > @istanbuljs/load-nyc-config >
  js-yaml 3.x > argparse 1.0.10 > sprintf-js 1.0.3.
- Registry latest was 1.1.3, also affected by the advisory's range <=1.1.3; a minor update
  would not remediate it.
- Reachability: attacker-controlled format strings with unbounded precision can cause denial
  of service. argparse formats configured help/usage strings. js-yaml's CLI imports argparse,
  but its core YAML loader used by load-nyc-config does not import that CLI. The normal coverage
  YAML-loading path alone therefore does not establish a reachable precision-format attack.
  No application formatter imports this package, and it was absent from the native export.
- Mitigation: keep CLI format/help strings static, review test/coverage configuration, avoid
  external format strings, and isolate/time-limit untrusted builds. Monitor compatible upstream
  parser/coverage fixes. No incompatible Jest downgrade was applied.
- Residual risk: conditional tooling denial of service remains if attacker-controlled format
  strings reach the formatter. Native application reachability was not observed.

## uuid 7.0.3 — moderate — FAIL: no compatible parent patch

- Root: [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), CVE-2026-41907.
- Transitive paths: Expo > @expo/config(-plugins) > xcode 3.0.1 > uuid 7.0.3 and
  expo-splash-screen > @expo/config-plugins > xcode > uuid. xcode registry latest was 3.0.1.
- Patched uuid starts at 11.1.1, outside xcode's supported dependency range. No forced
  cross-major override was applied without upstream compatibility evidence.
- Reachability: the flaw concerns v3/v5/v6 with caller-supplied output buffers and insufficient
  bounds checking. xcode/lib/pbxProject.js:generateUuid calls uuid.v4() without a buffer, then
  removes hyphens and truncates the string. That call does not meet the exploit preconditions.
  npm uuid was absent from the inspected native export. Expo's native UUID wrapper has no
  caller-supplied output-buffer API.
- Mitigation: retain the supported Expo/xcode graph, avoid adding affected UUID buffer calls,
  monitor a compatible xcode/config-plugins fix, then rerun audit and native validation.
- Residual risk: the vulnerable dependency remains installed, although the observed v4 call
  does not reach the flaw. Additional consumers and future changes require review.

## CI — PASS configuration / FAIL audit / NOT VERIFIED hosted

The quality job retains npm ci, Expo checks, TypeScript, Biome, Jest, hooks and web export.
An independent security job generates the two audits and uploads raw JSON, explanations and
the complete package mapping even on failure. It publishes a job summary and does not ignore
the failing audit exit. The workflow has read-only contents permissions, no persisted checkout
credentials, no privileged PR trigger, and bounded job timeouts. No workflow was pushed or
triggered. Hosted execution is NOT VERIFIED.

Raw npm recommends incompatible Expo/Jest downgrades; those were rejected. Current safe action
is mitigation and upstream monitoring. Security CI remains FAIL until findings are safely resolved.
This review neither waives findings nor approves production release.

## All 56 affected package findings

| Affected package | Locked versions | Severity | Dependency | Root advisories |
| --- | --- | --- | --- | --- |
| @expo/cli | 58.1.11 | high | transitive | GHSA-86w9-cpqp-85rv, GHSA-w5hq-g745-h8pq, GHSA-vfj7-8cjw-p6xm |
| @expo/code-signing-certificates | 0.0.7 | high | transitive | GHSA-86w9-cpqp-85rv |
| @expo/config | 58.0.6 | moderate | transitive | GHSA-w5hq-g745-h8pq |
| @expo/config-plugins | 58.0.9 | moderate | transitive | GHSA-w5hq-g745-h8pq |
| @expo/inline-modules | 0.2.6 | moderate | transitive | GHSA-w5hq-g745-h8pq |
| @expo/local-build-cache-provider | 58.0.6 | moderate | transitive | GHSA-w5hq-g745-h8pq |
| @expo/metro | 58.0.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| @expo/metro-config | 58.0.14 | high | transitive | GHSA-w5hq-g745-h8pq, GHSA-vfj7-8cjw-p6xm |
| @expo/prebuild-config | 58.0.14 | moderate | transitive | GHSA-w5hq-g745-h8pq |
| @istanbuljs/load-nyc-config | 1.1.0 | moderate | transitive | GHSA-hp3w-g68c-fv3c |
| @jest/core | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| @jest/environment | 29.7.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| @jest/expect | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| @jest/fake-timers | 29.7.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| @jest/globals | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| @jest/reporters | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| @jest/transform | 30.5.2, 29.7.0 | high | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| @react-native/community-cli-plugin | 0.88.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| @react-native/jest-preset | 0.88.0 | high | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| @react-native/metro-config | 0.88.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| @react-native/virtualized-lists | 0.88.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| @testing-library/react-native | 14.1.0 | high | direct | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| argparse | 1.0.10 | moderate | transitive | GHSA-hp3w-g68c-fv3c |
| babel-jest | 29.7.0, 30.5.2 | high | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| babel-plugin-istanbul | 8.0.0, 6.1.1 | moderate | transitive | GHSA-hp3w-g68c-fv3c |
| braces | 3.0.3 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| expo | 58.0.14 | high | direct | GHSA-86w9-cpqp-85rv, GHSA-w5hq-g745-h8pq, GHSA-vfj7-8cjw-p6xm |
| expo-modules-core | 58.0.22 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| expo-router | 58.0.23 | high | direct | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| expo-splash-screen | 58.0.10 | moderate | direct | GHSA-w5hq-g745-h8pq |
| jest | 30.5.2 | moderate | direct | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-circus | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-cli | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-config | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-environment-node | 29.7.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| jest-expo | 58.0.11 | high | direct | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-haste-map | 29.7.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| jest-message-util | 29.7.0 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| jest-resolve-dependencies | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-runner | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-runtime | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-snapshot | 30.5.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| jest-watch-typeahead | 3.0.1 | moderate | transitive | GHSA-hp3w-g68c-fv3c, GHSA-vfj7-8cjw-p6xm |
| js-yaml | 3.15.2 | moderate | transitive | GHSA-hp3w-g68c-fv3c |
| metro | 0.87.1 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| metro-config | 0.87.1 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| metro-file-map | 0.87.1 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| metro-transform-worker | 0.87.1 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| micromatch | 4.0.8 | high | transitive | GHSA-vfj7-8cjw-p6xm |
| node-forge | 1.4.0 | high | transitive | GHSA-86w9-cpqp-85rv |
| react-native | 0.88.0 | high | direct | GHSA-vfj7-8cjw-p6xm |
| react-native-reanimated | 4.7.1 | high | direct | GHSA-vfj7-8cjw-p6xm |
| react-native-worklets | 0.13.0 | high | direct | GHSA-vfj7-8cjw-p6xm |
| sprintf-js | 1.0.3 | moderate | transitive | GHSA-hp3w-g68c-fv3c |
| uuid | 7.0.3 | moderate | transitive | GHSA-w5hq-g745-h8pq |
| xcode | 3.0.1 | moderate | transitive | GHSA-w5hq-g745-h8pq |

npm production dependency classification does not prove that code is bundled into a native app.
