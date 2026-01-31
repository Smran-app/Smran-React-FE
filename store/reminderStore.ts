import { create } from "zustand";
import {
  getReminders,
  createReminder as apiCreateReminder,
  updateReminderStatus,
  ReminderResponse,
  CreateReminderPayload,
  deleteReminder as apiDeleteReminder,
} from "@/api/reminders";
import { notificationService } from "@/utils/NotificationService";
import {
  getAllReminders,
  upsertReminders,
  addLocalReminder,
  updateLocalReminderStatus,
  deleteLocalReminder,
  LocalReminder,
} from "@/data/repositories/reminderRepository";

export interface Reminder extends ReminderResponse {
  // We can add UI-specific fields here if needed
}

interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  fetchReminders: () => Promise<void>;
  addReminder: (payload: CreateReminderPayload) => Promise<void>;
  toggleReminder: (
    id: string,
    currentStatus: "active" | "paused",
  ) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  isLoading: false,
  error: null,

  fetchReminders: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Load from Local DB (Instant)
      const localReminders = await getAllReminders();
      set({ reminders: localReminders, isLoading: false }); // Show local data immediately

      // 2. Fetch from API
      const res = await getReminders();
      // console.log("Reminders response:", res);
      const remoteReminders = res?.data;

      // 3. Update Local DB
      await upsertReminders(remoteReminders);

      // 4. Update State with latest data (and potential sync merges if we had logic for that)
      const updatedLocalReminders = await getAllReminders();
      set({ reminders: updatedLocalReminders, isLoading: false });

      // 5. Schedule Notifications (idempotent-ish)
      for (const r of updatedLocalReminders) {
        try {
          await notificationService.scheduleReminder(r);
        } catch (innerError) {
          console.error(`Failed to schedule reminder ${r.id}:`, innerError);
        }
      }
    } catch (err: any) {
      console.error("Fetch reminders error", err);
      // If API fails, we still have local reminders in state from step 1
      set({
        // Don't clear reminders if we have them
        error: err.message || "Failed to sync reminders",
        isLoading: false,
      });
    }
  },

  addReminder: async (payload: CreateReminderPayload) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Optimistic Update (We don't have a real ID yet, so we rely on API first for now to avoid ID collision issues or complexity)
      // Ideally: Generate UUID locally -> save local -> background sync.
      // Current approach: API first (standard), but we can persist immediately once we get response.

      const newReminder = await apiCreateReminder(payload);

      // 2. Save to Local DB
      await addLocalReminder(newReminder);

      // 3. Update State
      set((state) => ({
        reminders: [newReminder, ...state.reminders],
        isLoading: false,
      }));

      // 4. Schedule
      await notificationService.scheduleReminder(newReminder);
    } catch (err: any) {
      set({
        error: err.message || "Failed to create reminder",
        isLoading: false,
      });
      throw err;
    }
  },

  toggleReminder: async (id: string, currentStatus: "active" | "paused") => {
    const newStatus = currentStatus === "active" ? "paused" : "active";

    // 1. Optimistic Update State
    const previousReminders = get().reminders;
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r,
      ),
    }));

    // 2. Optimistic Update DB
    try {
      await updateLocalReminderStatus(id, newStatus);
    } catch (dbErr) {
      console.error("Failed to update local db status", dbErr);
    }

    // 3. API Call
    try {
      await updateReminderStatus(id, newStatus);
    } catch (err: any) {
      // Rollback on error
      console.error("API update failed, rolling back", err);
      // Revert DB
      await updateLocalReminderStatus(id, currentStatus);
      // Revert State
      set({
        reminders: previousReminders,
        error: err.message || "Failed to update reminder",
      });
    }
  },

  deleteReminder: async (id: string) => {
    const previousReminders = get().reminders;

    // 1. Optimistic Update State
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    }));

    // 2. Optimistic Update DB
    try {
      await deleteLocalReminder(id);
      await notificationService.cancelReminder(id);
    } catch (dbErr) {
      console.error("Failed to delete local reminder", dbErr);
    }

    // 3. API Call
    try {
      await apiDeleteReminder(id);
    } catch (err: any) {
      // Rollback on error?
      // If API fails, we might want to keep it deleted locally and retry sync later.
      // But for now, simple rollback.
      set({
        reminders: previousReminders,
        error: err.message || "Failed to delete reminder",
      });
      // Restore DB
      const restored = previousReminders.find((r) => r.id === id);
      if (restored) {
        await addLocalReminder(restored);
      }
    }
  },
}));
