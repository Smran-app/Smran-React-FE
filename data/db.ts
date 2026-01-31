import * as SQLite from "expo-sqlite";

export const DATABASE_NAME = "smran.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
};

export const initDB = async () => {
  const db = await getDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
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
};
