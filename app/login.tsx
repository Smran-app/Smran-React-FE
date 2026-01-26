import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import logo from "@/assets/adaptive-icon.png";
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import * as SecureStore from "expo-secure-store";
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_ID,
  scopes: ["profile", "email"], // what API you want to access on behalf of the user, default is email and profile
  offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  forceCodeForRefreshToken: false,
  iosClientId: process.env.EXPO_PUBLIC_IOS_ID,
});

import { loginWithBackend } from "@/api/auth";

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    // Navigate to tabs after successful "login"
    router.replace("/(tabs)");
  };
  const GoogleLogin = async () => {
    // check if users' device has google play services
    await GoogleSignin.hasPlayServices();

    // initiates signIn process
    const userInfo = await GoogleSignin.signIn();
    return userInfo;
  };

  const handleLoginWithBackend = async (
    idToken: string,
    provider: "google" | "apple",
  ) => {
    try {
      const deviceToken = await registerForPushNotificationsAsync();
      const data = await loginWithBackend(
        idToken,
        provider,
        deviceToken || "unknown_device_token",
      );

      console.log(`${provider} Login Success:`, data);
      await SecureStore.setItemAsync("access", data.access_token);
      router.replace("/(tabs)");
    } catch (error) {
      console.error(`${provider} Login Error:`, error);
      // Handle error appropriately, maybe show an alert to the user
    }
  };

  const googleSignIn = async () => {
    try {
      const response = await GoogleLogin();

      // retrieve user data
      const { idToken, user } = response.data ?? {};
      if (idToken) {
        console.log("User Data", user);
        console.log("Id Token", idToken);
        await handleLoginWithBackend(idToken, "google");
      }
    } catch (error) {
      console.log("Error", error);
    }
  };
  const handleSignInApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // signed in
      console.log(credential);
      if (credential.identityToken) {
        await handleLoginWithBackend(credential.identityToken, "apple");
      }
      // sample response provided below
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        console.log("User canceled the sign-in flow");
        // handle that the user canceled the sign-in flow
      } else {
        console.log("Other error");
        // handle other errors
      }
    }
  };
  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logoIcon} />
          <Text style={styles.logoText}>Smran</Text>
        </View>

        <View style={styles.middleContainer}>
          <Text style={styles.headline}>Welcome back,</Text>
          <Text style={styles.subHeadline}>
            Sign in to continue using Smran
          </Text>
        </View>

        <View style={styles.bottomContainer}>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.button, styles.appleButton]}
              onPress={handleSignInApple}
            >
              <Ionicons
                name="logo-apple"
                size={24}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, styles.appleButtonText]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}
          {/* <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={5}
            style={{
              width: 200,
              height: 44,
            }}
            onPress={async () => {
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                });
                console.log("Apple Sign In", credential);
                // signed in
              } catch (e: any) {
                if (e.code === "ERR_REQUEST_CANCELED") {
                  // handle that the user canceled the sign-in flow
                } else {
                  // handle other errors
                }
              }
            }}
          /> */}

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={googleSignIn}
          >
            <Ionicons
              name="logo-google"
              size={24}
              color="black"
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, styles.googleButtonText]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 60,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logoIcon: {
    width: 90,
    height: 90,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 10,
    color: "#1e293b",
    fontFamily: Platform.select({ ios: "System", android: "Roboto" }),
  },
  middleContainer: {
    marginBottom: 40,
  },
  headline: {
    fontSize: 34,
    color: "#1e293b",
    marginBottom: 8,
    fontFamily: Platform.select({ ios: "System", android: "Roboto" }),
    fontWeight: "600",
  },
  subHeadline: {
    fontSize: 18,
    color: "#64748b",
    fontFamily: Platform.select({ ios: "System", android: "Roboto" }),
  },
  bottomContainer: {
    gap: 16,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  appleButton: {
    backgroundColor: "#000",
  },
  appleButtonText: {
    color: "#fff",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  googleButtonText: {
    color: "#000",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: "System", android: "Roboto" }),
  },
});
