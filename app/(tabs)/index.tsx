import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/context/ThemeContext";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { TaskCard } from "@/components/TaskCard";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";
import { Header } from "@/components/Header";
import { useEffect, useState, useCallback, useMemo } from "react";
import { groupRemindersByDate } from "@/utils/dateUtils";
import { EmptyState } from "@/components/EmptyState";
import { BlurView } from "expo-blur";

import { registerForPushNotificationsAsync } from "@/utils/notifications";
import logo from "@/assets/adaptive-icon.png";
import { getCurrentUser, UserDetail } from "@/api/auth";
import { Skeleton } from "@/components/Skeleton";
import { notificationService } from "@/utils/NotificationService";
import * as SecureStore from "expo-secure-store";

export default function DashboardScreen() {
  const router = useRouter();
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { reminders, isLoading, fetchHomeReminders, toggleReminder } =
    useReminderStore();
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchHomeReminders();
    }, [fetchHomeReminders]),
  );

  useEffect(() => {
    // Request permissions on mount
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await getCurrentUser();
        setUserDetails(user);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, []);

  const formatRepeatSummary = (metadata: any) => {
    if (!metadata || Object.keys(metadata).length === 0) return "No repeat";
    const { frequency, time_of_day, start_datetime } = metadata;

    let timeStr = "";
    if (time_of_day) {
      try {
        timeStr = new Date(`2000-01-01T${time_of_day}:00`).toLocaleTimeString(
          [],
          {
            hour: "numeric",
            minute: "2-digit",
          },
        );
      } catch (e) {
        timeStr = time_of_day;
      }
    }

    if (frequency === "once") {
      const date = start_datetime ? new Date(start_datetime) : new Date();
      return `One time on ${date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      })}${timeStr ? ` at ${timeStr}` : ""}`;
    }

    if (frequency === "daily") {
      const interval = metadata.interval || 1;
      return interval === 1
        ? `Daily${timeStr ? ` at ${timeStr}` : ""}`
        : `Every ${interval} days${timeStr ? ` at ${timeStr}` : ""}`;
    }

    if (frequency === "weekly") {
      const weekdays =
        metadata.weekdays || metadata.days || metadata.days_of_week || [];
      return `Weekly on ${weekdays.join(", ")}${timeStr ? ` at ${timeStr}` : ""}`;
    }

    if (frequency === "monthly") {
      return `Monthly${timeStr ? ` at ${timeStr}` : ""}`;
    }

    if (frequency === "yearly") {
      return `Yearly${timeStr ? ` at ${timeStr}` : ""}`;
    }

    return `${frequency}${timeStr ? ` at ${timeStr}` : ""}`;
  };

  const sections = useMemo(() => groupRemindersByDate(reminders), [reminders]);

  const themedStyles = useMemo(() => {
    return {
      sectionHeader: {
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.4)"
          : "rgba(255, 255, 255, 0.4)",
      },
      sectionTitle: {
        color: isDark ? Colors.dark.text : "#1e293b",
      },
      sectionDate: {
        color: isDark ? "#A1A1AA" : "#64748b",
      },
    };
  }, [isDark]);

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <Header userDetails={userDetails} />

      <View style={styles.content}>
        {isLoading && reminders.length === 0 ? (
          <View className="gap-4 px-4 mt-4">
            <Skeleton width="100%" height={100} borderRadius={16} />
            <Skeleton width="100%" height={100} borderRadius={16} />
            <Skeleton width="100%" height={100} borderRadius={16} />
          </View>
        ) : sections.length === 0 ? (
          <EmptyState />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 160,
              // paddingHorizontal: 10,
            }}
            stickySectionHeadersEnabled={Platform.OS === "ios" ? true : false}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }) => (
              <BlurView
                intensity={Platform.OS === "ios" ? 40 : 0}
                tint={isDark ? "dark" : "light"}
                style={[styles.sectionHeader]}
                className={`${
                  section === sections[0]
                    ? "border-t-0"
                    : `border-t-[0.5px] ${isDark ? "border-t-[#334155]" : "border-t-[#cbd5e1]"}`
                }`}
              >
                {section.title && (
                  <Text
                    style={[styles.sectionTitle, themedStyles.sectionTitle]}
                  >
                    {section.title}
                  </Text>
                )}
                <Text
                  style={[styles.sectionDate, themedStyles.sectionDate]}
                  className={`${section.title === "" ? "py-3" : ""}`}
                >
                  {section.dateString}
                </Text>
              </BlurView>
            )}
            renderItem={({ item, index, section }) => {
              let timeString = "--:--";
              if (item.next_run_time) {
                const nextRun = new Date(item.next_run_time);
                timeString = nextRun.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } else if (item.repeat_metadata?.time_of_day) {
                try {
                  timeString = new Date(
                    `2000-01-01T${item.repeat_metadata.time_of_day}:00`,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch (e) {}
              }

              const displayTitle =
                item.name || item.link_metadata?.title || "Untitled Reminder";
              const displayDesc = formatRepeatSummary(item.repeat_metadata);
              return (
                <TaskCard
                  title={displayTitle}
                  frequency={item.repeat_metadata.frequency}
                  description={item.description || ""}
                  time={timeString}
                  isOn={item.status === "active"}
                  onToggle={() => toggleReminder(item.id, item.status)}
                  hasLink={!!item.link}
                  image={
                    item.link_metadata?.image
                      ? { uri: item.link_metadata.image }
                      : undefined
                  }
                  profileColor={Colors.palette.lavender}
                  isFirst={index === 0}
                  isLast={index === section.data.length - 1}
                />
              );
            }}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        className={`${isDark ? "bg-[#6EE7B7]" : "bg-[#7DD3FC]"}`}
        onPress={() => router.push("/modal")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  fab: {
    position: "absolute",
    bottom: 130, // Above tab bar
    right: 30,
    width: 56,
    height: 56,
    zIndex: 10,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    // marginBottom: 10,
  },
  flowerIcon: {
    shadowColor: Colors.palette.skyBlue,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "System",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9F9FB",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    // paddingHorizontal: 10,
  },
  greeting: {
    marginBottom: 5,
    minHeight: 32,
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 26,
    color: "#334155",
  },
  subGreeting: {
    fontSize: 18,
    marginBottom: 30,
    color: "#64748B",
  },
  timelineWrapper: {
    // paddingLeft: 10,
  },
  sectionHeader: {
    paddingVertical: 12, // Increased padding for better glass surface
    paddingHorizontal: 16,
    zIndex: 100,
    marginBottom: 4, // Reduced margin to feel more integrated
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "500",
  },
  sectionDate: {
    fontSize: 16,
    fontWeight: "500",
  },
});
