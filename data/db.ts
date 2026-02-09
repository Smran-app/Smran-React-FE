import * as SQLite from "expo-sqlite";

export const DATABASE_NAME = "smran.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let isInitialized = false;

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
};

export const initDB = async () => {
  if (isInitialized) return;
  const db = await getDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      link TEXT,

      status TEXT NOT NULL,
      repeat_metadata TEXT,
      next_run_time TEXT,
      link_metadata TEXT,
      created_at TEXT,
      updated_at TEXT,
      user_id TEXT,
      sync_status TEXT DEFAULT 'synced'
    );
  `);

  // Migration: Add description column if it doesn't exist
  try {
    const tableInfo = (await db.getAllAsync(
      "PRAGMA table_info(reminders)",
      [],
    )) as any[];
    const hasDescription = tableInfo.some((col) => col.name === "description");
    if (!hasDescription) {
      await db.execAsync("ALTER TABLE reminders ADD COLUMN description TEXT;");
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
  isInitialized = true;
};
