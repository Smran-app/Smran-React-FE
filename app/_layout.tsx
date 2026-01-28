import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  GoogleSignin,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import "./globals.css";
import { notificationService } from "@/utils/NotificationService";
import {
  registerBackgroundSyncTask,
  setupInteractionListeners,
} from "@/utils/BackgroundSync";
import * as Notifications from "expo-notifications";
import { getReminders, ReminderResponse } from "@/api/reminders";
import { useEffect } from "react";
export default function RootLayout() {
  const colorScheme = useColorScheme();
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_ID,
    scopes: ["profile", "email"], // what API you want to access on behalf of the user, default is email and profile
    offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
    forceCodeForRefreshToken: false,
    iosClientId: process.env.EXPO_PUBLIC_IOS_ID,
  });

  useEffect(() => {
    initNotifications();
  }, []);

  const initNotifications = async () => {
    // 1. Request Permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Permission needed for alarms!");
      return;
    }

    // 2. Setup Categories (Buttons)
    await notificationService.registerCategories();

    // 3. Register Background Tasks & Listeners
    registerBackgroundSyncTask();
    setupInteractionListeners();

    // 4. Initial Fetch
    // refreshReminders();
  };

  const refreshReminders = async () => {
    try {
      // Mock data based on your JSON
      const reminders: ReminderResponse[] = await getReminders();
      console.log(`Fetched ${reminders.length} reminders`);

      // Schedule all of them (Service handles deduping/updates via ID)
      for (const r of reminders) {
        try {
          console.log(`Scheduling reminder: ${r.name} (${r.id})`);
          await notificationService.scheduleReminder(r);
        } catch (innerError) {
          console.error(`Failed to schedule reminder ${r.id}:`, innerError);
        }
      }
    } catch (e) {
      console.log("Error fetching", e);
    }
  };
  return (
    // <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerTitle: "New Reminder" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
