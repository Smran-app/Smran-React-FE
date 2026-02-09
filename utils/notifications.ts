import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleReminderNotification(
  title: string,
  body: string,
  date: Date,
) {
  // Simple scheduling
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      interruptionLevel: "timeSensitive",
    },
    trigger: {
      date: date,
    } as any,
  });
}
