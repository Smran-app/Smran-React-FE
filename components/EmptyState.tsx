import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Svg, Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface EmptyStateProps {
  onPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      {/* Background Gradient Glow (Diffused Blob) */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={["#FFB588", "#FFD788", "#FFF9F2", "#FFFCF9"]}
          style={styles.glow}
          start={{ x: 0.5, y: 0.2 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Let's start by adding a reminder.{"\n"}What's on your mind?
        </Text>

        <View style={styles.illustrationContainer}>
          <Svg width="220" height="280" viewBox="0 0 220 280" fill="none">
            {/* Twirly curved dashed line */}
            <Path
              d="M40 20 
                 C 100 0, 160 60, 100 100 
                 C 20 160, 180 180, 175 230"
              stroke="#3B0069"
              strokeWidth="2.5"
              strokeDasharray="8 8"
              strokeLinecap="round"
            />
            {/* Arrow pointer angled towards the FAB */}
            <Path
              d="M155 230 L180 245 L185 225"
              stroke="#3B0069"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#FFFCF9", // Warm off-white background
    justifyContent: "center",
    alignItems: "center",
  },
  glowContainer: {
    position: "absolute",
    bottom: -100,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    overflow: "hidden",
    opacity: 0.4,
  },
  glow: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingTop: 100,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    color: "#422817",
    lineHeight: 42,
    paddingHorizontal: 40,
    letterSpacing: -0.5,
  },
  illustrationContainer: {
    marginTop: 0,
    opacity: 0.8,
    alignSelf: "flex-end",
    marginRight: 30,
    marginBottom: -20,
  },
});
