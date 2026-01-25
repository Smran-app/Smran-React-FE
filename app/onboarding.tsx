import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { GlassCard } from "@/components/GlassCard";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export default function Onboarding() {
  const router = useRouter();

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons
            name="flower"
            size={60}
            color={Colors.palette.lavender}
            style={styles.logoIcon}
          />
          <Text style={styles.logoText}>Smran</Text>
        </View>

        <View style={styles.middleContainer}>
          <Text style={styles.headline}>Say hello to Smran,</Text>
          <Text style={styles.headline}>Never lets you</Text>
          <Text style={[styles.headline, styles.highlight]}>forget</Text>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.buttonText}>Get started</Text>
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
    // Multi-color emulation via text color is limited, using lavender for now
    shadowColor: Colors.palette.skyBlue,
    shadowRadius: 10,
    shadowOpacity: 0.5,
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
    fontFamily: Platform.select({ ios: "System", android: "Roboto" }), // Title font
  },
  highlight: {
    fontWeight: "bold",
  },
  bottomContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "serif", // "Use 'Serif' specifically for the 'Get started' onboarding text"
  },
});
