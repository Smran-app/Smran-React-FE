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
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";
import * as Crypto from "expo-crypto";
import DateTimePickerModal from "react-native-modal-datetime-picker";
export default function ModalScreen() {
  const router = useRouter();
  const { addReminder } = useReminderStore();

  const [date, setDate] = useState(new Date());
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [repeat, setRepeat] = useState("None");
  const [profile, setProfile] = useState("Moderate");
  const [notifyBefore, setNotifyBefore] = useState("5");
  const [snoozeDuration, setSnoozeDuration] = useState("5");

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
  };

  const handleSave = () => {
    if (!text) {
      Alert.alert("Error", "Please enter reminder text");
      return;
    }
    addReminder({
      id: Crypto.randomUUID(),
      title: text,
      link,
      date,
      repeat,
      profile,
      notifyBefore: parseInt(notifyBefore) || 5,
      snoozeDuration: parseInt(snoozeDuration) || 5,
      isOn: true,
    });
    router.back();
  };

  const profiles = ["Important", "Moderate", "Low"];
  const repeats = ["None", "Daily", "Weekdays", "Weekly", "Monthly", "Yearly"];

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CREATE</Text>
        <TouchableOpacity onPress={handleSave} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>DONE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Reminder Text</Text>
        <TextInput
          style={styles.input}
          placeholder="What do you want to remember?"
          value={text}
          onChangeText={setText}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Link [Optional]</Text>
        <TextInput
          style={styles.input}
          placeholder="https://"
          value={link}
          onChangeText={setLink}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Select Date & Time</Text>
        <View style={styles.datePickerContainer}></View>

        <Text style={styles.label}>Repeat</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.segmentScroll}
        >
          {repeats.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.segmentBtn,
                repeat === r && styles.segmentBtnActive,
              ]}
              onPress={() => setRepeat(r)}
            >
              <Text
                style={[
                  styles.segmentText,
                  repeat === r && styles.segmentTextActive,
                ]}
              >
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Profile</Text>
        <View style={styles.row}>
          {profiles.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.profileBtn,
                profile === p && styles.profileBtnActive,
              ]}
              onPress={() => setProfile(p)}
            >
              <Text
                style={[
                  styles.profileText,
                  profile === p && styles.profileTextActive,
                ]}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rowSpaced}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Notify Before</Text>
            <View style={styles.numberInput}>
              <TextInput
                style={styles.smallInput}
                value={notifyBefore}
                onChangeText={setNotifyBefore}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>Mins</Text>
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={styles.label}>Snooze Duration</Text>
            <View style={styles.numberInput}>
              <TextInput
                style={styles.smallInput}
                value={snoozeDuration}
                onChangeText={setSnoozeDuration}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>Mins</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, height: 400 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerBtn: {
    fontSize: 16,
    color: Colors.light.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  doneBtn: {
    backgroundColor: "#333",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 20,
    color: "#334155",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 16,
  },
  datePickerContainer: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    overflow: "hidden",
  },
  segmentScroll: {
    flexDirection: "row",
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
    marginRight: 10,
  },
  segmentBtnActive: {
    backgroundColor: "#333",
  },
  segmentText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginHorizontal: 4,
  },
  profileBtnActive: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  profileText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  profileTextActive: {
    color: "#fff",
  },
  rowSpaced: {
    flexDirection: "row",
    marginTop: 10,
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
  },
  smallInput: {
    padding: 10,
    width: 50,
    fontSize: 16,
    textAlign: "center",
  },
  unitText: {
    fontSize: 16,
    color: "#64748B",
  },
});
