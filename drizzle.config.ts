import type { Config } from 'drizzle-kit';

// Generates the on-device SQLite migrations: `npm run db:generate`.
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
