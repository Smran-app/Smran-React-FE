import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, ViewProps, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";

export function ScreenWrapper({ children, style, ...props }: ViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Background gradient: Light mode uses off-white with lavender touches, Dark mode uses deep navy
  const gradientColors = isDark
    ? [Colors.dark.background, "#1e1b4b"]
    : ["#FFFFFF", "#F3E8FF", "#E0F2FE"];

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
