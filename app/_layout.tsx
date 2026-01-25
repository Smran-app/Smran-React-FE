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
export default function RootLayout() {
  const colorScheme = useColorScheme();
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_ID,
    scopes: ["profile", "email"], // what API you want to access on behalf of the user, default is email and profile
    offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
    forceCodeForRefreshToken: false,
    iosClientId: process.env.EXPO_PUBLIC_IOS_ID,
  });
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
