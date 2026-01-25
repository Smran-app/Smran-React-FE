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

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    // Navigate to tabs after successful "login"
    router.replace("/(tabs)");
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
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleLogin}
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

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleLogin}
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
