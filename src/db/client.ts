import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// The change listener lets Drizzle's useLiveQuery re-render screens when rows change.
const sqlite = openDatabaseSync('scranplan.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });
export type Database = typeof db;
