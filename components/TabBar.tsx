import { View, TouchableOpacity, Text } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/context/ThemeContext";
import { Colors } from "../constants/Colors";

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="absolute bottom-8 left-0 right-0 items-center "
      pointerEvents="box-none"
    >
      <View className="shadow-xl drop-shadow-lg shadow-black/60">
        <View
          className={`overflow-hidden rounded-full drop-shadow-lg border w-[280px] `}
          style={{
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
            borderColor: isDark
              ? Colors.dark.glassBorder
              : Colors.light.glassBorder,
          }}
        >
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            className="flex-row items-center justify-between p-1"
          >
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
              if (route.name === "index") iconName = "notifications";
              if (route.name === "voice") iconName = "mic";
              if (route.name === "manage") iconName = "list";

              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                    ? options.title
                    : route.name;

              // Active Background Color
              const activeBg = isDark ? "#bef264" : Colors.light.tint;

              const activeBackgroundColor = isFocused
                ? isDark
                  ? Colors.palette.mint // Green-ish for dark mode to match the "Activity Ring" vibe? Or just tint?
                  : Colors.light.tint
                : "transparent";

              const activePillColor = isDark
                ? Colors.palette.mint
                : Colors.light.tint;
              const activeIconColor = isDark ? "#000000" : "#FFFFFF"; // Contrast text on colored pill
              const inactiveIconColor = isDark ? "#9ca3af" : "#64748b";
              const activeTextColor = isDark ? "text-black" : "text-white";
              const inactiveTextColor = isDark
                ? "text-gray-400"
                : "text-slate-500";

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  className={`flex-1 items-center justify-center py-3 rounded-full`}
                  style={{
                    backgroundColor: isFocused
                      ? activePillColor
                      : "transparent",
                  }}
                >
                  <View className="items-center justify-center">
                    <Ionicons
                      name={iconName}
                      size={22}
                      color={isFocused ? activeIconColor : inactiveIconColor}
                    />
                    <Text
                      className={`text-[10px] font-medium mt-0.5 ${
                        isFocused ? activeTextColor : inactiveTextColor
                      }`}
                    >
                      {label as string}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </BlurView>
        </View>
      </View>
    </View>
  );
}
