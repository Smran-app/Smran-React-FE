import React, { useEffect } from "react";
import { StyleSheet, View, Animated, Easing } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface MetaRingProps {
  isRecording: boolean;
  size?: number;
}

export function MetaRing({ isRecording, size = 200 }: MetaRingProps) {
  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isRecording) {
      // Breathing animation (Scale + Opacity)
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.15,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      // Reset animations
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        rotateAnim.setValue(0);
      });
    }
  }, [isRecording]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const strokeWidth = size * 0.1; // 10% of size
  const radius = (size - strokeWidth) / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { rotate: spin }],
          opacity: opacityAnim,
        }}
      >
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00C6FF" stopOpacity="1" />
              <Stop offset="50%" stopColor="#D8B4FE" stopOpacity="1" />
              <Stop offset="100%" stopColor="#6EE7B7" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round" // Optional: makes ends rounded if not a full circle, but here it is full
          />
        </Svg>
      </Animated.View>

      {/* Inner glow/blur effect could be added here if needed, but keeping it simple for now */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
