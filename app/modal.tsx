import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";
import { Ionicons } from "@expo/vector-icons";
import {
  Calendar,
  Flag,
  AlarmClock,
  Tag,
  MoreHorizontal,
  Mail,
  ChevronDown,
  ArrowUp,
} from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { CreateReminderPayload } from "@/api/reminders";
import { BlurView } from "expo-blur";
import { getCurrentUser, UserDetail } from "@/api/auth";

type RepeatType = "once" | "daily" | "weekly" | "monthly" | "yearly";
type EndsType = "never" | "on_date" | "after_occurrences";

export default function ModalScreen() {
  const router = useRouter();
  const { addReminder, isLoading } = useReminderStore();

  // Basic Info
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  // Time Section
  const [time, setTime] = useState(new Date());
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Repeat Section
  const [repeatType, setRepeatType] = useState<RepeatType>("once");

  // Specific settings based on repeatType
  const [startDate, setStartDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [interval, setInterval] = useState("1");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [monthlyOption, setMonthlyOption] = useState<"day" | "nth">("day");
  const [monthDay, setMonthDay] = useState(new Date().getDate().toString());
  const [nthWeekday, setNthWeekday] = useState<{
    n: number | "last";
    weekday: string;
  }>({
    n: 1,
    weekday: "Monday",
  });
  const [yearlyMonth, setYearlyMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );

  // Ends Section
  const [endsType, setEndsType] = useState<EndsType>("never");
  const [endDate, setEndDate] = useState(new Date());
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [occurrences, setOccurrences] = useState("10");

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getCurrentUser();
        setUserDetails(userDetails);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a reminder name");
      return;
    }

    const timeStr = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const repeat_metadata: any = {
      frequency: repeatType,
      time_of_day: timeStr,
      timezone: timezone,
    };

    if (repeatType === "once") {
      repeat_metadata.start_datetime = startDate.toISOString();
    } else {
      repeat_metadata.interval = parseInt(interval) || 1;

      if (repeatType === "weekly") {
        repeat_metadata.weekdays = selectedWeekdays;
      } else if (repeatType === "monthly") {
        if (monthlyOption === "day") {
          repeat_metadata.month_day = parseInt(monthDay);
        } else {
          repeat_metadata.nth_weekday = nthWeekday;
        }
      } else if (repeatType === "yearly") {
        repeat_metadata.month_day = parseInt(monthDay);
        // Backend might need month index or name, assuming simple mapping for now
      }

      // Handle Ends
      repeat_metadata.ends = endsType;
      if (endsType === "on_date") {
        repeat_metadata.end_date = endDate.toISOString();
      } else if (endsType === "after_occurrences") {
        repeat_metadata.occurrences = parseInt(occurrences);
      }
    }

    try {
      await addReminder({
        user_id: userDetails?.id || null,
        name,
        link: link.trim() || null,
        repeat_metadata,
      });
      router.back();
    } catch (err) {
      Alert.alert("Error", "Couldn't create reminder. Try again.");
    }
  };

  const toggleWeekday = (day: string) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <BlurView intensity={80} tint="light" style={styles.sheet}>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title Input */}
            <TextInput
              style={styles.titleInput}
              placeholder="Task name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#94a3b8"
              autoFocus
            />

            {/* Description / Link Input */}
            <TextInput
              style={styles.descriptionInput}
              placeholder="Description"
              value={link}
              onChangeText={setLink}
              placeholderTextColor="#cbd5e1"
              multiline
            />

            {/* Quick Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionChip,
                  repeatType !== "once" && styles.actionChipActive,
                ]}
                onPress={() => setTimePickerVisible(true)}
              >
                <Calendar
                  size={16}
                  color={repeatType !== "once" ? "#059669" : "#64748b"}
                />
                <Text
                  style={[
                    styles.actionChipText,
                    repeatType !== "once" && styles.actionChipTextActive,
                  ]}
                >
                  {repeatType === "once"
                    ? "Today"
                    : `${repeatType.charAt(0).toUpperCase() + repeatType.slice(1)}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionChip}>
                <Flag size={16} color="#64748b" />
                <Text style={styles.actionChipText}>Priority</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionChip}>
                <AlarmClock size={16} color="#64748b" />
                <Text style={styles.actionChipText}>Reminders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionChip}>
                <Tag size={16} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionChip}>
                <MoreHorizontal size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Area */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.projectSelector}>
              <Mail size={16} color="#64748b" />
              <Text style={styles.projectText}>Inbox</Text>
              <ChevronDown size={12} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!name.trim() || isLoading) && styles.submitBtnDisabled,
              ]}
              onPress={handleCreate}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ArrowUp size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Existing Pickers (Kept for functionality) */}
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={(date) => {
            setTime(date);
            setTimePickerVisible(false);
          }}
          onCancel={() => setTimePickerVisible(false)}
        />
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setStartDate(date);
            setDatePickerVisible(false);
          }}
          onCancel={() => setDatePickerVisible(false)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    minHeight: 220,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  content: {
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    padding: 0,
  },
  descriptionInput: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    padding: 0,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  actionChipActive: {
    borderColor: "#dcfce7",
    backgroundColor: "#f0fdf4",
  },
  actionChipText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  actionChipTextActive: {
    color: "#059669",
  },
  sheetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  projectSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  projectText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  submitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e11d48", // Todoist Red
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: "#fda4af",
    shadowOpacity: 0,
    elevation: 0,
  },
});
