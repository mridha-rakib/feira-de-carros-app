# Phase 05A.1 — Project Audit & Setup Gap Analysis

**Project:** Feira de Carros — Buyer Mobile App (iOS + Android)
**Audit date:** 2026-11-04
**Environment:** Windows 11, Node 24.20.0, npm 11.19.0
**Scope:** Read-only audit. No dependencies, source code, configuration or brand assets were changed. This document is the only file created.

---

## 1. Executive summary

The repository is **not** a plain starter, and it is **not ready for Figma implementation** either.

- **Engineering foundation: mostly done.** Earlier phases added a solid technical base on top of the Expo starter: strict TypeScript, Biome, Husky hooks, GitHub Actions CI, a Zod-validated environment, a hardened API client with `ApiError`, TanStack Query wired for React Native, a redacting logger, an ErrorBoundary and 42 passing unit tests.
- **Product layer: not started.** Everything users see is still the Expo starter: the "Welcome to Expo" Home and Explore tabs, the Expo icon and splash, starter colors, and an app named `app`. The Feira de Carros brand has no presence in the app, and there are no routes for the 42 Buyer screens.
- **App identity is wrong or missing.** The Android package is `com.fikiflow.localdev`. iOS has no bundle identifier. The name, slug and scheme are all `app`.
- **CI will fail as it stands.** Expo Doctor and `expo install --check` report 18 packages with patch-version mismatches, and the CI workflow runs both checks.
- **Figma was not accessible** in this audit (see §11). Design tokens, fonts, screen inventory and navigation structure therefore could not be checked against the approved design.

**Readiness:** about 60% of the P0 foundation is in place. The rest (identity, brand assets, design tokens, fonts, route skeleton, UI primitives, dependency alignment) must be finished in Phase 05A.2 before screen work begins.

---

## 2. Existing project setup status

### 2.1 Starter vs custom architecture

| Area | State | Evidence |
|---|---|---|
| Screens / routes | **Starter** | `src/app/index.tsx` ("Welcome to Expo"), `src/app/explore.tsx`, and NativeTabs Home/Explore in `src/components/app-tabs.tsx` |
| Starter components | **Starter** | `themed-text`, `themed-view`, `hint-row`, `web-badge`, `external-link`, `animated-icon`, `ui/collapsible` |
| Theme | **Starter + generic additions** | `src/constants/theme.ts` (Expo starter colors) is re-exported by `src/theme/index.ts`, which adds generic iOS system colors, a purple accent `#6C63FF`, a type scale and radii. None of these values are brand values |
| Infrastructure | **Custom** | `src/config`, `src/services/api`, `src/lib`, `src/providers`, `src/types`, `src/features/auth` |
| Tooling | **Custom** | `biome.jsonc`, `.husky/`, `.github/workflows/ci.yml`, `jest.config.js`, `scripts/verify-hooks.mjs`, `scripts/security-report.mjs` |
| Native | **Custom plugin** | `plugins/with-windows-cmake-paths.js` works around Windows CMake path-length limits for Android builds |
| Docs | Present | `SETUP_REPORT.md`, `PHASE_3_REPORT.md`, `docs/ANDROID_DEVELOPMENT.md`, `docs/SECURITY_REVIEW.md`, `AGENTS.md` |

### 2.2 Git state

- There is one commit: `b3e7ffa Initial commit`.
- **All the foundation work from earlier phases is uncommitted.** That covers 22 modified tracked files and about 40 untracked files and folders, including `src/services`, `src/lib`, `tests/`, `.github/` and `.husky/`.
- Husky is active: `core.hooksPath = .husky/_`. Pre-commit runs `lint-staged` and pre-push runs `npm run validate`.
- No git remote is configured, so CI has never run.
- `.gitignore` covers `.env*` (except `.env.example`), signing material (`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `*.pem`), the generated `/ios` and `/android` folders, and `coverage/` and `artifacts/`.

---

## 3. Installed technology stack

| Layer | Package / version | Notes |
|---|---|---|
| Runtime | Node 24.20.0, npm 11.19.0 | `.nvmrc` = 24. `engines` = Node ≥24 <25, npm ≥11 <12 |
| Framework | `expo` 58.0.14 (SDK 58) | Expected patch is ~58.0.23 |
| RN / React | `react-native` 0.88.0, `react` / `react-dom` 19.3.0 | Expected RN patch is 0.88.1 |
| Language | `typescript` ~6.0.3 | `strict: true`. Path aliases `@/*` → `src/*` and `@/assets/*` → `assets/*` |
| Navigation | `expo-router` 58.0.23 | `typedRoutes` enabled. Uses NativeTabs. `react-native-screens`, `safe-area-context`, `gesture-handler` installed |
| Animation | `react-native-reanimated` 4.7.1, `react-native-worklets` 0.13.0 | |
| Compiler | React Compiler | `experiments.reactCompiler: true` |
| Server state | `@tanstack/react-query` ^5.104.4 | |
| Validation | `zod` ^4.6.7 | |
| Media | `expo-image`, `expo-font` | `expo-font` is installed but no custom fonts are loaded |
| Platform utils | `expo-constants`, `expo-device`, `expo-linking`, `expo-network`, `expo-status-bar`, `expo-system-ui`, `expo-splash-screen`, `expo-web-browser`, `expo-symbols`, `expo-glass-effect`, `@expo/ui` | Several are only used by starter screens (see §5.3) |
| Dev client | `expo-dev-client` | A development build is needed. Expo Go is not used |
| Web | `react-native-web`, `react-dom` | `web.output: "server"` |
| Lint / format | `@biomejs/biome` ^2.5.15 | Biome replaces ESLint and Prettier. No ESLint is installed |
| Testing | `jest` ^30.5.2, `jest-expo` 58.0.11, `@testing-library/react-native` ^14.1.0 | |
| Git hooks | `husky` ^9.1.7, `lint-staged` ^17.6.0 | |

---

## 4. Setup status by area (20 items)

Legend: ✅ Configured · 🟡 Partial · ❌ Missing · ⏸ Not yet required

| # | Area | Status | Findings |
|---|---|---|---|
| 1 | Project directory architecture | 🟡 | The structure in `AGENTS.md` exists: `app`, `components/{ui,common}`, `features`, `services/api`, `providers`, `config`, `lib`, `types`, `theme`. But the starter folders `src/constants` and `src/hooks` sit beside `src/theme`, so there are two theme sources. `features/` only contains an example `auth` feature |
| 2 | TypeScript strict mode | ✅ | `strict: true`, and `tsc --noEmit` passes |
| 3 | Navigation & route structure | ❌ | Only the starter routes `index` and `explore` exist. There are no route groups (`(auth)`, `(tabs)`), no stack layouts, no modal routes, no auth gate, no deep-link plan, and the scheme is `app` |
| 4 | Reusable component architecture | 🟡 | `ErrorBoundary`, `ErrorDisplay` and `LoadingIndicator` exist but use hardcoded off-brand colors: purple `#6C63FF`, and light text `#e0e0e0` that would be nearly invisible on a light background. None of the core primitives exist (Button, TextField, Screen, Header, Card, Icon, Badge, etc.) |
| 5 | Design tokens & typography | ❌ | Brand colors, the Figma type scale and custom fonts are all missing. The current `Typography` and `SemanticColors` values are generic placeholders |
| 6 | Theme configuration | 🟡 | Light and dark color maps and `useTheme` come from the starter, with `userInterfaceStyle: "automatic"`. It is unconfirmed whether the Figma design includes dark mode |
| 7 | Brand asset management | 🟡 | The brand PNGs are present but not used anywhere. The folder name has a typo (`bran-logo`), and filenames contain spaces and accents. See §6 |
| 8 | iOS & Android app identifiers | ❌ | `android.package = com.fikiflow.localdev`. There is no `ios.bundleIdentifier`. `name`, `slug` and `scheme` are all `app`. No `buildNumber` / `versionCode`. No per-environment identifiers |
| 9 | Splash screen & app icon | ❌ | Expo defaults everywhere: `icon.png`, `assets/expo.icon` (iOS), the Android adaptive icon set with background `#E6F4FE`, and a splash with background `#208AEF`. `splash-icon.png` is byte-identical to `expo-logo.png` |
| 10 | Environment variable strategy | 🟡 | `src/config/env.ts` validates `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_APP_ENV` with Zod and fails fast. `.env.example` is tracked and a local `.env` exists and is git-ignored (values not inspected). There is no `app.config.ts` and no EAS environments, so dev, preview and prod builds cannot have different identifiers or names |
| 11 | API client architecture | ✅ | `src/services/api/client.ts` adds timeouts and cancellation, validates request and response with Zod, normalizes errors to `ApiError`, redacts logs and has a token-provider hook. **Gaps:** no 401 → refresh-and-retry, no base error mapping for the real backend contract, and no multipart/upload support (needed only if Buyers upload anything) |
| 12 | Auth & secure token storage | ❌ | There are example DTOs (`LoginRequestSchema`, `AuthTokensSchema`) and a disabled `useCurrentUser`. Missing: secure storage (`expo-secure-store` is not installed), an auth context or session state, a refresh flow, sign-out and cache clearing, and route protection. The auth method (email/password, OTP, social) is unconfirmed |
| 13 | State management & server cache | ✅ (server) / ⏸ (client) | The QueryClient has sensible retry rules plus AppState focus and `expo-network` online wiring. There is no client-state library, and none is needed yet (see §5) |
| 14 | Form validation | 🟡 | Zod schemas are available. There is no form library or form components |
| 15 | Error handling & logging | ✅ | `ApiError` covers user messages; the root has an ErrorBoundary; the logger redacts PII and secrets and only logs in dev. There is no production crash reporting (P2) |
| 16 | Push notifications | ❌ / ⏸ | Nothing is configured: no `expo-notifications`, FCM or APNs. Whether this is needed depends on the Figma screens (P2 at the earliest) |
| 17 | Testing infrastructure | ✅ | Jest with jest-expo and RTL: 8 suites and 42 tests pass. Coverage is collected but no thresholds are enforced. There is no end-to-end tooling (optional, P2) |
| 18 | Linting & formatting | ✅ | Biome covers lint and format with the recommended preset plus project rules. lint-staged runs on commit |
| 19 | CI / build configuration | 🟡 | `.github/workflows/ci.yml` runs a security report, Expo Doctor, a dependency check, typecheck, lint, format, tests, a hook check and a web export. **It will fail now** because of the Expo Doctor and dependency mismatches. There is no `eas.json` and no native or store build pipeline. iOS cannot be built on this Windows machine and needs EAS Build or macOS |
| 20 | Accessibility foundations | ❌ | Only `accessibilityRole="button"` on two `Text` "buttons". There are no conventions for labels, touch targets (44/48 pt), font scaling or contrast-checked tokens, and pressable `Text` is used instead of `Pressable` |

**Additional gaps not in the list above:**

- **Localization / i18n ❌.** The brand is Portuguese-language, but every UI string is hardcoded in English. The target market (pt-BR, pt-PT, pt-AO, pt-MZ) and currency/number formatting need confirmation.
- **Image/media strategy ⏸.** Car listings will be image-heavy. `expo-image` is installed and has caching, but there are no placeholder or blurhash conventions.
- **Fonts ❌.** No font files and no `useFonts`, and the splash is not held until fonts load.

---

## 5. Dependency recommendations

The rule: add a package only when a confirmed requirement needs it.

### 5.1 Required (add when the related step starts)

| Package | When | Why it is needed |
|---|---|---|
| Align existing Expo packages (`npx expo install --fix`) | P0, first step of 05A.2 | Expo Doctor and CI fail on 18 patch mismatches. Patch-level only, no SDK change |
| Brand font(s), e.g. `@expo-google-fonts/<family>` or local `.ttf` files with `expo-font` | P0 | The Figma typography needs custom fonts. `expo-font` is already installed. The family is unconfirmed (see §6.3) |
| `expo-secure-store` | P1 | Access and refresh tokens must go into Keychain / Keystore, not AsyncStorage |
| `react-hook-form` + `@hookform/resolvers` | P1, if Figma has more than a few forms | Buyer flows (sign-in, sign-up, profile, search filters, contact seller) benefit from field-level validation with existing Zod schemas and fewer re-renders. If Figma shows only 1–2 simple forms, plain controlled state plus Zod is enough |

### 5.2 Conditional (decide after the Figma review)

| Package | Add only if |
|---|---|
| `react-native-svg` (+ an SVG transformer) | Figma icons are exported as SVG. If they are, also ask for SVG brand marks |
| `expo-localization` + an i18n library (`i18next`/`react-i18next` or `lingui`) | Multiple languages are needed. If the app is Portuguese-only, a central strings module and `Intl` formatting are enough |
| `expo-notifications` | Figma includes notification screens or settings (P2: needs FCM and APNs credentials) |
| `@sentry/react-native` | Crash reporting is required for production (P2) |
| `expo-updates` | OTA updates are wanted (P2) |
| `zustand` | Client-only state outgrows React context (filters, compare list, etc.). Not needed now |
| `@tanstack/query-async-storage-persister` + `@react-native-async-storage/async-storage` | Offline display of favourites or listings is required |
| `expo-auth-session` / `expo-apple-authentication` | Social sign-in appears in Figma |
| `expo-location` | Location-based search ("cars near me") is in Figma |

### 5.3 Candidates for removal (after starter cleanup, with confirmation)

- `expo-glass-effect`, `@expo/ui`, `expo-symbols`, `expo-web-browser`, `expo-device`: used only by starter screens or components.
- `react-native-web`, `react-dom` and `web.output: "server"`: the product is mobile-only. Keeping web costs very little but adds CI time (`export:web`) and constraints. **A decision is needed.**

### 5.4 Not recommended

- ESLint or Prettier: Biome already covers both.
- Redux / RTK: not justified for a buyer app that mostly reads server data.
- A UI kit (NativeBase, Tamagui, Paper): the approved Figma is custom, so primitives should be built against its tokens.

---

## 6. Brand asset inventory (`assets/images/bran-logo/`)

All files were inspected without changes. Every file is a **PNG, 8-bit RGBA, with a transparent background**. No duplicates were found; all MD5 hashes are unique. **No vector (SVG/PDF/AI) sources are present.**

| File | Size (px) | Layout | Colorway | Likely usage |
|---|---|---|---|---|
| `Logo 1.png` | 1832×370 | Horizontal | Full color: red symbol, black "Feira de", red "carros", black ".com" | Headers and auth screens on **light** backgrounds |
| `Logo 2.png` | 1832×370 | Horizontal | Reversed: red symbol, **white** "Feira de" and ".com", red "carros" | **Dark** backgrounds |
| `Logo 3.png` | 1478×700 | Stacked | Full color | Splash, onboarding, welcome screens on light backgrounds |
| `Logo 4.png` | 1478×700 | Stacked | Reversed (white text) | Splash or onboarding on dark or brand-red backgrounds |
| `Logo 5.png` | 1832×370 | Horizontal | All white (mono) | On photos or brand-red backgrounds |
| `Logo 6.png` | 1832×370 | Horizontal | All black (mono) | Single-color print or neutral contexts |
| `Logo 7.png` | 1478×700 | Stacked | All white (mono) | On photos or brand-red backgrounds |
| `Logo 8.png` | 1478×700 | Stacked | All black (mono) | Single-color contexts |
| `Ícone 1.png` | 474×474 | Symbol only | Red circle; car and handshake are **transparent cut-outs** | Avatar fallback, small brand mark, app icon source (see below) |
| `Ícone 2.png` | 474×474 | Symbol only | White circle with cut-outs | On dark or red backgrounds; Android notification icon candidate |
| `Ícone 3.png` | 474×474 | Symbol only | Black circle with cut-outs | Mono contexts; Android adaptive monochrome candidate |
| `Marca D'água.png` | 634×634 | Symbol only | Pale pink, semi-transparent throughout | Watermark or empty-state and image-placeholder background |

### 6.1 Observations

- **Brand red sampled from `Ícone 1.png`: `#EB0C13`.** Confirm this against the Figma color styles before using it as the primary token.
- Each set has consistent dimensions: all horizontal lockups are 1832×370, all stacked lockups 1478×700 and all icons 474×474, so they appear to be exports from one master file.
- The car and handshake in the icons are **knock-outs (transparent)**, not white fills. On any non-white background the background shows through the car, which may not be intended for an app icon.
- File sizes are 24–69 KB each, which is fine for bundling.

### 6.2 Problems before production use

1. **No asset is suitable as an app icon as-is.** iOS needs a 1024×1024 opaque icon. The Android adaptive icon needs a foreground at least 432 px within its safe zone (1024 source recommended) and a separate background layer. The largest square mark here is 474 px, and its car shape is transparent. **A 1024×1024 or vector source is needed from the designer.**
2. **No vector sources.** A large splash logo on high-density screens would be upscaled from a 1478 px raster. SVG or PDF masters are preferred.
3. **Filenames contain spaces, accents (`Í`, `á`) and an apostrophe** (`Marca D'água.png`). Metro can `require()` them, but accented names are vulnerable to Unicode-normalization differences (NFC vs NFD) between macOS, Windows and git, which can break builds on other machines or in CI. The folder name `bran-logo` is also a typo.
   **Recommendation:** leave the originals untouched. In 05A.2, add ASCII-named working copies in a new folder (e.g. `assets/brand/logo-horizontal-color.png`) and reference only those. This needs developer approval.
4. No @2x/@3x density variants. They are not needed if `expo-image` is used with explicit sizes from the large sources.

### 6.3 Needs developer or designer confirmation

- [ ] The intended usage of each variant. The light/dark/mono mapping above is inferred from the artwork.
- [ ] Brand red `#EB0C13` and any secondary brand colors.
- [ ] Logo typeface. "Feira de" (bold) and "carros" (regular) look like a geometric sans close to **Montserrat**. Confirm which UI font(s) Figma uses; the UI font may differ from the logo font.
- [ ] A 1024×1024 app icon (iOS, opaque) and Android adaptive icon layers (foreground, background, monochrome) from the designer.
- [ ] Splash design: background color, and whether it uses the stacked or icon-only logo.
- [ ] Whether the car cut-outs in `Ícone 1` should be white-filled for the app icon.
- [ ] Approval to create ASCII-named working copies (originals stay as they are).

### 6.4 Other assets in `assets/` (Expo starter, to replace or remove later)

`icon.png` (1024², Expo), `expo.icon/` (iOS icon bundle, Expo), `android-icon-{foreground,background,monochrome}.png` (Expo), `splash-icon.png` (same as `expo-logo.png`), `favicon.png`, `expo-badge*.png`, `expo-logo.png`, `logo-glow.png`, `react-logo*.png`, `tutorial-web.png`, `tabIcons/{home,explore}*.png`. None of these are brand assets.

---

## 7. iOS / Android configuration readiness

| Item | iOS | Android |
|---|---|---|
| App identifier | ❌ No `bundleIdentifier` | ❌ `com.fikiflow.localdev`: a placeholder or another project's ID |
| Display name | ❌ `app` | ❌ `app` |
| URL scheme / deep links | ❌ `app` (generic, may collide) | ❌ Same. No App Links / Universal Links |
| Version / build number | 🟡 `1.0.0`, no `buildNumber` | 🟡 `1.0.0`, no `versionCode` |
| App icon | ❌ Expo default (`assets/expo.icon`) | ❌ Expo default adaptive icon |
| Splash | ❌ Expo default (`#208AEF`) | ❌ Same |
| Orientation | ✅ Portrait | ✅ Portrait |
| Native project | CNG; `/ios` not generated (needs macOS or EAS) | CNG; `/android` generated locally (git-ignored). Windows CMake plugin in place |
| Dev build verified | ❌ Not possible on Windows | ✅ Per `PHASE_3_REPORT.md` (emulator, debug build). **Not re-run in this audit** |
| Permissions / usage strings | ⏸ None declared yet; add per feature (camera, location, notifications) | ⏸ Same |
| Signing / store | ❌ No Apple team, provisioning or EAS | ❌ No upload keystore or Play Console |
| Other | — | `predictiveBackGestureEnabled: false` (review), edge-to-edge is the RN 0.88 default |

The string "FikiFlow" also appears in `AGENTS.md` ("FikiFlow App") and in the CMake plugin marker. **Confirm whether FikiFlow is the agency or workspace name or a leftover from another project.** Identifiers should be agreed before the first store build, because they cannot change after release.

---

## 8. Validation results

All commands were read-only. Nothing was installed, upgraded or fixed.

| Command | Result | Details |
|---|---|---|
| `npm run typecheck` (`tsc --noEmit`) | ✅ PASS | No errors |
| `npm run lint` (`biome lint .`) | ✅ PASS | 54 files checked, no issues |
| `npm run format:check` (`biome format .`) | ✅ PASS | 54 files, no changes needed |
| `npm run check` (`biome check .`) | ✅ PASS | 54 files |
| `npm run test:ci` (`jest --ci --coverage`) | ✅ PASS | 8/8 suites, 42/42 tests, 7.6 s. Coverage is high for API, logger and providers, and 0% for starter components, `useAuth` and `query-client` retry logic |
| `npx expo install --check` | ❌ FAIL (exit 1) | 18 packages behind the expected SDK 58 patch: `expo` 58.0.14→~58.0.23, `expo-router` 58.0.23→~58.0.30, `react-native` 0.88.0→0.88.1, `react-native-safe-area-context` 5.10.1→~5.11.1, `react-native-screens` 4.30.0→~4.30.1, `jest-expo` 58.0.11→~58.0.14, plus 12 other `expo-*` / `@expo/ui` patches |
| `npx expo-doctor@latest` | ❌ FAIL (exit 1) | "1 check failed": the same patch mismatches (17 listed). No other Doctor checks failed |
| `npm audit --omit=dev` | ⚠ 29 vulnerabilities (1 low, 25 moderate, 3 high) | Includes a **high** zod `<4.6.6` memory-exhaustion advisory in the copy **nested under `node_modules/expo`**. The top-level `zod` is 4.6.7 and not affected. `npm audit fix --force` would **downgrade Expo to SDK 53**, so **do not run it**. Re-audit after the patch alignment and review `docs/SECURITY_REVIEW.md` |

**Impact:** the local pre-push hook (`npm run validate`) passes, but the CI `quality` job would fail at the "Expo Doctor" step.

**Not validated:** native iOS build (Windows host), Android native build (not re-run), physical devices, web export, the Figma design.

---

## 9. Setup checklist

### P0 — Required before frontend (Figma) development

- [ ] **P0-1** Commit the current foundation as a baseline (developer action). Every earlier phase is uncommitted.
- [ ] **P0-2** Align Expo patch versions (`npx expo install --fix`), then re-run typecheck, tests, Doctor and audit.
- [ ] **P0-3** Confirm the app identity: display name, slug, scheme, iOS `bundleIdentifier`, Android `package`.
- [ ] **P0-4** Move to `app.config.ts` with `APP_ENV`-based variants (e.g. `.dev` / `.preview` suffixes and names) so dev and prod builds can be installed side by side.
- [ ] **P0-5** Add brand icon and splash from designer-supplied sources (1024 px or vector) to replace the Expo defaults.
- [ ] **P0-6** Extract design tokens from Figma: colors (brand red, neutrals, semantic), typography scale, spacing, radii, shadows, plus a dark-mode decision.
- [ ] **P0-7** Load brand fonts with `expo-font` and keep the splash visible until they load.
- [ ] **P0-8** Combine `src/constants/theme.ts` and `src/theme/index.ts` into one token source. Remove the off-brand `#6C63FF` and the hardcoded dark colors in ErrorBoundary, ErrorDisplay and LoadingIndicator.
- [ ] **P0-9** Remove starter screens, components and assets (do not run `reset-project` blindly; it moves files).
- [ ] **P0-10** Create the route skeleton from the Figma navigation map: `(auth)` stack, `(tabs)` with Buyer tabs, detail stacks, modals, and a `+not-found` page.
- [ ] **P0-11** Build core UI primitives on the tokens: Text, Button, Pressable wrapper, TextField, Screen (safe area + scroll), Header, Icon, Card, Badge, EmptyState, Skeleton.
- [ ] **P0-12** Set accessibility rules for those primitives: labels and roles, minimum touch target 44 pt (iOS) / 48 dp (Android), font scaling, contrast-checked token pairs.
- [ ] **P0-13** Make the language and locale decision (Portuguese variant, i18n vs single-language strings module, currency and number formats).
- [ ] **P0-14** Get ASCII-named working copies of brand assets approved and created.

### P1 — Required before feature (API) integration

- [ ] **P1-1** Get the backend API contract (OpenAPI or similar) and replace the example DTOs with real Zod schemas.
- [ ] **P1-2** Add `expo-secure-store` token storage, connected through `setTokenProvider`.
- [ ] **P1-3** Build session/auth state: sign in, sign out, bootstrap on launch, protected routes with Expo Router redirects or `Stack.Protected`.
- [ ] **P1-4** Add 401 handling: refresh-token flow with single-flight retry, then sign-out and `queryClient.clear()` on failure.
- [ ] **P1-5** Set up the form approach (`react-hook-form` + Zod resolver if confirmed) and Form/Field components.
- [ ] **P1-6** Add query-key factories and hooks per feature (listings, search/filters, favourites, profile, etc.).
- [ ] **P1-7** Set image loading conventions for listings (`expo-image` caching, placeholders, sizes).
- [ ] **P1-8** Configure deep links and the scheme (listing share links) and test them with the router.
- [ ] **P1-9** Set environment URLs for dev, preview and production, plus the EAS environment variable setup.
- [ ] **P1-10** Make the remaining conditional dependency decisions (§5.2) from the Figma review.

### P2 — Required before production release

- [ ] **P2-1** Add `eas.json` with development, preview and production profiles, and EAS project linking.
- [ ] **P2-2** iOS: Apple Developer team, bundle ID, provisioning, App Store Connect record, privacy manifest and usage strings.
- [ ] **P2-3** Android: upload keystore (EAS-managed recommended), Play Console app, data-safety form.
- [ ] **P2-4** Push notifications, if in scope: `expo-notifications`, FCM `google-services.json`, APNs key, permission UX.
- [ ] **P2-5** Crash and error monitoring (e.g. Sentry) connected to the logger and ErrorBoundary.
- [ ] **P2-6** CI build pipeline (EAS Build / Submit) and versioning (`autoIncrement` or a manual policy).
- [ ] **P2-7** Coverage thresholds in Jest, and optional E2E (e.g. Maestro) for critical buyer flows.
- [ ] **P2-8** OTA update policy (`expo-updates`, `runtimeVersion`), if wanted.
- [ ] **P2-9** Resolve or accept the remaining `npm audit` findings, with documented justification.
- [ ] **P2-10** Store assets: screenshots, descriptions, privacy policy URL.

### Optional improvements (not required)

- Remove web support and `export:web` from CI if the product is confirmed mobile-only.
- Remove unused starter dependencies (§5.3).
- Storybook or a component gallery route for UI primitives.
- Query persistence for offline favourites.

---

## 10. Recommended Phase 05A.2 implementation sequence

1. **Baseline:** the developer commits the current working tree on a branch (e.g. `chore/foundation-baseline`).
2. **Dependency alignment:** run `npx expo install --fix`, then `npm run validate`, Expo Doctor and `npm audit --omit=dev`, and record the results.
3. **Decisions:** collect answers to §12 (identity, locale, dark mode, web, fonts, icon sources).
4. **App config:** create `app.config.ts` with identity, per-environment variants, scheme and version fields, and keep the Windows CMake plugin.
5. **Brand assets:** add ASCII working copies, then generate the icon, adaptive icon and splash from the approved sources. Verify on an Android dev build.
6. **Tokens and fonts:** build one `src/theme` (colors, typography, spacing, radii, shadows, light/dark) from Figma, load fonts and hold the splash until they are ready.
7. **Starter cleanup:** remove starter routes, components and assets, and update tests that depend on them.
8. **Navigation skeleton:** route groups and placeholder screens for all 42 Buyer screens (names only, no UI), plus typed-route check.
9. **UI primitives and accessibility:** core components with unit tests, and fix ErrorBoundary, ErrorDisplay and LoadingIndicator to use the tokens.
10. **Strings and locale:** set up the agreed i18n or strings approach.
11. **Re-validate:** typecheck, Biome, tests, Doctor and an Android dev build run. Update the docs and `AGENTS.md` (project name).

P1 items (secure storage, auth, forms, API contract) follow in the next phase, once the backend contract is available.

---

## 11. Limitations of this audit

- **Figma was not accessible.** No Figma integration was available to this audit and the file needs an authenticated session. The 42-screen inventory, iOS/Android variants, color and type styles, fonts, icons and navigation structure were **not checked**. Everything about design tokens above is inferred from the brand PNGs only.
- **iOS** could not be built or run on this Windows host.
- **Android native build** was not re-run. Its status comes from `PHASE_3_REPORT.md`.
- **`.env` values** were deliberately not read. Only the variable names (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`) were confirmed.
- **Backend API**: no contract or documentation was found in the repo, so the auth DTOs are unverified examples.

---

## 12. Risks and decisions requiring confirmation

| # | Risk / decision | Impact | Owner |
|---|---|---|---|
| 1 | **All foundation work is uncommitted** | Work could be lost, and there is no rollback point | Developer |
| 2 | **Final iOS bundle ID and Android package** (currently `com.fikiflow.localdev` / none) | They cannot change after store release, and they affect signing, push and deep links | Product owner |
| 3 | What "FikiFlow" refers to (AGENTS.md, package, plugin) | Naming consistency, risk of shipping a wrong identifier | Developer |
| 4 | **CI fails** on Expo Doctor patch mismatches | Blocks merges once a remote is added | Developer (05A.2 step 2) |
| 5 | **No production-grade icon or splash sources** (474 px max, raster only) | Blurry or rejected store icon | Designer |
| 6 | Brand color, UI font and logo font not confirmed against Figma | Token rework | Designer |
| 7 | Dark mode in scope? (config is currently `automatic`) | Doubles token and QA effort | Product / Designer |
| 8 | Target locale (pt-BR / pt-PT / pt-AO / pt-MZ) and multi-language? | Strings, currency and date formats | Product owner |
| 9 | Keep web support? | CI time, dependency footprint | Product owner |
| 10 | Auth method (email+password, phone OTP, social) and backend contract | Drives P1 dependencies and DTOs | Backend / Product |
| 11 | Push notifications in scope for v1? | P2 credentials and permissions | Product owner |
| 12 | Approval to add ASCII-named brand asset copies | Cross-platform build reliability | Developer |
| 13 | `npm audit` high finding in Expo's nested zod | Security sign-off. `audit fix --force` would break the project | Developer |
| 14 | iOS builds need EAS or macOS | iOS verification is blocked on Windows | Developer |
