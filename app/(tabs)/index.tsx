import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { TaskCard } from "@/components/TaskCard";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";
import { useEffect } from "react";
import { registerForPushNotificationsAsync } from "@/utils/notifications";

export default function DashboardScreen() {
  const router = useRouter();
  const { reminders, toggleReminder } = useReminderStore();

  useEffect(() => {
    // Request permissions on mount
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.flowerIcon}>
          <Ionicons name="flower" size={32} color={Colors.palette.skyBlue} />
        </View>
        <Text style={styles.headerTitle}>Smran</Text>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.greeting}>Good morning, xyz</Text>
        <Text style={styles.subGreeting}>Start your day</Text>

        <View style={styles.timelineWrapper}>
          {reminders.map((item, index) => {
            const timeString = new Date(item.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <TaskCard
                key={item.id}
                title={item.title}
                description={item.title} // Or description field if added
                time={timeString}
                isOn={item.isOn}
                onToggle={(val) => toggleReminder(item.id, val)}
                hasLink={!!item.link}
                image={item.isImage ? item.image : undefined}
                profileColor={
                  item.profile === "Important"
                    ? "#ef4444"
                    : item.profile === "Moderate"
                      ? Colors.palette.lavender
                      : Colors.palette.mint
                }
                isLast={index === reminders.length - 1}
              />
            );
          })}
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
    bottom: 110, // Above tab bar
    right: 20,
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
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 26,
    color: "#334155",
    marginBottom: 5,
  },
  subGreeting: {
    fontSize: 18,
    marginBottom: 30,
    color: "#64748B",
  },
  timelineWrapper: {
    paddingLeft: 10,
  },
});
