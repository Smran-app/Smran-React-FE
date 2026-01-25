import { View, Text, StyleSheet } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";

export default function VoiceScreen() {
  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.center}>
        <Text>Voice Input Screen</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
