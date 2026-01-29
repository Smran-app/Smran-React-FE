import { Mic } from "lucide-react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { apiClient } from "@/api/client";

const { width, height } = Dimensions.get("window");

const LOTUS_COLORS = [
  "#A78BFA",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#FCD34D",
  "#86EFAC",
  "#60A5FA",
  "#38BDF8",
];

interface LotusPetalProps {
  color: string;
  rotation: number;
  isRecording: boolean;
  index: number;
}

function LotusPetal({ color, rotation, isRecording, index }: LotusPetalProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 800 + index * 50,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.95,
              duration: 800 + index * 50,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 800 + index * 50,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 800 + index * 50,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRecording, scaleAnim, opacityAnim, index]);

  return (
    <Animated.View
      style={[
        styles.petal,
        {
          backgroundColor: color,
          transform: [{ rotate: `${rotation}deg` }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

const LOADING_MESSAGES = [
  "Working on creating your reminder...",
  "We do not let you forget! ✨",
  "Processing your words...",
  "Setting up your reminder...",
  "Almost there! 🎯",
  "Making sure you remember...",
  "Creating magic... ✨",
  "Your reminder is being crafted...",
];

export default function VoiceInputScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const glowAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const createReminderRef = useRef<((text: string) => Promise<void>) | null>(
    null,
  );

  // Helper to get last few words for display
  const getLastFewWords = (text: string, wordCount: number = 5) => {
    if (!text || text === "Listening...") return text;
    const words = text.trim().split(/\s+/);
    if (words.length <= wordCount) return text;
    return "..." + words.slice(-wordCount).join(" ");
  };

  // Auto-stop after 5 seconds of silence
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (isRecording) {
      silenceTimerRef.current = setTimeout(() => {
        // Auto-stop recording after 5 seconds of no input
        if (
          isRecording &&
          fullTranscript &&
          fullTranscript !== "Listening..."
        ) {
          // Trigger stop recording
          setIsRecording(false);
          setIsProcessing(true);

          // Stop speech recognition
          try {
            ExpoSpeechRecognitionModule.stop();
          } catch (stopError: any) {
            try {
              ExpoSpeechRecognitionModule.abort();
            } catch (abortError) {
              console.error("Error aborting speech recognition:", abortError);
            }
          }

          setIsProcessing(false);

          // Create reminder from transcript
          if (
            fullTranscript &&
            fullTranscript !== "Listening..." &&
            createReminderRef.current
          ) {
            createReminderRef.current(fullTranscript);
          }
        }
      }, 3000);
    }
  }, [isRecording, fullTranscript]);

  // Use the speech recognition event hook
  useSpeechRecognitionEvent("result", (event) => {
    if (event.results && event.results.length > 0) {
      const latestResult = event.results[event.results.length - 1];
      const text = latestResult.transcript.trim();

      // Reset silence timer on any speech input
      resetSilenceTimer();

      if (event.isFinal) {
        // Final result - append to existing transcript
        setFullTranscript((prev) => {
          const newText =
            prev === "Listening..." || !prev ? text : `${prev} ${text}`;
          setTranscript(getLastFewWords(newText));
          return newText;
        });
      } else {
        // Interim result - show as current text
        setFullTranscript((prev) => {
          let newText;
          if (prev && prev !== "Listening..." && !prev.includes(text)) {
            newText = `${prev} ${text}`;
          } else {
            newText = text || prev || "Listening...";
          }
          setTranscript(getLastFewWords(newText));
          return newText;
        });
      }
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech recognition error:", event.error, event.message);

    // Don't show error for aborted (user stopped manually)
    if (event.error === "aborted") {
      return;
    }

    // Reset recording state on error
    setIsRecording(false);
    setIsProcessing(false);

    // Get user-friendly error message
    let errorMessage = "An error occurred during speech recognition.";
    let errorTitle = "Recognition Error";

    switch (event.error) {
      case "not-allowed":
        errorTitle = "Permission Denied";
        errorMessage =
          "Microphone access was denied. Please enable it in Settings.";
        break;
      case "no-speech":
        errorTitle = "No Speech Detected";
        errorMessage = "No speech was detected. Please try speaking again.";
        break;
      case "audio-capture":
        errorTitle = "Audio Capture Error";
        errorMessage =
          "Unable to access microphone. Please check your device settings.";
        break;
      case "network":
        errorTitle = "Network Error";
        errorMessage =
          "Network connection required for speech recognition. Please check your internet connection.";
        break;
      case "service-not-allowed":
        errorTitle = "Service Unavailable";
        errorMessage =
          "Speech recognition service is not available. Please try again later.";
        break;
      case "bad-grammar":
        errorTitle = "Configuration Error";
        errorMessage =
          "Speech recognition configuration error. Please try again.";
        break;
      case "language-not-supported":
        errorTitle = "Language Not Supported";
        errorMessage = "The selected language is not supported.";
        break;
      case "busy":
        errorTitle = "Service Busy";
        errorMessage =
          "Speech recognition service is busy. Please try again in a moment.";
        break;
      default:
        errorMessage =
          event.message || "An unexpected error occurred. Please try again.";
    }

    // Show alert for critical errors
    if (event.error !== "no-speech") {
      Alert.alert(errorTitle, errorMessage, [
        {
          text: "OK",
          onPress: () => {
            setTranscript("");
          },
        },
      ]);
    } else {
      // For no-speech, just show a brief message
      setTranscript("No speech detected. Try speaking again.");
      setTimeout(() => {
        setTranscript("");
      }, 3000);
    }
  });

  useSpeechRecognitionEvent("start", () => {
    setTranscript("Listening...");
    setIsRecording(true);
  });

  useSpeechRecognitionEvent("end", () => {
    // Recognition ended - reset state if not already stopped
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(false);

      // If no transcript was captured, show message
      if (!transcript || transcript === "Listening...") {
        setTranscript("No speech detected");
        setTimeout(() => {
          setTranscript("");
        }, 3000);
      }
    }
  });

  useSpeechRecognitionEvent("nomatch", () => {
    // No match found - this is normal, don't show error
    console.log("No speech match found");
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(false);
      setTranscript("No speech detected. Try speaking again.");
      setTimeout(() => {
        setTranscript("");
      }, 3000);
    }
  });

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isRecording, glowAnim]);

  // Rotate loading messages
  useEffect(() => {
    if (isCreatingReminder) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isCreatingReminder]);

  // Create reminder from text
  const createReminderFromText = useCallback(async (text: string) => {
    if (!text || text.trim() === "" || text === "Listening...") {
      return;
    }

    setIsCreatingReminder(true);
    setLoadingMessageIndex(0);

    try {
      const response = await apiClient<{
        message?: string;
        reminder?: any;
        success?: boolean;
      }>("/reminders/from-text", {
        method: "POST",
        body: JSON.stringify({ text: text.trim() }),
        useAuth: true,
      });

      console.log("response", response);

      // check is response.success is true
      if (!response.success) {
        // show a dialog box with response.message
        Alert.alert("Error", response.message);
        setIsCreatingReminder(false);
        return;
      }

      setIsCreatingReminder(false);

      // Show success with confetti immediately
      setShowConfetti(true);
      setSuccessMessage("Reminder created successfully! 🎉");

      // Clear transcript after showing success
      setTimeout(() => {
        setTranscript("");
        setFullTranscript("");
        setSuccessMessage("");
        setShowConfetti(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error creating reminder:", error);
      setIsCreatingReminder(false);

      let errorMessage = "Failed to create reminder. Please try again.";
      let errorTitle = "Error Creating Reminder";

      // Handle timeout/abort errors specifically
      if (error?.name === "AbortError" || error?.message?.includes("Aborted")) {
        errorTitle = "Request Timeout";
        errorMessage =
          "The request took too long. The server may still be processing your reminder. Please check your reminders list.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage, [
        {
          text: "OK",
          onPress: () => {
            setTranscript("");
            setFullTranscript("");
          },
        },
      ]);
    }
  }, []);

  // Set ref for createReminderFromText
  useEffect(() => {
    createReminderRef.current = createReminderFromText;
  }, [createReminderFromText]);

  const startRecording = useCallback(async () => {
    try {
      // Check if speech recognition is available
      const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!isAvailable) {
        Alert.alert(
          "Speech Recognition Unavailable",
          "Speech recognition is not available on this device. Please enable it in your device settings.",
          [{ text: "OK" }],
        );
        return;
      }

      console.log("Checking permissions..");

      // Check speech recognition permissions
      const speechPermission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log("Speech permission status:", speechPermission.status);

      if (!speechPermission.granted) {
        Alert.alert(
          "Microphone Permission Required",
          "Please enable microphone access in your device settings to use voice recording.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Alert.alert(
                    "Enable Microphone Access",
                    "Go to Settings > Smran > Microphone and enable access.",
                  );
                }
              },
            },
          ],
        );
        setTranscript("Permission denied");
        setTimeout(() => setTranscript(""), 2000);
        return;
      }

      // Start speech recognition (this handles audio capture internally)
      console.log("Starting speech recognition..");
      try {
        ExpoSpeechRecognitionModule.start({
          lang: "en-US",
          continuous: true,
          interimResults: true,
        });

        setIsRecording(true);
        setFullTranscript("Listening...");
        setTranscript("Listening...");

        // Start silence timer
        resetSilenceTimer();

        Animated.spring(buttonScaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();

        console.log("Recording started");
      } catch (startError: any) {
        console.error("Failed to start speech recognition:", startError);
        setIsRecording(false);
        Alert.alert(
          "Failed to Start",
          "Unable to start speech recognition. Please try again.",
          [{ text: "OK" }],
        );
        setTranscript("");
      }
    } catch (err: any) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
      setIsProcessing(false);

      const errorMessage =
        err?.message || "An unexpected error occurred. Please try again.";
      Alert.alert("Recording Error", errorMessage, [
        { text: "OK", onPress: () => setTranscript("") },
      ]);
    }
  }, [buttonScaleAnim]);

  const stopRecording = useCallback(async () => {
    try {
      console.log("Stopping recording..");

      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      setIsRecording(false);
      setIsProcessing(true);

      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Stop speech recognition safely
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (stopError: any) {
        console.error("Error stopping speech recognition:", stopError);
        // Try abort as fallback
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch (abortError) {
          console.error("Error aborting speech recognition:", abortError);
        }
      }

      setIsProcessing(false);

      // Check if we have valid transcript to create reminder
      const finalTranscript =
        fullTranscript && fullTranscript !== "Listening..."
          ? fullTranscript
          : "";

      if (finalTranscript) {
        // Create reminder from transcript
        await createReminderFromText(finalTranscript);
      } else {
        // No speech detected
        setTranscript("No speech detected");
        setFullTranscript("");
        setTimeout(() => {
          setTranscript("");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Error in stopRecording:", err);
      setIsRecording(false);
      setIsProcessing(false);
      setIsCreatingReminder(false);
      // Don't show alert for stop errors, just reset state
    }
  }, [buttonScaleAnim, fullTranscript, createReminderFromText]);

  const handlePress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      disabled={isCreatingReminder}
    >
      {/* Confetti */}
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: 0 }}
          fadeOut={true}
          autoStart={true}
          explosionSpeed={350}
          fallSpeed={3000}
          colors={[
            "#A78BFA",
            "#EC4899",
            "#EF4444",
            "#F97316",
            "#FCD34D",
            "#86EFAC",
            "#60A5FA",
            "#38BDF8",
          ]}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.appName}>Smran</Text>
        <Text style={styles.subtitle}>Voice Reminders</Text>
      </View>

      <View style={styles.lotusContainer}>
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
            },
          ]}
        />

        {LOTUS_COLORS.map((color, index) => (
          <LotusPetal
            key={index}
            color={color}
            rotation={(360 / LOTUS_COLORS.length) * index}
            isRecording={isRecording || isCreatingReminder}
            index={index}
          />
        ))}
      </View>

      <View style={styles.bottomSection}>
        {/* Loading State */}
        {isCreatingReminder ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text style={styles.loadingMessage}>
              {LOADING_MESSAGES[loadingMessageIndex]}
            </Text>
          </View>
        ) : successMessage ? (
          <View style={styles.successContainer}>
            <Text style={styles.successMessage}>{successMessage}</Text>
          </View>
        ) : transcript ? (
          <View style={styles.transcriptWrapper}>
            <View style={styles.transcriptHeader}>
              <Text style={styles.transcriptLabel}>
                {isRecording
                  ? "Listening..."
                  : isProcessing
                    ? "Processing..."
                    : "Transcript"}
              </Text>
              {!isRecording && transcript && transcript !== "Listening..." && (
                <Pressable
                  onPress={() => {
                    setTranscript("");
                    setFullTranscript("");
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </Pressable>
              )}
            </View>
            <ScrollView
              style={styles.transcriptContainer}
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.transcript}>{transcript}</Text>
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.hint}>
            {isRecording ? "Tap to Stop" : "Tap to Start"}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 90,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 90,
  },
  appName: {
    fontSize: 48,
    fontWeight: "300" as const,
    color: "#1F2937",
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  lotusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
  },
  petal: {
    position: "absolute" as const,
    width: 140,
    height: 220,
    borderRadius: 100,
    top: "50%",
    left: "50%",
    marginLeft: -70,
    marginTop: -180,
  },
  glow: {
    position: "absolute" as const,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#60A5FA",
    shadowColor: "#60A5FA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
  },
  centerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    zIndex: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    marginBottom: 24,
  },
  micButton: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: {
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
    width: "100%",
  },
  hint: {
    fontSize: 16,
    color: "#9CA3AF",
    letterSpacing: 1,
    marginBottom: 150,
  },
  transcriptWrapper: {
    width: "100%",
    maxWidth: width - 18,
    marginBottom: 120,
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  transcriptContainer: {
    maxHeight: 200,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transcriptContent: {
    padding: 20,
  },
  transcript: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "100%",
    marginBottom: 120,
  },
  loadingMessage: {
    fontSize: 18,
    color: "#1F2937",
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "100%",
    marginBottom: 120,
  },
  successMessage: {
    fontSize: 24,
    color: "#10B981",
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
