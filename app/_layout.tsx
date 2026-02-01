import { Stack } from "expo-router";
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import "./globals.css";
import { notificationService } from "@/utils/NotificationService";
import {
  registerBackgroundSyncTask,
  setupInteractionListeners,
} from "@/utils/BackgroundSync";
import { initDB } from "@/data/db";
import { registerBackgroundFetchTask } from "@/tasks/syncReminders";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";

function RootLayoutContent() {
  const { colorScheme } = useAppTheme();

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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
          options={{ presentation: "transparentModal", animation: "fade" }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_ID,
    scopes: ["profile", "email"],
    offlineAccess: true,
    forceCodeForRefreshToken: false,
    iosClientId: process.env.EXPO_PUBLIC_IOS_ID,
  });

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // 1. Init DB
    try {
      await initDB();
      // console.log("DB Initialized");
    } catch (e) {
      console.error("DB Init Failed", e);
    }

    // 2. Notifications & Sync
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Permission needed for alarms!");
      return;
    }
    await notificationService.registerCategories();
    registerBackgroundSyncTask(); // Push sync
    registerBackgroundFetchTask(); // Periodic sync
    setupInteractionListeners();
  };

  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
