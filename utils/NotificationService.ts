import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { generateOccurrenceDates } from "../utils/SchedulerUtils";
// import { apiService } from './ApiService'; // See file #4 below
import { ReminderResponse } from "@/api/reminders";
export const CATEGORY_ALARM = "REMINDER_ALARM";
export const CHANNEL_ID = "reminder_alarm_channel";

class NotificationService {
  constructor() {
    this.configure();
  }

  private configure() {
    // 1. How notifications behave in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  // 2. Register the Snooze/Dismiss buttons
  async registerCategories() {
    await Notifications.setNotificationCategoryAsync(CATEGORY_ALARM, [
      {
        identifier: "SNOOZE_5",
        buttonTitle: "Snooze 5m",
        options: { opensAppToForeground: false, isDestructive: true },
      },
      // {
      //   identifier: "SNOOZE_10",
      //   buttonTitle: "Snooze 10m",
      //   options: { opensAppToForeground: false },
      // },
      // {
      //   identifier: "SNOOZE_15",
      //   buttonTitle: "Snooze 15m",
      //   options: { opensAppToForeground: false },
      // },
      {
        identifier: "SNOOZE_CUSTOM",
        buttonTitle: "Custom...",
        textInput: {
          placeholder: "Minutes...",
          submitButtonTitle: "Snooze",
        },
        options: { opensAppToForeground: false, isDestructive: true },
      },
      {
        identifier: "DISMISS",
        buttonTitle: "Dismiss",
        options: { isDestructive: true, opensAppToForeground: false },
      },
    ]);

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8B5CF6",
        sound: "alarm.wav",
      });
    }
  }

  // 3. Main Logic: Schedule based on JSON
  async scheduleReminder(reminder: ReminderResponse) {
    // Generate a deterministic ID string for syncing

    // If completed/inactive, ensure it is cancelled
    if (reminder.status !== "active") return;
    const triggerDates = generateOccurrenceDates(reminder.repeat_metadata, 10);

    // 3. Schedule each date individually
    for (const [index, date] of triggerDates.entries()) {
      // Create a unique ID for this specific instance: "reminder_ID_0", "reminder_ID_1"
      const instanceId = `reminder_${reminder.id}_${index}`;
      // can we pass the notification for same instanceId is already scheduled?
      await Notifications.scheduleNotificationAsync({
        identifier: instanceId,
        content: {
          title: "Reminder",
          body: reminder.name,
          categoryIdentifier: CATEGORY_ALARM,
          data: {
            reminderId: reminder.id, // Keep base ID for syncing
            instanceIndex: index,
            reminderName: reminder.name,
          },
          vibrate: [200, 100, 200, 100, 200],
          sound: "alarm.wav",
          sticky: true,
          autoDismiss: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date,
          channelId: CHANNEL_ID,
        },
      });
      // console.log(`Scheduled reminder: ${reminder.name} (${instanceId})`);
    }
  }

  // 4. Cancel specific reminder (called when Sync received)
  async cancelReminder(reminderId: string) {
    // We must clean up all potential "unrolled" instances
    // Since we don't know exactly how many, we cancel by pattern or just a safe range
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(
        Notifications.cancelScheduledNotificationAsync(
          `reminder_${reminderId}_${i}`,
        ),
      );
    }
    // Also try the base ID just in case
    promises.push(
      Notifications.cancelScheduledNotificationAsync(`reminder_${reminderId}`),
    );

    await Promise.all(promises);

    // Dismiss from tray
    // Note: This requires knowing the specific ID in the tray.
    // In a real app, you might track "delivered" IDs in a local store.
    await Notifications.dismissAllNotificationsAsync();
  }

  async checkScheduled() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    // console.log(`You have ${scheduled.length} notifications scheduled.`);

    scheduled.forEach((notif) => {
      // console.log("ID:", notif.identifier);
      // console.log("Body:", notif.content.body);
      const trigger = notif.trigger;
      // console.log("Trigger:", trigger);

      // Fix: Safely access properties on union type
      if (trigger) {
        if ("type" in trigger) {
          console.log("Trigger Type:", (trigger as any).type);
        }
        if ("value" in trigger) {
          console.log("Date Time:", new Date((trigger as any).value));
        }
      }
    });
  }

  async deleteAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("All scheduled notifications have been cleared.");
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }
  // Helper to parse your comprlex metadata into Expo triggers
  private parseTrigger(
    reminder: ReminderResponse,
  ): Notifications.NotificationTriggerInput {
    const { frequency, start_datetime, time_of_day, weekdays } =
      reminder.repeat_metadata;

    // A. One-time event
    if (frequency === "once" && start_datetime) {
      const date = new Date(start_datetime);
      if (date.getTime() < Date.now()) return null; // Don't schedule past
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: date,
      } as Notifications.NotificationTriggerInput;
    }

    // B. Daily
    if (frequency === "daily" && time_of_day) {
      const parts = time_of_day.split(":");
      if (parts.length < 2) return null;
      const [hourStr, minuteStr] = parts;
      return {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
        repeats: true,
      } as Notifications.NotificationTriggerInput;
    }

    // C. Weekly
    if (
      frequency === "weekly" &&
      time_of_day &&
      weekdays &&
      weekdays.length > 0
    ) {
      const parts = time_of_day.split(":");
      if (parts.length < 2) return null;
      const [hourStr, minuteStr] = parts;

      // Expo uses 1=Sunday, 2=Monday... You need to map strings to ints
      const weekDay = this.mapDayToExpoFormat(weekdays[0]);

      return {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: weekDay,
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
        repeats: true,
      } as Notifications.NotificationTriggerInput;
    }

    // D. Monthly
    if (
      frequency === "monthly" &&
      time_of_day &&
      reminder.repeat_metadata.month_day
    ) {
      const parts = time_of_day.split(":");
      if (parts.length < 2) return null;
      const [hourStr, minuteStr] = parts;
      return {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        day: reminder.repeat_metadata.month_day,
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
        repeats: true,
      } as Notifications.NotificationTriggerInput;
    }

    // E. Yearly
    if (
      frequency === "yearly" &&
      time_of_day &&
      reminder.repeat_metadata.start_date
    ) {
      const parts = time_of_day.split(":");
      if (parts.length < 2) return null;
      const [hourStr, minuteStr] = parts;
      const startDate = new Date(reminder.repeat_metadata.start_date);
      return {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        day: startDate.getDate(),
        month: startDate.getMonth(),
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
        repeats: true,
      } as Notifications.NotificationTriggerInput;
    }

    return null;
  }

  // Helper: map "Monday" -> 2
  private mapDayToExpoFormat(day: string): number {
    const map: Record<string, number> = {
      sun: 1,
      mon: 2,
      tue: 3,
      wed: 4,
      thu: 5,
      fri: 6,
      sat: 7,
      sunday: 1,
      monday: 2,
      tuesday: 3,
      wednesday: 4,
      thursday: 5,
      friday: 6,
      saturday: 7,
    };
    return map[day?.toLowerCase()] || 1;
  }

  public getNotificationId(reminder: ReminderResponse) {
    // Fallback if ID is missing (for older versions)
    return `reminder_${reminder.id || reminder.name.replace(/\s/g, "")}`;
  }
}

export const notificationService = new NotificationService();
