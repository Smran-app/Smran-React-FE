import { create } from "zustand";
import {
  getReminders,
  createReminder as apiCreateReminder,
  updateReminderStatus,
  ReminderResponse,
  CreateReminderPayload,
} from "@/api/reminders";
import { notificationService } from "@/utils/NotificationService";

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
      const reminders = await getReminders();
      set({ reminders, isLoading: false });
      for (const r of reminders) {
        try {
          await notificationService.scheduleReminder(r);
        } catch (innerError) {
          console.error(`Failed to schedule reminder ${r.id}:`, innerError);
        }
      }
    } catch (err: any) {
      set({
        error: err.message || "Failed to fetch reminders",
        isLoading: false,
      });
    }
  },

  addReminder: async (payload: CreateReminderPayload) => {
    set({ isLoading: true, error: null });
    try {
      const newReminder = await apiCreateReminder(payload);
      set((state) => ({
        reminders: [newReminder, ...state.reminders],
        isLoading: false,
      }));
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

    // Optimistic update
    const previousReminders = get().reminders;
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r,
      ),
    }));

    try {
      await updateReminderStatus(id, newStatus);
    } catch (err: any) {
      // Rollback on error
      set({
        reminders: previousReminders,
        error: err.message || "Failed to update reminder",
      });
    }
  },

  deleteReminder: async (id: string) => {
    const previousReminders = get().reminders;
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    }));

    try {
      // Assuming a deleteReminder exists in API (I'll add it if I haven't)
      // I added it in api/reminders.ts
      const { deleteReminder: apiDeleteReminder } =
        await import("@/api/reminders");
      await apiDeleteReminder(id);
    } catch (err: any) {
      set({
        reminders: previousReminders,
        error: err.message || "Failed to delete reminder",
      });
    }
  },
}));
