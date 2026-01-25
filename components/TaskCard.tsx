import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ImageBackground,
  ImageSourcePropType,
} from "react-native";
import { GlassCard } from "./GlassCard";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface TaskCardProps {
  title: string;
  description?: string;
  time: string;
  isOn: boolean;
  onToggle: (val: boolean) => void;
  hasLink?: boolean;
  image?: ImageSourcePropType;
  profileColor?: string; // For the dot on timeline
  isLast?: boolean;
}

export function TaskCard({
  title,
  description,
  time,
  isOn,
  onToggle,
  hasLink,
  image,
  profileColor,
}: TaskCardProps) {
  if (image) {
    return (
      <View style={styles.wrapper}>
        {/* Timeline Dot */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine} />
          <View
            style={[
              styles.dot,
              { backgroundColor: profileColor || Colors.palette.mint },
            ]}
          />
        </View>

        <View style={styles.cardContainer}>
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
                    <Ionicons name="leaf-outline" size={14} color="#15803d" />
                    <Text style={styles.tagText}>Home Guide</Text>
                  </View>
                  <Text style={styles.imageDesc}>{description}</Text>

                  <View style={styles.bottomRow}>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={16} color="#475569" />
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                    {/* Switch on image card? Screenshot has it */}
                    <Switch
                      value={isOn}
                      onValueChange={onToggle}
                      trackColor={{
                        false: "#767577",
                        true: Colors.palette.skyBlue,
                      }}
                      thumbColor={"#fff"}
                      ios_backgroundColor="#3e3e3e"
                    />
                  </View>
                </View>
              </View>
            </ImageBackground>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Timeline Dot */}
      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        <View
          style={[
            styles.dot,
            { backgroundColor: profileColor || Colors.light.tint },
          ]}
        />
        <View style={[styles.timelineLine, { flex: 1 }]} />
      </View>

      <View style={styles.cardContainer}>
        <GlassCard style={styles.card}>
          <Text style={styles.cardDesc} numberOfLines={3}>
            {description || title}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.timeText}>{time}</Text>

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginBottom: 20,
    minHeight: 120,
  },
  timelineContainer: {
    width: 20,
    alignItems: "center",
    marginRight: 15,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(203, 213, 225, 0.5)", // Light gray line
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
    marginTop: 20, // Align with top of card content approximately
    position: "absolute",
    top: 15,
    zIndex: 1,
  },
  cardContainer: {
    flex: 1,
  },
  card: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  cardDesc: {
    fontSize: 16,
    color: "#334155",
    marginBottom: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  visitBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  visitText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
  },
  // Image Card Styles
  imageCard: {
    padding: 0,
    borderRadius: 24,
    overflow: "hidden",
  },
  imageBg: {
    width: "100%",
    height: 200, // Taller for image
    justifyContent: "flex-end",
  },
  imageContent: {
    padding: 15,
    // Gradient or blur could go here
  },
  imageTextContainer: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: 15,
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#15803d",
    marginLeft: 4,
    fontWeight: "600",
  },
  imageDesc: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 10,
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
