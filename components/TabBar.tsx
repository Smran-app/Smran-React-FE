import {
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useAppTheme } from "@/context/ThemeContext";

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.containerWrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
            borderColor: isDark
              ? Colors.dark.glassBorder
              : Colors.light.glassBorder,
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={styles.blur}
        >
          <View style={styles.content}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              let iconName: any = "square";
              // Matching icons to "New", "Voice Input", "Manage"
              if (route.name === "index") iconName = "notifications"; // "New"
              if (route.name === "voice") iconName = "mic"; // "Voice Input"
              if (route.name === "manage") iconName = "list"; // "Manage"

              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                    ? options.title
                    : route.name;

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  style={styles.tabItem}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      (route.name === "voice" || isFocused) &&
                        styles.activeIconContainer,
                      route.name === "voice" && styles.voiceTab,
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={24}
                      color={
                        route.name === "voice"
                          ? "#fff"
                          : isFocused
                            ? Colors.light.tint
                            : colors.text
                      }
                    />
                  </View>
                  <Text
                    style={{
                      color: isFocused ? Colors.light.tint : colors.text,
                      fontSize: 12,
                      marginTop: 4,
                      fontFamily: Platform.select({
                        ios: "System",
                        android: "Roboto",
                      }),
                      fontWeight: isFocused ? "600" : "400",
                    }}
                  >
                    {label as string}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  container: {
    borderRadius: 30,
    overflow: "hidden",
    width: "100%",
    borderWidth: 1,
    // Shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  blur: {
    width: "100%",
  },
  content: {
    flexDirection: "row",
    paddingVertical: 15,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
  },
  activeIconContainer: {
    // Optional active background
  },
  voiceTab: {
    backgroundColor: Colors.light.tint, // Prominent Blue
    borderRadius: 25,
    padding: 12,
    transform: [{ scale: 1.1 }],
  },
});
