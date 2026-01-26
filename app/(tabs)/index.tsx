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
import logo from "@/assets/adaptive-icon.png";
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
        <View className="flex flex-row items-center gap-3">
          <Image source={logo} className="w-14 h-14" />
          <Text className="text-3xl font-medium">Smran</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person" size={20} color="#394867" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex px-4">
          <Text style={styles.greeting}>Good morning, Anish</Text>
          <Text style={styles.subGreeting}>Start your day</Text>
        </View>

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
                isFirst={index === 0}
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
    backgroundColor: "#F9F9FB",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
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
    // paddingLeft: 10,
  },
});
