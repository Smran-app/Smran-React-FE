import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { ScreenWrapper } from "@/components/ScreenWrapper";
import { TaskCard } from "@/components/TaskCard";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";
import { useEffect, useState, useCallback } from "react";

import { registerForPushNotificationsAsync } from "@/utils/notifications";
import logo from "@/assets/adaptive-icon.png";
import { getCurrentUser, UserDetail } from "@/api/auth";
import { Skeleton } from "@/components/Skeleton";
import { notificationService } from "@/utils/NotificationService";
import * as SecureStore from "expo-secure-store";
export default function DashboardScreen() {
  const router = useRouter();
  const { reminders, isLoading, fetchReminders, toggleReminder } =
    useReminderStore();
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
    }, [fetchReminders]),
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

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View className="flex flex-row items-center gap-3">
          <Image source={logo} className="w-14 h-14" />
          <Text className="text-3xl font-medium">Smran</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {
            router.push("/profile");
            notificationService.checkScheduled();
          }}
        >
          {!userDetails ? (
            <Skeleton width={40} height={40} borderRadius={20} />
          ) : userDetails.profile_img_url ? (
            <Image
              source={{ uri: userDetails.profile_img_url }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <Ionicons name="person" size={20} color="#394867" />
          )}
        </TouchableOpacity>
      </View>
      <View className="flex px-8">
        <View style={styles.greeting}>
          {userDetails ? (
            <Text style={styles.greetingText}>
              {/* Today's date in Wed, July 10 */}
              {new Date().toLocaleDateString([], {
                weekday: "long",
              })}
            </Text>
          ) : (
            <Skeleton width={200} height={32} borderRadius={4} />
          )}
          <Text style={styles.subGreeting}>
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.timelineWrapper}>
          {isLoading ? (
            <View className="gap-4 px-4">
              <Skeleton width="100%" height={100} borderRadius={16} />
              <Skeleton width="100%" height={100} borderRadius={16} />
              <Skeleton width="100%" height={100} borderRadius={16} />
            </View>
          ) : reminders.length === 0 ? (
            <View className="flex items-center justify-center pt-20">
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color="#cbd5e1"
              />
              <Text className="text-slate-400 mt-4 text-lg">
                No reminders found
              </Text>
              <Text className="text-slate-300">Tap + to create one</Text>
            </View>
          ) : (
            reminders.map((item, index) => {
              let timeString = "--:--";
              if (item.next_run_time) {
                const nextRun = new Date(item.next_run_time);
                timeString = nextRun.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } else if (item.repeat_metadata?.time_of_day) {
                // Fallback to time_of_day if next_run_time is missing
                try {
                  timeString = new Date(
                    `2000-01-01T${item.repeat_metadata.time_of_day}:00`,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch (e) {}
              }

              // Decide what to show as the main title and description
              const displayTitle =
                item.name || item.link_metadata?.title || "Untitled Reminder";
              const displayDesc = formatRepeatSummary(item.repeat_metadata);

              return (
                <TaskCard
                  key={item.id}
                  title={displayTitle}
                  description={displayDesc}
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
                  isLast={index === reminders.length - 1}
                  isFirst={index === 0}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
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
    borderRadius: 28,
    backgroundColor: Colors.palette.lavender,
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
    marginBottom: 20,
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
    paddingHorizontal: 10,
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
});
