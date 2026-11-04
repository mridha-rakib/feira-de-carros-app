# FikiFlow App — Agent Instructions

## Project Overview
This is a React Native + Expo application built with:
- **Expo SDK 58** with Expo Router for file-based navigation
- **TypeScript 6.0** with strict mode enabled
- **React Native 0.88** / **React 19.3**
- **Biome** for linting and formatting (no ESLint/Prettier)
- **Zod** for runtime validation and DTO schemas
- **TanStack Query** for server-state management
- **Jest + jest-expo** for testing

## Architecture
- `src/app/` — Expo Router file-based routes (keep these lightweight)
- `src/components/` — Reusable UI components (`ui/` and `common/`)
- `src/features/` — Feature-specific code organized by domain
- `src/services/api/` — Centralized API client and error handling
- `src/providers/` — React context providers
- `src/config/` — Environment and app configuration
- `src/lib/` — Shared utilities (logger, query-client)
- `src/types/` — Shared TypeScript types and DTO schemas
- `src/theme/` — Design tokens and theme configuration
- `tests/` — Test files

## Key Patterns
- DTOs are defined as **Zod schemas** with inferred TypeScript types
- API responses are validated at runtime with Zod
- All API errors are normalized to `ApiError` class
- Logger redacts sensitive fields automatically
- Environment variables use `EXPO_PUBLIC_` prefix and are Zod-validated
- Path alias `@/` maps to `./src/`

## Commands
- `npm start` — Start Expo dev server
- `npm run typecheck` — TypeScript type checking
- `npm run lint` / `npm run lint:fix` — Biome linting
- `npm run format` / `npm run format:check` — Biome formatting
- `npm run check` — Combined Biome check
- `npm test` — Run tests
- `npm run validate` — Full quality gate
- `npm run doctor` — Expo dependency validation

## Rules
- Never disable TypeScript strict mode
- Never hardcode API URLs or secrets
- Never log passwords, tokens, or PII
- Keep route files thin — business logic belongs in features/hooks
- All external data must be validated with Zod schemas
- Use `ApiError` for all API error handling
