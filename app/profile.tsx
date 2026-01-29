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
import { getCurrentUser, UserDetail } from "@/api/auth";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/Skeleton";
import * as SecureStore from "expo-secure-store";
import { notificationService } from "@/utils/NotificationService";
export default function Profile() {
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
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
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("access");
  };
  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await getCurrentUser();
        console.log(user);
        setUserDetails(user);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, []);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userDetails?.profile_img_url ? (
              <Image
                source={{ uri: userDetails?.profile_img_url }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <Ionicons name="person-circle" size={100} color="#cbd5e1" />
            )}
          </View>
          <View style={styles.userName}>
            {userDetails ? (
              <Text style={styles.userNameText}>
                {userDetails?.first_name + " " + userDetails?.last_name}
              </Text>
            ) : (
              <Skeleton width={150} height={28} borderRadius={4} />
            )}
          </View>
          <View style={styles.userEmail}>
            {userDetails ? (
              <Text style={styles.userEmailText}>{userDetails?.email}</Text>
            ) : (
              <Skeleton
                width={200}
                height={20}
                borderRadius={4}
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        </View>

        <View style={styles.menuContainer}>
          <GlassCard style={styles.menuItem}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={async () => {
                // notificationService.deleteAllScheduledNotifications();
                const device_id = await SecureStore.getItemAsync("device_id");
                console.log(device_id);
              }}
            >
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
    fontSize: 24,
    fontWeight: "500",
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
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
  },
  userEmail: {
    marginTop: 4,
  },
  userEmailText: {
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
