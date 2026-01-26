import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { CreateReminderPayload } from "@/api/reminders";

type RepeatType = "once" | "daily" | "weekly" | "monthly" | "yearly";
type EndsType = "never" | "on_date" | "after_occurrences";

export default function ModalScreen() {
  const router = useRouter();
  const { addReminder, isLoading } = useReminderStore();

  // Basic Info
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
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
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Reminder</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.label}>REMINDER NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Go to Museum"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>LINK (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={link}
            onChangeText={setLink}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Time & Timezone */}
        <View style={styles.section}>
          <Text style={styles.label}>TIME OF DAY</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setTimePickerVisible(true)}
          >
            <Text style={styles.pickerTriggerText}>
              {time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <Ionicons name="time-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            onConfirm={(date) => {
              setTime(date);
              setTimePickerVisible(false);
            }}
            onCancel={() => setTimePickerVisible(false)}
          />
        </View>

        {/* Repeat Section */}
        <View style={styles.section}>
          <Text style={styles.label}>REPEAT</Text>
          <View style={styles.typeSelector}>
            {(
              ["once", "daily", "weekly", "monthly", "yearly"] as RepeatType[]
            ).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeBtn,
                  repeatType === type && styles.typeBtnActive,
                ]}
                onPress={() => setRepeatType(type)}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    repeatType === type && styles.typeBtnTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Fields based on Repeat Type */}
          {repeatType === "once" && (
            <View style={styles.subSection}>
              <Text style={styles.label}>DATE</Text>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={styles.pickerTriggerText}>
                  {startDate.toLocaleDateString([], { dateStyle: "long" })}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                  setStartDate(date);
                  setDatePickerVisible(false);
                }}
                onCancel={() => setDatePickerVisible(false)}
              />
            </View>
          )}

          {repeatType !== "once" && (
            <View style={styles.subSection}>
              <Text style={styles.label}>
                EVERY X {repeatType.replace("ly", "").toUpperCase()}S
              </Text>
              <TextInput
                style={styles.input}
                value={interval}
                onChangeText={setInterval}
                keyboardType="numeric"
              />
            </View>
          )}

          {repeatType === "weekly" && (
            <View style={styles.subSection}>
              <Text style={styles.label}>ON DAYS</Text>
              <View style={styles.weekdayRow}>
                {weekdays.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.weekdayChip,
                      selectedWeekdays.includes(day) &&
                        styles.weekdayChipActive,
                    ]}
                    onPress={() => toggleWeekday(day)}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        selectedWeekdays.includes(day) &&
                          styles.weekdayTextActive,
                      ]}
                    >
                      {day[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {repeatType === "monthly" && (
            <View style={styles.subSection}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => setMonthlyOption("day")}
              >
                <Ionicons
                  name={
                    monthlyOption === "day"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={Colors.palette.lavender}
                />
                <Text style={styles.rowText}>Day of Month</Text>
                {monthlyOption === "day" && (
                  <TextInput
                    style={[styles.smallInput, { marginLeft: "auto" }]}
                    value={monthDay}
                    onChangeText={setMonthDay}
                    keyboardType="numeric"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.row, { marginTop: 12 }]}
                onPress={() => setMonthlyOption("nth")}
              >
                <Ionicons
                  name={
                    monthlyOption === "nth"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={Colors.palette.lavender}
                />
                <Text style={styles.rowText}>Nth Weekday</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Ends Section */}
        {repeatType !== "once" && (
          <View style={styles.section}>
            <Text style={styles.label}>ENDS</Text>
            <View style={styles.endsOptions}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => setEndsType("never")}
              >
                <Ionicons
                  name={
                    endsType === "never"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={Colors.palette.lavender}
                />
                <Text style={styles.rowText}>Never</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.row, { marginTop: 12 }]}
                onPress={() => setEndsType("on_date")}
              >
                <Ionicons
                  name={
                    endsType === "on_date"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={Colors.palette.lavender}
                />
                <Text style={styles.rowText}>On Date</Text>
                {endsType === "on_date" && (
                  <TouchableOpacity
                    onPress={() => setEndDatePickerVisible(true)}
                    style={{ marginLeft: "auto" }}
                  >
                    <Text style={styles.dateText}>
                      {endDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.row, { marginTop: 12 }]}
                onPress={() => setEndsType("after_occurrences")}
              >
                <Ionicons
                  name={
                    endsType === "after_occurrences"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={Colors.palette.lavender}
                />
                <Text style={styles.rowText}>After</Text>
                {endsType === "after_occurrences" && (
                  <View
                    style={{
                      marginLeft: "auto",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <TextInput
                      style={styles.smallInput}
                      value={occurrences}
                      onChangeText={setOccurrences}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.rowText, { marginLeft: 8 }]}>
                      times
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <DateTimePickerModal
              isVisible={isEndDatePickerVisible}
              mode="date"
              onConfirm={(date) => {
                setEndDate(date);
                setEndDatePickerVisible(false);
              }}
              onCancel={() => setEndDatePickerVisible(false)}
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createBtn, isLoading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Reminder</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    color: "#334155",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 16,
  },
  pickerTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  pickerTriggerText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  typeBtnActive: {
    backgroundColor: Colors.palette.lavender,
  },
  typeBtnText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  typeBtnTextActive: {
    color: "#fff",
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  weekdayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayChipActive: {
    backgroundColor: Colors.palette.lavender,
  },
  weekdayText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  weekdayTextActive: {
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    fontSize: 16,
    color: "#334155",
    marginLeft: 12,
  },
  smallInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 50,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  dateText: {
    color: Colors.palette.lavender,
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
  },
  createBtn: {
    flex: 2,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: Colors.palette.lavender,
  },
  createBtnDisabled: {
    opacity: 0.7,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  endsOptions: {
    marginTop: 8,
  },
});
