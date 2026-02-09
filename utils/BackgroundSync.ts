import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
// import { apiService } from "./ApiService";
import {
  notificationService,
  CATEGORY_ALARM,
  CHANNEL_ID,
} from "./NotificationService";
import { dismissSync, getReminders, snoozeSync } from "@/api/reminders";
import {
  deleteLocalReminder,
  getLocalReminderById,
} from "@/data/repositories/reminderRepository";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
export interface SyncPayload {
  type: "SYNC_COMMAND";
  action: "DISMISS" | "SNOOZE" | "SYNC_NEW" | "EDIT" | "DELETE";
  reminderId: string;
  data: {
    device_id: string;
    reminder_id: string;
    snooze_time: number;
  };
  snoozeMinutes?: number;
}
const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC_TASK";

function formatDateForId(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}${dd}${yyyy}`;
}

/**
 * Generates a deterministic ID for a reminder instance.
 */
function getInstanceId(reminderId: string, instanceDate?: string): string {
  const dateStr = instanceDate || formatDateForId(new Date());
  return `reminder_${reminderId}_${dateStr}`;
}

// Simple lock to prevent double API calls (debounce)
const actionLocks = new Map<string, number>();
const LOCK_TIMEOUT = 2000; // 2 seconds

function isLocked(key: string): boolean {
  const lastCall = actionLocks.get(key);
  if (lastCall && Date.now() - lastCall < LOCK_TIMEOUT) {
    return true;
  }
  actionLocks.set(key, Date.now());
  return false;
}

// 1. Setup Background Task for Silent Pushes (Data-only notifications)
export function registerBackgroundSyncTask() {
  TaskManager.defineTask(
    BACKGROUND_SYNC_TASK,
    async ({ data, error, executionInfo }) => {
      if (error) {
        // console.log("Background task error", error);
        console.error("Background task error", error);
        return;
      }

      if (data) {
        const notification = data as any;
        const remoteData = notification?.data;
        if (!remoteData) return;

        let payload: SyncPayload | null = null;
        try {
          const rawPayload =
            Platform.OS === "ios" ? remoteData.dataString : remoteData.body;
          payload =
            typeof rawPayload === "string"
              ? (JSON.parse(rawPayload) as SyncPayload)
              : (rawPayload as SyncPayload);
        } catch (e) {
          console.error("Failed to parse background sync payload", e);
        }
        // console.log("Background Sync Payload", payload);
        if (payload && payload.type === "SYNC_COMMAND") {
          console.log(
            `Background Sync Received: ${payload.action} for ${payload.reminderId}`,
          );

          if (payload.action === "DISMISS") {
            const instanceId = getInstanceId(payload.reminderId);
            // print all scheduled notifications
            const scheduledNotifications =
              await Notifications.getAllScheduledNotificationsAsync();
            // console.log("Scheduled notifications", scheduledNotifications);
            await Notifications.dismissNotificationAsync(instanceId);
          }
          if (payload.action === "SYNC_NEW") {
            const res = await getReminders();
            const reminders = res?.data;
            // console.log("Reminders synced", reminders);
            reminders.forEach((reminder) => {
              notificationService.scheduleReminder(reminder);
            });
          }
          // If snooze, you might fetch the updated time from server or calculate locally
          if (payload.action === "SNOOZE") {
            const instanceId = getInstanceId(payload.reminderId);
            // const snoozeMinutes = (payload as any).snoozeMinutes || 5;

            // get targetReminder from local db
            const targetReminder = await getLocalReminderById(
              payload.reminderId,
            );

            if (targetReminder) {
              await Notifications.dismissNotificationAsync(instanceId);
              await Notifications.scheduleNotificationAsync({
                identifier: instanceId,
                content: {
                  title: "Snoozed",
                  body: `${targetReminder.name}`,
                  categoryIdentifier: CATEGORY_ALARM,
                  data: {
                    ...payload,
                    reminderId: payload.reminderId,
                    reminderName: targetReminder.name,
                    isSnooze: true,
                  },
                  vibrate: [200, 100, 200, 100, 200],
                  sound: "alarm2.wav",
                  sticky: true,
                  autoDismiss: false,
                  interruptionLevel: "timeSensitive",
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes
                    .TIME_INTERVAL,
                  seconds: payload.data.snooze_time * 60,
                  channelId: CHANNEL_ID,
                },
              });
            }
          }
          if (payload.action === "EDIT") {
            const instanceId = getInstanceId(payload.reminderId);
            // const snoozeMinutes = (payload as any).snoozeMinutes || 5;
            const reminders = await getReminders();
            const targetReminder = reminders?.data?.find(
              (reminder) => reminder.id === payload.reminderId,
            );
            if (targetReminder) {
              await Notifications.dismissNotificationAsync(instanceId);
              await Notifications.scheduleNotificationAsync({
                identifier: `${instanceId}_EDIT`,
                content: {
                  title: "Reminder Updated",
                  body: `${targetReminder.name}`,
                  sticky: true,
                  autoDismiss: false,
                  interruptionLevel: "timeSensitive",
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes
                    .TIME_INTERVAL,
                  seconds: 5,
                },
              });
              await notificationService.scheduleReminder(targetReminder);
            }
          }
          if (payload.action === "DELETE") {
            const instanceId = getInstanceId(payload.reminderId);
            await Notifications.cancelScheduledNotificationAsync(instanceId);
            await deleteLocalReminder(payload.reminderId);
          }
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
    const reminderId = data.reminderId as string;
    const instanceDate = data.instanceDate as string | undefined;
    const reminderName = data.reminderName || "Reminder";
    const device_id = await SecureStore.getItemAsync("device_id");

    if (!reminderId) return;

    if (actionId === "DISMISS") {
      if (isLocked(`dismiss_${reminderId}`)) return;

      // console.log(`User Clicked DISMISS for ${reminderId}`);

      // 1. Clean up local UI
      await Notifications.dismissNotificationAsync(
        response.notification.request.identifier,
      );

      // 2. Tell Backend to sync others
      await dismissSync(reminderId as string, device_id as string);
    } else if (actionId.startsWith("SNOOZE_")) {
      if (isLocked(`snooze_${reminderId}`)) return;
      // console.log(`User Clicked SNOOZE for ${reminderId}`);
      let snoozeMinutes = 10; // Default

      if (actionId === "SNOOZE_5") snoozeMinutes = 5;
      else if (actionId === "SNOOZE_10") snoozeMinutes = 10;
      else if (actionId === "SNOOZE_15") snoozeMinutes = 15;
      else if (actionId === "SNOOZE_CUSTOM") {
        // console.log(`User Clicked SNOOZE_CUSTOM for ${reminderId}`);
        const userText = (response as any).userText;
        const parsed = parseInt(userText, 10);
        if (!isNaN(parsed) && parsed > 0) {
          snoozeMinutes = parsed;
        } else {
          // Fallback or ignore if invalid
          console.warn("Invalid custom snooze input:", userText);
        }
      }

      // console.log(
      //   `User Clicked SNOOZE for ${reminderId} (Minutes: ${snoozeMinutes})`,
      // );

      await Notifications.dismissNotificationAsync(
        response.notification.request.identifier,
      );

      // Create a unique identifier that is consistent with background sync
      const instanceId = getInstanceId(reminderId, instanceDate);

      // 2. Schedule local generic snooze immediately
      await Notifications.scheduleNotificationAsync({
        identifier: instanceId,
        content: {
          title: "Snoozed",
          body: `${reminderName}`,
          categoryIdentifier: CATEGORY_ALARM,
          data: { ...data, isSnooze: true },
          vibrate: [200, 100, 200, 100, 200],
          sound: "alarm2.wav",
          sticky: true,
          autoDismiss: false,
          interruptionLevel: "timeSensitive",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: snoozeMinutes * 60,
          channelId: CHANNEL_ID,
        },
      });

      await snoozeSync(
        reminderId as string,
        device_id as string,
        snoozeMinutes as number,
      );
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
