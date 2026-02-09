import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Skeleton } from "@/components/Skeleton";
import { UserDetail } from "@/api/auth";
import logo from "@/assets/AppIcon.png";
import { notificationService } from "@/utils/NotificationService";
import { useAppTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useReminderStore } from "@/store/reminderStore";

interface HeaderProps {
  userDetails: UserDetail | null;
  showAvatar?: boolean;
}

export const Header = ({ userDetails, showAvatar = true }: HeaderProps) => {
  const router = useRouter();
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === "dark";
  return (
    <View style={styles.header}>
      <View className="flex flex-row items-center gap-3">
        <Image source={logo} className="w-12 h-12" />
        <Text
          className="text-3xl font-opensans font-semibold"
          style={{
            fontFamily: "OpenSans-Bold",
            color: isDark ? Colors.dark.text : Colors.light.text,
          }}
        >
          Smran
        </Text>
      </View>
      {showAvatar && (
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {
            router.push("/profile");
            notificationService.checkScheduled(); // Keep existing logic
          }}
        >
          <View>
            {!userDetails ? (
              <Skeleton width={40} height={40} borderRadius={20} />
            ) : userDetails.profile_img_url ? (
              <Image
                source={{ uri: userDetails.profile_img_url }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <Ionicons name="person" size={20} color="#394867" />
            )}
            {useReminderStore((state) => state.isPro) && (
              <View style={styles.proBadgeContainer}>
                <Ionicons name="ribbon" size={12} color="#eab308" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#F9F9FB",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  proBadgeContainer: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
});
