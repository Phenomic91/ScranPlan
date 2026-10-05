This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # prefer over npm install — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building (no EAS)

This project does **not** use EAS, Expo accounts or Expo's paid services, by design: the app must build and ship without depending on Expo's cloud. Never add `eas.json`, `expo-updates`, `eas-cli` or the Expo push service.

- Development: `npx expo run:ios` / `npx expo run:android` (local builds).
- Release: `npx expo prebuild --clean`, then archive in Xcode (iOS) or `./gradlew app:bundleRelease` (Android). See README.md.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.config.ts` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, not EAS.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## ScranPlan conventions

- **Layout:** `src/app` routes only · `src/features/<area>` screens' logic and components · `src/domain` pure logic and types (no React Native imports; unit-tested) · `src/db` on-device SQLite (Drizzle) · `src/sync` device ↔ server sync · `src/ai` AI router and tasks · `src/ui` shared UI kit · `supabase/` server (Postgres migrations, Edge Functions).
- **On-device first.** Screens read from SQLite (`useLiveQuery`), never from the network. The server is only for sign-in, sync and holding the shared AI key.
- **Synced tables:** add the sync columns (`syncColumns` in `src/db/schema.ts`), register the table in `src/sync/tables.ts`, and add the matching Postgres table with the two triggers and row-level security (copy `recipes` in `supabase/migrations`). Writes set `clientUpdatedAt` and `dirty`, delete by setting `deletedAt`, and call `requestSync()`. See docs/sync.md.
- **Schema changes:** edit `src/db/schema.ts`, then `npm run db:generate`; add a Supabase migration with `npx supabase migration new <name>`.
- **AI:** add a task in `src/ai/tasks` (prompt plus zod output schema) and call it with `runAiTask`. Set `fitsOnDevice` only for small, simple jobs.
- **Style:** Prettier (single quotes, 100 columns), small files, comments only for why, plain UK English in the UI.
- **Before finishing:** `npm run check` (typecheck, lint, tests). For server code, `npm run functions:check`.
