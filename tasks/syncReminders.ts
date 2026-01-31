import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { getReminders } from "@/api/reminders";
import {
  upsertReminders,
  getAllReminders,
} from "@/data/repositories/reminderRepository";
import { notificationService } from "@/utils/NotificationService";

const BACKGROUND_FETCH_TASK = "BACKGROUND_FETCH_REMINDERS";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // 1. Fetch from Backend
    // console.log("Background fetch: starting reminder sync...");
    const res = await getReminders();
    const remoteReminders = res?.data;

    // 2. Update Local DB
    if (remoteReminders) {
      await upsertReminders(remoteReminders);

      // 3. Schedule Notifications (optional, but good to refresh)
      // Note: Doing this in background might be heavy if many reminders,
      // but essential if new reminders came in.
      for (const r of remoteReminders) {
        try {
          await notificationService.scheduleReminder(r);
        } catch (ignored) {}
      }

      // console.log("Background fetch: sync completed", remoteReminders.length);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error("Background fetch failed:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundFetchTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false, // Continue even if app is killed
      startOnBoot: true, // Start on device boot
    });
    //   console.log("Background fetch registered");
  } catch (err) {
    console.error("Task Register failed:", err);
  }
};
