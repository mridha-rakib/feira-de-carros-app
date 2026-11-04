# FikiFlow

React Native + Expo development foundation, using npm and TypeScript strict mode.
The existing Home and Explore starter screens remain available.

## Requirements

- Node.js 24.x (`.nvmrc`) and npm 11.x; Git for Windows includes the shell Husky uses.
- Android Studio and an emulator, or a physical Android device, for native Android testing.
- macOS and Xcode for an iOS simulator or native iOS builds. Windows cannot run the iOS simulator.
- An Expo Go version that supports SDK 58, or a compatible development build.

The checked dependency set is Expo 58.0.14, React Native 0.88.0, React 19.3.0,
TypeScript 6.0.3, Biome 2.5.15, Jest 30.5.2, jest-expo 58.0.11, and
React Native Testing Library 14.1.0. Expo's [compatibility table](https://docs.expo.dev/versions/latest/)
and [Jest guide](https://docs.expo.dev/develop/unit-testing/) describe the supported foundation.
Keep package-lock.json committed and use `npx expo install <package> --npm` for native dependencies.

## Start on Windows

```powershell
npm ci
# Only if .env does not already exist:
Copy-Item .env.example .env
# Edit EXPO_PUBLIC_API_URL in .env to point to your backend.
npm start
```

The project now includes a custom development client. Build it once with `npm run android:build`
using the [Android development workflow](docs/ANDROID_DEVELOPMENT.md), then start Metro with
`npm run start:dev`. Press `a` for Android, `w` for web, `j` for React Native DevTools, and `m` for the
native developer menu. Or run `npm run android` or `npm run web` directly.
For a USB device, `adb reverse tcp:8081 tcp:8081` can make a localhost Metro server reachable.
To reach a backend running on Windows from the standard Android emulator, use
`http://10.0.2.2:3000` in `.env`; a physical device needs your computer's reachable LAN address.
The template does not start a backend. The sample current-user query stays disabled until auth exists.

`EXPO_PUBLIC_API_URL` is required and must be an HTTP(S) base URL, optionally with a path
prefix, without credentials, query parameters, or fragments. `EXPO_PUBLIC_APP_ENV` is one of
`development`, `preview`, or `production` (defaults to development). All `EXPO_PUBLIC_`
values are embedded in client bundles: never put secrets there. `.env*` files are ignored,
with `.env.example` as the only exception. Full reload the app after environment changes.
Expo requires direct `process.env.EXPO_PUBLIC_*` property access for inlining; keep it in `src/config/env.ts`.
See [Expo environment variables](https://docs.expo.dev/guides/environment-variables/).

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Metro and Expo developer server |
| `npm run android` / `npm run web` | Build/run Android development client / start web |
| `npm run ios` | Build/run iOS on a supported macOS environment |
| `npm run typecheck` | Strict TypeScript check, including tests and web |
| `npm run lint` / `npm run lint:fix` | Biome lint / safe fixes |
| `npm run format` / `npm run format:check` | Format / verify formatting |
| `npm run check` / `npm run check:fix` | Biome formatting, imports, and lint |
| `npm test` | Run Jest tests |
| `npm run test:ci` | CI tests and coverage in coverage/ |
| `npm run validate` | TypeScript + Biome combined check + CI tests |
| `npm run deps:check` | Check Expo dependency compatibility |
| `npm run doctor` | Check Expo project health |
| `npm run hooks:verify` | Exercise real hooks in a disposable Git repo |
| `npm run export:web` | Build web client and server into dist/ |
| `npm run start:dev` | Start Metro for an installed development client |
| `npm run android:build` | Generate/build/install a local Android development client |
| `npm run android:go` | Explicit Expo Go fallback, if a compatible client is installed |
| `npm run security:report` | Save full/production audit and dependency paths; fails on findings |

Install the recommended VS Code extensions. Biome handles formatting and import organization
on save; use the workspace TypeScript version. `.editorconfig` and `.gitattributes` keep
line endings consistent, including Husky scripts on Windows.

## Architecture

- `src/app/`: Expo Router routes and root layout; keep business logic in features.
- `src/features/<domain>/`: hooks and Zod DTOs for a domain.
- `src/services/api/`: validated fetch client and normalized `ApiError`.
- `src/config/env.ts`: startup validation of public configuration.
- `src/providers/`: ErrorBoundary and QueryClientProvider wired into the root layout.
- `src/lib/`: development logger and QueryClient factory.
- `src/components/ui/` and `src/components/common/`: reusable UI and error boundary.
- `src/constants/theme.ts` and `src/theme/`: existing theme and semantic tokens.
- `src/types/`: shared schemas and CSS type declarations.
- `tests/`: DTO, API, environment, logger, component, and provider tests.

`@/` resolves to `src/`; `@/assets/` resolves to assets/. Expo Router's main entry is
`expo-router/entry`. CSS module declarations support the existing web animation without
turning off strict checking.

## Validated API calls

Define schemas first and derive types with `z.infer<typeof Schema>`. Do not duplicate DTO
interfaces. Every client call requires a response schema, including `z.void()` for HTTP 204.
Pass a request schema for request payloads:

```ts
import { z } from 'zod';
import { apiClient } from '@/services/api/client';
import { LoginRequestSchema, LoginResponseSchema } from '@/features/auth/dto/auth.dto';

type LoginRequest = z.infer<typeof LoginRequestSchema>;
export function login(input: LoginRequest, signal?: AbortSignal) {
  return apiClient.post('/auth/login', input, {
    requestSchema: LoginRequestSchema,
    schema: LoginResponseSchema,
    signal,
  });
}
```

Responses are inferred from the supplied schema. Use `params` for query parameters and
encode user-controlled path segments with `encodeURIComponent`. The client adds the configured
base URL and JSON headers, optionally loads credentials through `setTokenProvider`, and applies
a 30-second deadline to credential loading, fetch, and response parsing. Authentication-provider
failures stop the request. Timeout and caller cancellation produce distinct `ApiError` flags.
HTTP errors are parsed with the shared error DTO when valid; malformed bodies fall back to the
HTTP status. All request errors become `ApiError`. Response validation errors expose issue codes,
not received values. Use `error.userMessage` for API UI errors.

Each mounted QueryProvider owns a QueryClient, preventing server-rendered requests from sharing
cached user data. Native AppState updates query focus; Expo Network updates connectivity.
Subscriptions are removed on unmount, while the browser uses Query's web listeners.
Client errors, cancelled requests, and invalid DTOs are not retried. Transient query failures retry
twice; mutations do not retry. Query hooks pass the provided AbortSignal into the API client.
See [TanStack's React Native guidance](https://tanstack.com/query/latest/docs/framework/react/react-native).

## Development logging

```ts
import { createLogger } from '@/lib/logger';
const log = createLogger('Profile');
log.debug('Refresh started');
log.info('Refresh complete', { durationMs: 24 });
log.warn('Retry scheduled', { attempt: 1 });
log.error('Refresh failed', { code: 'NETWORK_ERROR' });
```

All four levels include timestamps and a scope. DEBUG and INFO use `console.log` for default
console visibility. Logs are enabled only in development builds with the development app
environment; production and preview emit no application logs.

Use static messages and diagnostic metadata. Never pass user content, identifiers, passwords,
tokens, raw errors, headers, or payloads. The logger additionally redacts sensitive keys recursively
and case-insensitively, sanitizes URLs/bearer values/email text, and handles cycles and bigint.
Redaction is a backup; it cannot infer that an arbitrary unlabeled string is personal data.
API diagnostics contain the method, status, duration and safe failure metadata; paths, query
values, headers, bodies, and server error messages are omitted.

Expo terminal output shows Metro/bundle diagnostics and server-render logs. For native JavaScript
logs use the Console tab in React Native DevTools (`j`); terminal forwarding depends on the
Expo client/CLI workflow. Web client logs appear in browser DevTools. Do not use legacy remote
JS debugging. See [Expo debugging tools](https://docs.expo.dev/debugging/tools/).

## Hooks and CI

`npm ci` runs `prepare` to install Husky 9 wrappers with `core.hooksPath=.husky/_`.
The tracked hooks use the current Husky format, without deprecated husky.sh initialization.
The pre-commit hook runs lint-staged, applies safe Biome fixes, and stages the fixes.
The pre-push hook runs `npm run validate`, failing if any step fails.
Husky invokes tracked hook bodies through `sh`; their executable bits are not needed.
The generated wrappers are executable and are regenerated on installation.

`npm run hooks:verify` creates its own temporary repository and index, copies the real hook
bodies and checks, and shares dependencies through a removable junction/symlink. It checks
syntax rejection, auto-formatting/re-staging, a valid pre-push, and rejection of a TypeScript
error. It never stages or commits the working project's files and does not contact remotes.

GitHub Actions uses Node 24, npm ci, strict type checking, Biome lint/format/import checks,
Jest with coverage, blocking Expo Doctor and dependency checks, hook integration, and a web
export. Its export uses an explicit public test URL. Hosted execution requires committing and
pushing the workflow; local validation cannot verify GitHub's hosted runner.

## Verification and remaining constraints

See [PHASE_3_REPORT.md](PHASE_3_REPORT.md) for current native/security acceptance and
[SETUP_REPORT.md](SETUP_REPORT.md) for the earlier setup checks.
`npm audit` currently reports upstream transitive advisories. Do not use `npm audit fix --force`:
the proposed dependency downgrades break the SDK 58 foundation. Review upstream fixes when
available and rerun Expo compatibility, validation, and runtime checks after any dependency change.

Security CI runs independently of quality checks. It retains raw full and production npm audit
reports, npm explain evidence, and a complete advisory mapping as a downloadable artifact even
when findings fail the job. No findings are allowlisted or suppressed. See PHASE_3_REPORT.md
for reachability analysis; --omit=dev is a dependency-graph view, not a native-bundle scanner.
