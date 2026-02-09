import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { useAppTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({
  visible,
  message = "Signing you in...",
}: LoadingOverlayProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === "dark";
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 30 : 80}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <ActivityIndicator
          size="large"
          color={isDark ? Colors.dark.text : Colors.light.text}
        />
        <Text
          style={[
            styles.message,
            { color: isDark ? Colors.dark.text : Colors.light.text },
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "System", android: "Roboto" }),
  },
});
