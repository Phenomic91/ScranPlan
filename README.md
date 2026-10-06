# ScranPlan

An iOS and Android app for cooking and meal planning: recipes with timers,
weekly plans from your tastes, a pantry, and shopping lists for UK
supermarkets. Built with Expo (React Native) using open-source parts only: no
Expo account, cloud builds or paid services.

Everything runs on the phone from a local SQLite database. A light Supabase
server adds sign-in, sync between devices and a shared AI key.

The full plan: [ScranPlan project plan](https://claude.ai/code/artifact/dd7291ac-3b0f-4741-8511-2b8a7d902eee).

## Run it

You need a current Node LTS, Xcode (iOS) and/or Android Studio (Android).

```bash
npm install
npm run ios       # builds and opens the iOS simulator
npm run android   # builds and opens an Android emulator
```

With no `.env.local` the app runs local-only: recipes work, sign-in and sync
are switched off, and AI works only with your own Claude key (Settings).

## Connect a Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine to start).
2. Copy `.env.example` to `.env.local` and fill in the URL and publishable key
   (Project Settings > API Keys).
3. Link and push the database and AI function:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   npx supabase functions deploy ai
   ```
4. In the dashboard:
   - **Authentication > URL Configuration:** add `scranplan://auth-callback`
     to Redirect URLs. Sign-in emails contain a link that opens the app there.
   - **Authentication > Sign In / Providers > Apple:** enable it and add the
     bundle id `com.scranplan.app` as a client id.
   - Supabase's built-in email sender allows only a couple of emails an hour.
     Before other people use the app, add your own SMTP server
     (Authentication > Emails > SMTP).

Optional secret: `AI_MONTHLY_REQUESTS` (default 300) caps AI requests per user
per month through the server key.

To open a sign-in link in the iOS simulator, copy it from the email and run
`xcrun simctl openurl booted "<link>"`.

### Local Supabase

`npx supabase start` runs the whole server in Docker; put the printed URL and
publishable key in `.env.local`. Sign-in emails appear in Mailpit
(http://127.0.0.1:54324). Serve the AI function with
`npx supabase functions serve --env-file supabase/functions/.env`, where that
file holds `ANTHROPIC_API_KEY=...`.

## Checks

```bash
npm run check             # typecheck, lint, unit tests
npm run functions:check   # typecheck the Edge Function with Deno
```

## Release builds (no EAS)

Bump `version` and `ios.buildNumber` / `android.versionCode` in
`app.config.ts`, then:

- **iOS:** `npm run prebuild`, open `ios/ScranPlan.xcworkspace`, choose
  Product > Archive, and upload to App Store Connect from the Organizer.
- **Android:** `npm run prebuild`, then `cd android && ./gradlew app:bundleRelease`.
  Signing is set up in Phase 6 with a config plugin, because prebuild
  regenerates `android/`.

`ios/` and `android/` are generated and not committed; change native settings
in `app.config.ts`.

## How it fits together

| Folder         | What's there                                                      |
| -------------- | ----------------------------------------------------------------- |
| `src/app`      | Screens (Expo Router)                                             |
| `src/features` | Screen logic and components, by area                              |
| `src/domain`   | Pure logic and types: recipes, quantities                         |
| `src/db`       | On-device SQLite schema and migrations (Drizzle)                  |
| `src/sync`     | Device ↔ server sync ([docs/sync.md](docs/sync.md))               |
| `src/ai`       | AI router: on-device model, then your Claude key, then the server |
| `src/ui`       | Shared UI kit and theme                                           |
| `supabase`     | Postgres migrations and the `ai` Edge Function                    |

Conventions for contributors (and coding agents) are in [AGENTS.md](AGENTS.md).
