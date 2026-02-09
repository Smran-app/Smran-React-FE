import { create } from "zustand";
import {
  getReminders,
  createReminder as apiCreateReminder,
  updateReminderStatus,
  updateReminder as apiUpdateReminder,
  ReminderResponse,
  CreateReminderPayload,
  deleteReminder as apiDeleteReminder,
  syncNewReminders,
  editSync,
  deleteSync,
} from "@/api/reminders";
import { notificationService } from "@/utils/NotificationService";
import * as SecureStore from "expo-secure-store";
import {
  getAllReminders,
  upsertReminders,
  addLocalReminder,
  updateLocalReminderStatus,
  deleteLocalReminder,
  LocalReminder,
  clearReminders,
} from "@/data/repositories/reminderRepository";
import ReceiveSharingIntent from "@apru2002/react-native-receive-sharing-intent";
import Purchases from "react-native-purchases";
export interface Reminder extends ReminderResponse {
  // We can add UI-specific fields here if needed
}

interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  fetchHomeReminders: () => Promise<void>;
  fetchAllReminders: () => Promise<void>;
  addReminder: (payload: CreateReminderPayload) => Promise<void>;
  toggleReminder: (
    id: string,
    currentStatus: "active" | "inactive",
  ) => Promise<void>;
  updateReminder: (
    id: string,
    payload: Partial<CreateReminderPayload>,
  ) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  clearReminders: () => Promise<void>;
  deletingIds: Set<string>;
  isPro: boolean;
  checkPremiumStatus: () => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  isLoading: false,
  error: null,
  deletingIds: new Set(),
  isPro: false,

  // Fetch Today & Tomorrow (for Home Screen)
  fetchHomeReminders: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Initial Local Load
      const localReminders = await getAllReminders();
      set({ reminders: localReminders, isLoading: false });

      const remoteReminders = await getReminders();

      // 3. Upsert with isPartial=true
      await upsertReminders(remoteReminders.data);

      // 4. Update State (filter out currently deleting)
      const updatedLocalReminders = await getAllReminders();
      const filtered = updatedLocalReminders.filter(
        (r) => !get().deletingIds.has(r.id),
      );
      set({ reminders: filtered, isLoading: false });

      // 5. Schedule (simplified: re-schedule all or just new ones.
      //    For efficiency, maybe just schedule incoming ones, but safe to re-run all generally)
      for (const r of updatedLocalReminders) {
        try {
          await notificationService.scheduleReminder(r);
        } catch (ignored) {}
      }
    } catch (err: any) {
      console.error("Fetch home reminders error", err);
      set({
        error: err.message || "Failed to sync reminders",
        isLoading: false,
      });
    }
  },

  // Full Sync (for Manage Screen)
  fetchAllReminders: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await getReminders();
      // Full sync upsert (isPartial = false)
      await upsertReminders(res.data, false);

      const all = await getAllReminders();
      const filtered = all.filter((r) => !get().deletingIds.has(r.id));
      set({ reminders: filtered, isLoading: false });

      for (const r of all) {
        try {
          await notificationService.scheduleReminder(r);
        } catch (ignored) {}
      }
    } catch (err: any) {
      console.error("Fetch all reminders error", err);
      // Fallback local load
      const all = await getAllReminders();
      set({ reminders: all, isLoading: false, error: err.message });
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

  toggleReminder: async (id: string, currentStatus: "active" | "inactive") => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

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

  updateReminder: async (
    id: string,
    payload: Partial<CreateReminderPayload>,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const updatedReminder = await apiUpdateReminder(id, payload);

      // Update local state
      set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === id ? updatedReminder : r,
        ),
        isLoading: false,
      }));

      // Update local DB
      await addLocalReminder(updatedReminder);

      // Reschedule notification
      await notificationService.cancelReminder(id);
      await notificationService.scheduleReminder(updatedReminder);
      const device_id = await SecureStore.getItemAsync("device_id");
      await editSync(id, device_id || "");
    } catch (err: any) {
      set({
        error: err.message || "Failed to update reminder",
        isLoading: false,
      });
      throw err;
    }
  },

  deleteReminder: async (id: string) => {
    const previousReminders = get().reminders;

    // Add to deletingIds to ignore it in sync calls
    set((state) => {
      const newDeleting = new Set(state.deletingIds);
      newDeleting.add(id);
      return { deletingIds: newDeleting };
    });

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
      // Success: Remove from deletingIds
      set((state) => {
        const newDeleting = new Set(state.deletingIds);
        newDeleting.delete(id);
        return { deletingIds: newDeleting };
      });
      const device_id = await SecureStore.getItemAsync("device_id");
      await deleteSync(id, device_id || "");
    } catch (err: any) {
      console.error("API delete failed, rolling back", err);
      // Rollback on error
      set((state) => {
        const newDeleting = new Set(state.deletingIds);
        newDeleting.delete(id);
        return {
          deletingIds: newDeleting,
          reminders: previousReminders,
          error: err.message || "Failed to delete reminder",
        };
      });
      // Restore DB
      const restored = previousReminders.find((r) => r.id === id);
      if (restored) {
        await addLocalReminder(restored);
      }
    }
  },
  clearReminders: async () => {
    set({ reminders: [], isLoading: false, error: null });
    await clearReminders();
  },
  checkPremiumStatus: async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // Replace 'Smran Pro' with your specific Entitlement ID from RevenueCat dashboard
      const isPremium =
        customerInfo.entitlements.active["Smran Pro"] !== undefined;
      set({ isPro: isPremium });
    } catch (e) {
      set({ isPro: false });
    }
  },
}));
