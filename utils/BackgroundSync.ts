import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
// import { apiService } from "./ApiService";
import {
  notificationService,
  CATEGORY_ALARM,
  CHANNEL_ID,
} from "./NotificationService";
import { dismissSync, getReminders } from "@/api/reminders";
import * as SecureStore from "expo-secure-store";
export interface SyncPayload {
  type: "SYNC_COMMAND";
  action: "DISMISS" | "SNOOZE" | "SYNC_NEW";
  reminderId: string;
}
const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC_TASK";

// 1. Setup Background Task for Silent Pushes (Data-only notifications)
export function registerBackgroundSyncTask() {
  TaskManager.defineTask(
    BACKGROUND_SYNC_TASK,
    async ({ data, error, executionInfo }) => {
      if (error) {
        console.error("Background task error", error);
        return;
      }

      if (data) {
        // @ts-ignore: Payload structure validation
        const payload = JSON.parse(data.data.body) as SyncPayload;
        // console.log("Background Sync Received:", payload);
        if (payload && payload.type === "SYNC_COMMAND") {
          console.log(
            `Background Sync Received: ${payload.action} for ${payload.reminderId}`,
          );

          if (payload.action === "DISMISS") {
            await notificationService.cancelReminder(payload.reminderId);
          }
          if (payload.action === "SYNC_NEW") {
            const res = await getReminders();
            const reminders = res?.data;
            reminders.forEach((reminder) => {
              notificationService.scheduleReminder(reminder);
            });
          }
          // If snooze, you might fetch the updated time from server or calculate locally
        }
      }
    },
  );

  // Register the task with Expo
  Notifications.registerTaskAsync(BACKGROUND_SYNC_TASK);
}

let isListenersSetup = false;

// 2. Handle User Button Clicks (Foreground/Background)
export function setupInteractionListeners() {
  if (isListenersSetup) return;
  isListenersSetup = true;

  // A. User taps a button (Snooze/Dismiss)
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data;
    const reminderId = data.reminderId;
    const reminderName = data.reminderName || "Reminder";

    if (actionId === "DISMISS") {
      // 1. Clean up local UI
      await Notifications.dismissNotificationAsync(
        response.notification.request.identifier,
      );
      const device_id = await SecureStore.getItemAsync("device_id");
      // 2. Tell Backend to sync others
      await dismissSync(reminderId as string, device_id as string);
    } else if (actionId.startsWith("SNOOZE_")) {
      let snoozeMinutes = 10; // Default

      if (actionId === "SNOOZE_5") snoozeMinutes = 5;
      else if (actionId === "SNOOZE_10") snoozeMinutes = 10;
      else if (actionId === "SNOOZE_15") snoozeMinutes = 15;
      else if (actionId === "SNOOZE_CUSTOM") {
        const userText = (response as any).userText;
        const parsed = parseInt(userText, 10);
        if (!isNaN(parsed) && parsed > 0) {
          snoozeMinutes = parsed;
        } else {
          // Fallback or ignore if invalid
          console.warn("Invalid custom snooze input:", userText);
        }
      }

      await Notifications.dismissNotificationAsync(
        response.notification.request.identifier,
      );

      // Create a unique identifier for the snooze instance to avoid conflicts
      const snoozeId = `${reminderId}_snooze_${Date.now()}`;

      // 2. Schedule local generic snooze immediately
      await Notifications.scheduleNotificationAsync({
        identifier: snoozeId,
        content: {
          title: "Snoozed",
          body: `Snoozed: ${reminderName}`,
          categoryIdentifier: CATEGORY_ALARM,
          data: { ...data, isSnooze: true },
          vibrate: [200, 100, 200, 100, 200],
          sound: "alarm.wav",
          sticky: true,
          autoDismiss: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: snoozeMinutes * 60, // Restore to minutes (use snoozeMinutes * 60)
          channelId: CHANNEL_ID,
        },
      });

      //   await apiService.syncAction(reminderId, "snooze", snoozeMinutes);
    }
  });

  // B. App receives a Push while Open (Foreground Sync)
  Notifications.addNotificationReceivedListener(async (notification) => {
    const data = notification.request.content.data;
    const payload = data as unknown as SyncPayload;

    if (payload && payload.type === "SYNC_COMMAND") {
      if (payload.action === "DISMISS") {
        await notificationService.cancelReminder(payload.reminderId);
      }
    }
  });
}
