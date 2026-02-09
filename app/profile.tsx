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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassCard } from "@/components/GlassCard";
import RevenueCatUI from "react-native-purchases-ui";
import { Colors } from "@/constants/Colors";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getCurrentUser, UserDetail } from "@/api/auth";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/Skeleton";
import { notificationService } from "@/utils/NotificationService";
import { useAppTheme } from "@/context/ThemeContext";
import { Modal } from "react-native";
import { useReminderStore } from "@/store/reminderStore";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import Purchases, {
  PurchasesOffering,
  PurchasesOfferings,
} from "react-native-purchases";
export default function Profile() {
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const { theme, setTheme, colorScheme } = useAppTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const {
    clearReminders,
    isPro,
    checkPremiumStatus: checkStorePremiumStatus,
  } = useReminderStore();
  const googleSignOut = async () => {
    try {
      // initiates sign out process
      await GoogleSignin.signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const appleSignOut = async () => {
    try {
      const apple_user_id = await SecureStore.getItemAsync("apple_user_id");
      if (apple_user_id) {
        await AppleAuthentication.signOutAsync({ user: apple_user_id });
      } else {
        console.warn("No apple_user_id found for signOutAsync");
      }
    } catch (error) {
      console.error("Apple signOutAsync error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const provider = await SecureStore.getItemAsync("auth");
      if (provider === "google") {
        await googleSignOut();
      } else if (provider === "apple") {
        await appleSignOut();
      }

      // Clear all session data
      await SecureStore.deleteItemAsync("user");
      await SecureStore.deleteItemAsync("access");
      await SecureStore.deleteItemAsync("auth");
      await SecureStore.deleteItemAsync("apple_user_id");
      await SecureStore.deleteItemAsync("has_completed_onboarding");

      // flush local db
      await clearReminders();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  const handleGoBack = () => {
    router.back();
  };
  async function getOfferings() {
    const offerings = await Purchases.getOfferings();
    if (
      offerings.current !== null &&
      offerings.current.availablePackages.length !== 0
    ) {
      setOfferings(offerings);
    }
    // console.log("📢 offerings", JSON.stringify(offerings, null, 2));
  }

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // Replace 'pro_access' with your specific Entitlement ID from RevenueCat dashboard
      // return customerInfo.entitlements.active['pro_access'] !== undefined;
      console.log("📢 customerInfo", customerInfo);
    } catch (e) {
      return false;
    }
  };
  useEffect(() => {
    // getOfferings();
    checkStorePremiumStatus();
  }, []);
  const handleBuyPro = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      console.log("Offerings:", offerings);
      const current_offering = offerings.current as PurchasesOffering;
      const result = await RevenueCatUI.presentPaywall({
        offering: current_offering,
      });
      console.log("Paywall result:", result);
    } catch (error) {
      console.error("Error presenting paywall:", error);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await SecureStore.getItemAsync("user");
        if (user) {
          setUserDetails(JSON.parse(user));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await getCurrentUser();
        setUserDetails(user);
        await SecureStore.setItemAsync("user", JSON.stringify(user));
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
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? Colors.dark.text : "#1e293b"}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.title,
              { color: isDark ? Colors.dark.text : "#1e293b" },
            ]}
          >
            Profile
          </Text>
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
              <Text
                style={[
                  styles.userNameText,
                  { color: isDark ? Colors.dark.text : "#1e293b" },
                ]}
              >
                {userDetails?.first_name + " " + userDetails?.last_name}
                {isPro && (
                  <MaterialCommunityIcons
                    name="crown"
                    size={20}
                    color="#eab308"
                    style={{ marginLeft: 8 }}
                  />
                )}
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
              onPress={() => setShowThemeModal(true)}
            >
              <View style={styles.menuRow}>
                <Ionicons
                  name="color-palette-outline"
                  size={24}
                  color={isDark ? Colors.dark.text : Colors.light.text}
                />
                <Text
                  style={[
                    styles.menuText,
                    { color: isDark ? Colors.dark.text : "#1e293b" },
                  ]}
                >
                  Appearance ({theme.charAt(0).toUpperCase() + theme.slice(1)})
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? Colors.dark.text : Colors.light.text}
              />
            </TouchableOpacity>
          </GlassCard>

          {!isPro && (
            <GlassCard
              style={[
                styles.menuItem,
                {
                  backgroundColor: isDark
                    ? "rgba(234, 179, 8, 0.15)"
                    : "rgba(234, 179, 8, 0.1)",
                  borderColor: "#eab308",
                },
              ]}
            >
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleBuyPro}
              >
                <View style={styles.menuRow}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={24}
                    color="#eab308"
                  />
                  <Text
                    style={[
                      styles.menuText,
                      { color: isDark ? "#fde047" : "#854d0e" },
                    ]}
                  >
                    Buy Smran Pro
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={isDark ? "#fde047" : "#854d0e"}
                />
              </TouchableOpacity>
            </GlassCard>
          )}

          <GlassCard style={styles.menuItem}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => router.push("/reminderProfileScreen")}
            >
              <View style={styles.menuRow}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDark ? Colors.dark.text : Colors.light.text}
                />
                <Text
                  style={[
                    styles.menuText,
                    { color: isDark ? Colors.dark.text : "#1e293b" },
                  ]}
                >
                  Manage Reminder Profile
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? Colors.dark.text : Colors.light.text}
              />
            </TouchableOpacity>
          </GlassCard>

          {/* <GlassCard style={styles.menuItem}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={async () => {
                // notificationService.deleteAllScheduledNotifications();
                const device_id = await SecureStore.getItemAsync("device_id");
                // console.log(device_id);
              }}
            >
              <View style={styles.menuRow}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={isDark ? Colors.dark.text : Colors.light.text}
                />
                <Text
                  style={[
                    styles.menuText,
                    { color: isDark ? Colors.dark.text : "#1e293b" },
                  ]}
                >
                  Settings
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? Colors.dark.text : Colors.light.text}
              />
            </TouchableOpacity>
          </GlassCard> */}

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

        <Modal
          visible={showThemeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThemeModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowThemeModal(false)}
          >
            <View
              className={`rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <View className="flex-row items-center p-4 justify-between border-b border-gray-200">
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? Colors.dark.text : "#1e293b" },
                  ]}
                >
                  Select Theme
                </Text>
                <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDark ? Colors.dark.text : Colors.light.text}
                  />
                </TouchableOpacity>
              </View>
              <View className="p-5">
                {(["system", "light", "dark"] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={styles.themeOption}
                    onPress={() => {
                      setTheme(mode);
                      setShowThemeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: isDark ? Colors.dark.text : "#1e293b" },
                        theme === mode && styles.themeOptionActive,
                      ]}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                    {theme === mode && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.light.tint}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    // padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  themeOptionText: {
    fontSize: 16,
  },
  themeOptionActive: {
    color: Colors.light.tint,
    fontWeight: "600",
  },
});
