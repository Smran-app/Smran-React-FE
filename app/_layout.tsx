import { Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { OnboardingProvider } from "@/app/contexts/OnboardingContext";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";
import ReceiveSharingIntent from "@apru2002/react-native-receive-sharing-intent";

const queryClient = new QueryClient();

function RootLayoutContent() {
  const { colorScheme } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      (data: any) => {
        console.log("RECEIVED_INTENT_LAYOUT", data);
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          // Check for text, subject, or weblink
          const text = item.text || item.subject || null;
          const weblink = item.weblink || null;

          if (text || weblink) {
            router.push({
              pathname: "/modal",
              params: {
                sharedTitle: text,
                sharedLink: weblink,
              },
            });
            ReceiveSharingIntent.clearReceivedFiles();
          }
        }
      },
      (err: any) => {
        console.log("ReceiveSharingIntent Error:", err);
      },
      "ShareIntent",
    );

    return () => {
      ReceiveSharingIntent.clearReceivedFiles();
    };
  }, []);

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
        <Stack.Screen
          name="reminderProfileScreen"
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

  const [fontsLoaded] = useFonts({
    "OpenSans-Regular": require("../assets/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-Medium": require("../assets/open-sans/OpenSans-Medium.ttf"),
    "OpenSans-Bold": require("../assets/open-sans/OpenSans-Bold.ttf"),
  });

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

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    // Platform-specific API keys
    const iosApiKey = "appl_dqlttnmGHSNrdgghvbXahITsDOT";
    const androidApiKey = "goog_LtyoeuxvFLeehvoHdVSpJaTHrRk";

    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: iosApiKey });
    } else if (Platform.OS === "android") {
      Purchases.configure({ apiKey: androidApiKey });
    }
  }, []);
  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <OnboardingProvider>
          <RootLayoutContent />
        </OnboardingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
