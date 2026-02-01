import { getDB } from "../db";
import { ReminderResponse } from "@/api/reminders";

export interface LocalReminder extends ReminderResponse {
  sync_status:
    | "synced"
    | "pending_update"
    | "pending_delete"
    | "pending_create";
}

export const getAllReminders = async (): Promise<LocalReminder[]> => {
  const db = await getDB();
  const result = await db.getAllAsync<any>(
    "SELECT * FROM reminders ORDER BY next_run_time ASC",
  );
  return result.map((row) => ({
    ...row,
    repeat_metadata: row.repeat_metadata
      ? JSON.parse(row.repeat_metadata)
      : null,
    link_metadata: row.link_metadata ? JSON.parse(row.link_metadata) : null,
  }));
};

export const upsertReminders = async (
  reminders: ReminderResponse[],
  isPartial: boolean = false,
) => {
  const db = await getDB();
  const incomingIds = new Set(reminders.map((r) => r.id));

  // Bulk upsert using transaction
  await db.withTransactionAsync(async () => {
    // 1. Identify and delete local reminders that are 'synced' but missing from server
    // (i.e., they were deleted on server side)
    // ONLY if this is a full sync (!isPartial).
    if (!isPartial) {
      const existingSynced = await db.getAllAsync<{ id: string }>(
        "SELECT id FROM reminders WHERE sync_status = 'synced'",
      );

      for (const row of existingSynced) {
        if (!incomingIds.has(row.id)) {
          await db.runAsync("DELETE FROM reminders WHERE id = ?", [row.id]);
        }
      }
    }

    // 2. Upsert incoming reminders
    for (const r of reminders) {
      await db.runAsync(
        `INSERT OR REPLACE INTO reminders (
          id, name, link, status, repeat_metadata, next_run_time, link_metadata, created_at, updated_at, user_id, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
        [
          r.id,
          r.name,
          r.link || null,
          r.status,
          JSON.stringify(r.repeat_metadata),
          r.next_run_time || null,
          r.link_metadata ? JSON.stringify(r.link_metadata) : null,
          (r as any).created_at || null,
          (r as any).updated_at || null,
          (r as any).user_id ? String((r as any).user_id) : null,
        ],
      );
    }
  });
};

export const addLocalReminder = async (reminder: ReminderResponse) => {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO reminders (
          id, name, link, status, repeat_metadata, next_run_time, link_metadata, created_at, updated_at, user_id, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
    [
      reminder.id,
      reminder.name,
      reminder.link || null,
      reminder.status,
      JSON.stringify(reminder.repeat_metadata),
      reminder.next_run_time || null,
      reminder.link_metadata ? JSON.stringify(reminder.link_metadata) : null,
      (reminder as any).created_at || null,
      (reminder as any).updated_at || null,
      (reminder as any).user_id ? String((reminder as any).user_id) : null,
    ],
  );
};

export const updateLocalReminderStatus = async (
  id: string,
  status: "active" | "paused",
) => {
  const db = await getDB();
  await db.runAsync(
    `UPDATE reminders SET status = ?, sync_status = 'synced' WHERE id = ?`,
    [status, id],
  );
};

export const deleteLocalReminder = async (id: string) => {
  const db = await getDB();
  await db.runAsync("DELETE FROM reminders WHERE id = ?", [id]);
};

export const clearReminders = async () => {
  const db = await getDB();
  await db.runAsync("DELETE FROM reminders");
};
