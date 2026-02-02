import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/Skeleton";
import { UserDetail } from "@/api/auth";
import logo from "@/assets/adaptive-icon.png";
import { notificationService } from "@/utils/NotificationService";

interface HeaderProps {
  userDetails: UserDetail | null;
  showAvatar?: boolean;
}

export const Header = ({ userDetails, showAvatar = true }: HeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View className="flex flex-row items-center gap-3">
        <Image source={logo} className="w-14 h-14" />
        <Text className="text-3xl font-medium">Smran</Text>
      </View>
      {showAvatar && (
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {
            router.push("/profile");
            notificationService.checkScheduled(); // Keep existing logic
          }}
        >
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9F9FB",
    alignItems: "center",
    justifyContent: "center",
  },
});
