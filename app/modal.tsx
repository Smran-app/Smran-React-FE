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
  Switch,
  LayoutAnimation,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useReminderStore } from "@/store/reminderStore";
import {
  Calendar,
  Flag,
  AlarmClock,
  Tag,
  MoreHorizontal,
  Mail,
  ChevronDown,
  ArrowUp,
  X,
  Repeat,
  RotateCw,
} from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { BlurView } from "expo-blur";
import { getCurrentUser, UserDetail } from "@/api/auth";

type RepeatType = "once" | "daily" | "weekly" | "monthly" | "yearly";
type EndsType = "never" | "on_date" | "after_occurrences";
type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export default function ModalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addReminder, updateReminder, reminders, isLoading } =
    useReminderStore();

  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Time Section
  const [time, setTime] = useState(new Date());
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Repeat Section
  const [showRepeatSettings, setShowRepeatSettings] = useState(false);
  const [repeatType, setRepeatType] = useState<RepeatType>("once");
  const [startDate, setStartDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [interval, setInterval] = useState("1");
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);

  // Ends Section
  const [endsType, setEndsType] = useState<EndsType>("never");
  const [endDate, setEndDate] = useState(new Date());
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [occurrences, setOccurrences] = useState("10");

  const weekdaysList: { label: string; value: Weekday }[] = [
    { label: "M", value: "mon" },
    { label: "T", value: "tue" },
    { label: "W", value: "wed" },
    { label: "T", value: "thu" },
    { label: "F", value: "fri" },
    { label: "S", value: "sat" },
    { label: "S", value: "sun" },
  ];

  useEffect(() => {
    getCurrentUser().then(setUserDetails).catch(console.error);

    // Set default next hour
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    setTime(d);

    if (id) {
      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        setName(reminder.name);
        setLink(reminder.link || "");

        const meta = reminder.repeat_metadata;
        setRepeatType(meta.frequency);

        if (meta.time_of_day) {
          const [hours, mins] = meta.time_of_day.split(":").map(Number);
          const t = new Date();
          t.setHours(hours, mins, 0, 0);
          setTime(t);
        }

        if (meta.start_date) setStartDate(new Date(meta.start_date));
        if (meta.start_datetime) setStartDate(new Date(meta.start_datetime));

        if (meta.interval) setInterval(meta.interval.toString());
        if (meta.weekdays) setSelectedWeekdays(meta.weekdays);

        if (meta.ends) setEndsType(meta.ends);
        if (meta.end_date) setEndDate(new Date(meta.end_date));
        if (meta.occurrences) setOccurrences(meta.occurrences.toString());
      }
    }
  }, [id, reminders]); // Added dependencies

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
      // For "once", we typically just need start_datetime or date + time
      // Using start_datetime for consistency
      const start = new Date(startDate);
      const [hours, mins] = timeStr.split(":").map(Number);
      start.setHours(hours, mins, 0, 0);
      repeat_metadata.start_datetime = start.toISOString();
    } else {
      repeat_metadata.interval = parseInt(interval) || 1;
      repeat_metadata.start_date = startDate.toISOString().split("T")[0];

      if (repeatType === "weekly" && selectedWeekdays.length > 0) {
        repeat_metadata.weekdays = selectedWeekdays;
      }

      // Ends Rule
      repeat_metadata.ends = endsType;
      if (endsType === "on_date") {
        repeat_metadata.end_date = endDate.toISOString().split("T")[0];
      } else if (endsType === "after_occurrences") {
        repeat_metadata.occurrences = parseInt(occurrences);
      }
    }

    try {
      const payload = {
        user_id: userDetails?.id || null,
        name,
        link: link.trim() || null,
        repeat_metadata,
      };

      if (id) {
        await updateReminder(id, payload);
      } else {
        await addReminder(payload);
      }
      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        `Couldn't ${id ? "update" : "create"} reminder. Try again.`,
      );
    }
  };

  const toggleWeekday = (day: Weekday) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleRepeatSettings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowRepeatSettings(!showRepeatSettings);
    if (!showRepeatSettings && repeatType === "once") {
      setRepeatType("daily"); // Default to daily when opening settings if curr is once
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        style={styles.keyboardView}
      >
        <BlurView intensity={80} tint="light" style={styles.sheet}>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Title */}
            <TextInput
              style={styles.titleInput}
              placeholder="Task name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#94a3b8"
              autoFocus
            />

            {/* Description */}
            <TextInput
              style={styles.descriptionInput}
              placeholder="Description"
              value={link}
              onChangeText={setLink}
              placeholderTextColor="#cbd5e1"
              multiline
            />

            {/* Chips Row */}
            <View style={styles.actionRow}>
              {/* Date/Time Chip */}
              <TouchableOpacity
                style={[
                  styles.actionChip,
                  repeatType !== "once" && styles.actionChipActive,
                ]}
                onPress={() => setDatePickerVisible(true)}
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
                  {startDate.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                  {repeatType !== "once" ? ` • ${repeatType}` : ""}
                </Text>
              </TouchableOpacity>

              {/* Time Chip */}
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => setTimePickerVisible(true)}
              >
                <AlarmClock size={16} color="#64748b" />
                <Text style={styles.actionChipText}>
                  {time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>

              {/* Repeat Toggle Chip */}
              <TouchableOpacity
                style={[
                  styles.actionChip,
                  showRepeatSettings && styles.actionChipActive,
                ]}
                onPress={toggleRepeatSettings}
              >
                <RotateCw
                  size={16}
                  color={showRepeatSettings ? "#059669" : "#64748b"}
                />
                <Text
                  style={[
                    styles.actionChipText,
                    showRepeatSettings && styles.actionChipTextActive,
                  ]}
                >
                  Repeat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionChip}>
                <Flag size={16} color="#64748b" />
                <Text style={styles.actionChipText}>Priority</Text>
              </TouchableOpacity>
            </View>

            {/* Advanced Repeat Settings */}
            {showRepeatSettings && (
              <View style={styles.settingsPanel}>
                {/* Frequency */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.freqRow}
                >
                  {(
                    ["daily", "weekly", "monthly", "yearly"] as RepeatType[]
                  ).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.freqOption,
                        repeatType === freq && styles.freqOptionSelected,
                      ]}
                      onPress={() => setRepeatType(freq)}
                    >
                      <Text
                        style={[
                          styles.freqText,
                          repeatType === freq && styles.freqTextSelected,
                        ]}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Interval */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Every</Text>
                  <TextInput
                    style={styles.intervalInput}
                    value={interval}
                    onChangeText={setInterval}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.settingLabel}>
                    {repeatType === "daily"
                      ? "days"
                      : repeatType === "weekly"
                        ? "weeks"
                        : repeatType === "monthly"
                          ? "months"
                          : "years"}
                  </Text>
                </View>

                {/* Weekdays (Only for Weekly) */}
                {repeatType === "weekly" && (
                  <View style={styles.weekdaysRow}>
                    {weekdaysList.map((d) => (
                      <TouchableOpacity
                        key={d.value}
                        style={[
                          styles.weekdayBtn,
                          selectedWeekdays.includes(d.value) &&
                            styles.weekdayBtnSelected,
                        ]}
                        onPress={() => toggleWeekday(d.value)}
                      >
                        <Text
                          style={[
                            styles.weekdayText,
                            selectedWeekdays.includes(d.value) &&
                              styles.weekdayTextSelected,
                          ]}
                        >
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Ends Rule */}
                <View style={styles.settingCol}>
                  <Text style={styles.subHeader}>Ends</Text>
                  <View style={styles.endsRow}>
                    <TouchableOpacity
                      onPress={() => setEndsType("never")}
                      style={[
                        styles.endsOption,
                        endsType === "never" && styles.endsOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.endsText,
                          endsType === "never" && styles.endsTextSelected,
                        ]}
                      >
                        Never
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setEndsType("on_date");
                        setEndDatePickerVisible(true);
                      }}
                      style={[
                        styles.endsOption,
                        endsType === "on_date" && styles.endsOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.endsText,
                          endsType === "on_date" && styles.endsTextSelected,
                        ]}
                      >
                        {endsType === "on_date"
                          ? endDate.toLocaleDateString()
                          : "On Date"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setEndsType("after_occurrences")}
                      style={[
                        styles.endsOption,
                        endsType === "after_occurrences" &&
                          styles.endsOptionSelected,
                      ]}
                    >
                      <TextInput
                        value={occurrences}
                        onChangeText={setOccurrences}
                        placeholder="#"
                        editable={endsType === "after_occurrences"}
                        style={[
                          styles.smallInput,
                          endsType === "after_occurrences" && { color: "#fff" },
                        ]}
                        keyboardType="numeric"
                      />
                      <Text
                        style={[
                          styles.endsText,
                          endsType === "after_occurrences" &&
                            styles.endsTextSelected,
                        ]}
                      >
                        times
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
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

        {/* Existing Pickers */}
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
        <DateTimePickerModal
          isVisible={isEndDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setEndDate(date);
            setEndDatePickerVisible(false);
          }}
          onCancel={() => setEndDatePickerVisible(false)}
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
  sheet: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    // maxHeight: "100%",
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
    backgroundColor: "#fff",
  },
  actionChipActive: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  actionChipText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  actionChipTextActive: {
    color: "#15803d",
  },

  // Settings Panel
  settingsPanel: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 10,
    marginBottom: 20,
  },
  freqRow: {
    marginBottom: 16,
    flexDirection: "row",
  },
  freqOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginRight: 8,
  },
  freqOptionSelected: {
    backgroundColor: "#1e293b",
    borderColor: "#1e293b",
  },
  freqText: {
    fontSize: 13,
    color: "#475569",
  },
  freqTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  settingLabel: {
    fontSize: 14,
    color: "#475569",
  },
  intervalInput: {
    width: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 4,
    textAlign: "center",
    fontSize: 14,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weekdayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  weekdayBtnSelected: {
    backgroundColor: "#1e293b",
    borderColor: "#1e293b",
  },
  weekdayText: {
    fontSize: 12,
    color: "#64748b",
  },
  weekdayTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },

  settingCol: {
    marginTop: 8,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  endsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  endsOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  endsOptionSelected: {
    backgroundColor: "#1e293b",
    borderColor: "#1e293b",
  },
  endsText: {
    fontSize: 13,
    color: "#475569",
  },
  endsTextSelected: {
    color: "#fff",
  },
  smallInput: {
    width: 30,
    padding: 0,
    textAlign: "center",
    color: "#475569",
    fontSize: 13,
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
    backgroundColor: "#e11d48",
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
