import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Header } from "@/components/Header";
import { useReminderStore, Reminder } from "@/store/reminderStore";
import { useEffect, useState, useCallback } from "react";
import { getCurrentUser, UserDetail } from "@/api/auth";
import { TaskCard } from "@/components/TaskCard"; // Maybe reuse or create new simpler card?
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useAppTheme } from "@/context/ThemeContext";

const convertDateToMMDD = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString([], {
    month: "2-digit",
    day: "2-digit",
  });
};

// const convertAnyTimeOfDayToHHMM because sometimes it is returning HH:MM:SS and sometimes HH:MM
const convertAnyTimeOfDayToHHMM = (time_of_day: string) => {
  const dateObj = new Date(`2000-01-01T${time_of_day}:00`);
  return dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ManageScreen() {
  const router = useRouter();
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { reminders, isLoading, fetchAllReminders, deleteReminder } =
    useReminderStore();
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAllReminders();
    }, [fetchAllReminders]),
  );

  useEffect(() => {
    getCurrentUser().then(setUserDetails).catch(console.error);
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteReminder(id),
        },
      ],
    );
  };

  const handleEdit = (id: string) => {
    // Navigate to modal with ID to edit
    // Note: Modal needs to support editing mode.
    // For now I will assume passing ?id=... works or I will need to update Modal.
    // I recall checking modal code in previous turns (not this session), typical pattern is param.
    router.push({ pathname: "/modal", params: { id } });
  };

  const formatRepeatSummary = (metadata: any) => {
    // ... reuse logic from index.tsx or move to utils
    if (!metadata || Object.keys(metadata).length === 0) return "No repeat";
    const { frequency, time_of_day, start_datetime } = metadata;

    let timeStr = "";
    if (time_of_day) {
      try {
        timeStr = convertAnyTimeOfDayToHHMM(time_of_day);
      } catch (e) {
        timeStr = time_of_day;
      }
    }
    return `${frequency} ${time_of_day} ${frequency === "once" ? `on ${convertDateToMMDD(start_datetime)}` : ""}`; // Simplified for manage view
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: "600",
      marginVertical: 15,
    },
    listContent: {
      paddingBottom: 100,
    },
    cardContainer: {
      backgroundColor: isDark ? "#1e293b" : "#F1F5F9",
      borderRadius: 16,
      marginBottom: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: "#F1F5F9",
    },
    cardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    textContainer: {
      flex: 1,
      marginRight: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#F1F5F9" : "#1e293b",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: isDark ? "#F1F5F9" : "#64748b",
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    actionBtn: {
      padding: 8,
      backgroundColor: "#F8FAFC",
      borderRadius: 8,
    },
    emptyContainer: {
      alignItems: "center",
      marginTop: 50,
    },
    emptyText: {
      color: "#94a3b8",
      fontSize: 16,
    },
  });

  const renderItem = ({ item }: { item: Reminder }) => {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>
              {formatRepeatSummary(item.repeat_metadata)}
            </Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => handleEdit(item.id)}
              style={styles.actionBtn}
            >
              <Ionicons name="pencil" size={20} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.actionBtn}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <Header userDetails={userDetails} />
      <View style={styles.content}>
        <Text
          style={styles.screenTitle}
          className={`${isDark ? "text-white" : "#334155"}`}
        >
          Manage Reminders
        </Text>

        {isLoading && reminders.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={Colors.palette.lavender}
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={reminders}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reminders to manage</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
