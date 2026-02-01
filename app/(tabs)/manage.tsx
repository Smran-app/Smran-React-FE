import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { ScreenWrapper } from "@/components/ScreenWrapper";
import { TaskCard } from "@/components/TaskCard";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";
import { useState, useCallback, useMemo } from "react";
import { groupRemindersByDate } from "@/utils/dateUtils";

import logo from "@/assets/adaptive-icon.png";
import { Skeleton } from "@/components/Skeleton";

export default function ManageScreen() {
  const router = useRouter();
  const { reminders, isLoading, fetchAllReminders, toggleReminder } =
    useReminderStore();

  useFocusEffect(
    useCallback(() => {
      fetchAllReminders();
    }, [fetchAllReminders]),
  );

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

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View className="flex flex-row items-center gap-3">
          <Image source={logo} className="w-14 h-14" />
          <Text className="text-3xl font-medium">Manage</Text>
        </View>
      </View>

      <View style={styles.content}>
        {isLoading && reminders.length === 0 ? (
          <View className="gap-4 px-4 mt-4">
            <Skeleton width="100%" height={100} borderRadius={16} />
            <Skeleton width="100%" height={100} borderRadius={16} />
            <Skeleton width="100%" height={100} borderRadius={16} />
          </View>
        ) : sections.length === 0 ? (
          <View className="flex items-center justify-center pt-20">
            <Ionicons name="albums-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-4 text-lg">
              No reminders found
            </Text>
            <Text className="text-slate-300">Your collection is empty</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 120,
              paddingHorizontal: 10,
            }}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
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
                  isFirst={index === 0}
                  isLast={index === section.data.length - 1}
                />
              );
            }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
});
