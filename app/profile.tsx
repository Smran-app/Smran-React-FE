import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "@/components/GlassCard";
import { Colors } from "@/constants/Colors";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
export default function Profile() {
  const router = useRouter();

  const googleSignOut = async () => {
    try {
      // initiates sign out process
      await GoogleSignin.signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    // Navigate back to login
    await googleSignOut();
    router.replace("/login");
  };
  const handleGoBack = () => {
    router.back();
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color="#cbd5e1" />
          </View>
          <Text style={styles.userName}>Guest User</Text>
          <Text style={styles.userEmail}>guest@smran.app</Text>
        </View>

        <View style={styles.menuContainer}>
          <GlassCard style={styles.menuItem}>
            <TouchableOpacity style={styles.menuButton}>
              <View style={styles.menuRow}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={Colors.light.text}
                />
                <Text style={styles.menuText}>Settings</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.light.text}
              />
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.menuItem}>
            <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
              <View style={styles.menuRow}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                <Text style={[styles.menuText, { color: "#ef4444" }]}>
                  Log Out
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: Platform.select({ ios: "System", android: "Roboto" }),
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#64748b",
  },
  menuContainer: {
    gap: 16,
  },
  menuItem: {
    padding: 0, // Override default padding
    overflow: "hidden",
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
});
