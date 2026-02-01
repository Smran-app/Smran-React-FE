import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ImageBackground,
  ImageSourcePropType,
  ViewStyle,
  useColorScheme,
} from "react-native";
import { GlassCard } from "./GlassCard";
import { Colors } from "@/constants/Colors";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/context/ThemeContext";

interface TaskCardProps {
  title: string;
  description?: string;
  frequency?: string;
  time: string;
  isOn: boolean;
  onToggle: (val: boolean) => void;
  hasLink?: boolean;
  image?: ImageSourcePropType;
  profileColor?: string; // For the dot on timeline
  isLast?: boolean;
  isFirst?: boolean;
}

export function TaskCard({
  title,
  description,
  frequency,
  time,
  isOn,
  onToggle,
  hasLink,
  image,
  profileColor,
  isLast,
  isFirst,
}: TaskCardProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === "dark";
  const styles = StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      marginBottom: 20,
      marginHorizontal: 16,
      minHeight: 120,
    },
    localFlex: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: 2,
      marginBottom: 8,
    },
    timelineContainer: {
      // width: 24,
      alignItems: "center",
      marginRight: 12,
      justifyContent: "center",
    },
    timelineLineTop: {
      position: "absolute",
      top: 0,
      bottom: "50%",
      width: 1,
      backgroundColor: "#CBD5E1",
    },
    timelineLineBottom: {
      position: "absolute",
      top: "50%",
      bottom: 0,
      width: 1,
      height: 100,
      backgroundColor: "#CBD5E1",
    },
    activeDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: Colors.palette.skyBlue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      elevation: 3,
    },
    innerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#fff",
    },
    inactiveDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: "#CBD5E1",
      backgroundColor: "transparent",
    },
    gradientBorderContainer: {
      borderRadius: 10,
      overflow: "hidden",
      position: "relative",
    },
    gradientBorderInner: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4, // Thickness of the gradient border on the left
    },
    cardInnerContainer: {
      paddingLeft: 2, // Small gap after the gradient border
    },
    cardContainer: {
      flex: 1,
    },
    card: {
      backgroundColor: "rgba(255,255,255,0.7)",
    },
    cardHeader: {
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? Colors.dark.text : Colors.light.text,
      lineHeight: 24,
    },
    cardDesc: {
      fontSize: 14,
      color: "#64748B",
      marginBottom: 16,
      lineHeight: 20,
      fontWeight: "400",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeText: {
      fontSize: 16,
      color: "#1e293b",
      fontWeight: "600",
    },
    visitBtn: {
      backgroundColor: "#f8fafc",
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#f1f5f9",
    },
    visitText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#64748B",
      letterSpacing: 1,
    },
    // Image Card Styles
    imageCard: {
      padding: 0,
      borderRadius: 24,
      overflow: "hidden",
    },
    imageBg: {
      width: "100%",
      height: 240,
      justifyContent: "flex-end",
    },
    imageContent: {
      padding: 10,
    },
    imageTextContainer: {
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: 20,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    imageTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#1e293b",
    },
    tagRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 6,
    },
    tagText: {
      fontSize: 14,
      color: "#64748B",
      marginLeft: 6,
      fontWeight: "500",
    },
    imageDesc: {
      fontSize: 14,
      color: "#64748B",
      marginBottom: 12,
      lineHeight: 20,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
    },
  });

  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      {!isFirst && <View style={styles.timelineLineTop} />}
      {!isLast && <View style={styles.timelineLineBottom} />}
      {isOn ? (
        <LinearGradient
          colors={
            Colors.palette.primaryGradient as [string, string, ...string[]]
          }
          style={styles.activeDot}
        >
          <View style={styles.innerDot} />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveDot} />
      )}
    </View>
  );

  const GradientBorder = ({
    children,
    style,
  }: {
    children: React.ReactNode;
    style?: ViewStyle;
  }) => (
    <View style={[styles.gradientBorderContainer, style]}>
      <LinearGradient
        colors={Colors.palette.primaryGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBorderInner}
      />
      <View style={styles.cardInnerContainer}>{children}</View>
    </View>
  );

  if (image) {
    return (
      <View style={styles.wrapper}>
        {/* {renderTimeline()} */}
        <View style={styles.cardContainer}>
          <GradientBorder>
            <GlassCard style={styles.imageCard} intensity={20}>
              <ImageBackground
                source={image}
                style={styles.imageBg}
                imageStyle={{ borderRadius: 24 }}
              >
                <View style={styles.imageContent}>
                  <View style={styles.imageTextContainer}>
                    <Text style={styles.imageTitle}>{title}</Text>
                    <View style={styles.tagRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={Colors.palette.mint}
                      />
                      <Text style={styles.tagText}>Home Guide</Text>
                    </View>
                    <Text style={styles.imageDesc} numberOfLines={2}>
                      {description}
                    </Text>

                    <View style={styles.bottomRow}>
                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#475569"
                        />
                        <Text style={styles.timeText}>{time}</Text>
                      </View>
                      <Switch
                        value={isOn}
                        onValueChange={onToggle}
                        trackColor={{
                          false: "#e2e8f0",
                          true: Colors.palette.skyBlue,
                        }}
                        thumbColor={"#fff"}
                      />
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </GlassCard>
          </GradientBorder>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* {renderTimeline()} */}
      <View style={styles.cardContainer}>
        <GradientBorder>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {title}
              </Text>
            </View>
            {/* {description && (
              <Text style={styles.cardDesc} numberOfLines={3}>
                {description}
              </Text>
            )} */}
            {frequency && (
              <View style={styles.localFlex}>
                <Text
                  className="text-lg font-normal text-gray-500"
                  numberOfLines={1}
                >
                  {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                </Text>
                {frequency === "daily" ? (
                  <Feather name="repeat" size={16} color="green" />
                ) : frequency === "once" ? (
                  <MaterialCommunityIcons
                    name="calendar-multiselect"
                    size={18}
                    color={Colors.palette.primaryGradient[0]}
                  />
                ) : null}
              </View>
            )}

            <View style={styles.footer}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <MaterialIcons name="access-alarm" size={18} color="#475569" />
                <Text style={styles.timeText}>{time}</Text>
              </View>

              {hasLink ? (
                <TouchableOpacity style={styles.visitBtn}>
                  <Text style={styles.visitText}>VISIT</Text>
                </TouchableOpacity>
              ) : null}

              <Switch
                value={isOn}
                onValueChange={onToggle}
                trackColor={{ false: "#e2e8f0", true: Colors.palette.skyBlue }}
                thumbColor={"#fff"}
              />
            </View>
          </GlassCard>
        </GradientBorder>
      </View>
    </View>
  );
}
