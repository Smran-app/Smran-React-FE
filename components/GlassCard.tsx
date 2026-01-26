import { BlurView } from "expo-blur";
import {
  StyleSheet,
  View,
  ViewProps,
  useColorScheme,
  Platform,
} from "react-native";
import { Colors } from "../constants/Colors";

interface GlassCardProps extends ViewProps {
  intensity?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 80,
  ...props
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isDark
            ? Colors.dark.glassBorder
            : Colors.light.glassBorder,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.4)"
            : "rgba(255, 255, 255, 0.4)", // Fallback / Base tint
        },
        style,
      ]}
      {...props}
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "light"}
        style={styles.blur}
      >
        <View style={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  blur: {
    width: "100%",
  },
  content: {
    padding: 16,
  },
});
