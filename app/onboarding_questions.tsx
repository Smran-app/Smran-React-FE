import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from './contexts/OnboardingContext';
import { submitOnboarding } from '@/api/onboarding';

const { width, height } = Dimensions.get('window');

type OnboardingData = {
  forgetTypes: string[];
  completionTimes: string[];
  snoozeStrategy: string;
  reminderBehavior: string;
};

const questions = [
  {
    title: 'Welcome to Smran',
    subtitle: 'Let\'s personalize your experience',
    type: 'welcome',
  },
  {
    title: 'What kind of things do you usually forget or delay?',
    subtitle: 'Select all that apply',
    type: 'multi',
    options: [
      { id: 'bills', label: 'Bills & payments', emoji: '🧾' },
      { id: 'appointments', label: 'Appointments & events', emoji: '📅' },
      { id: 'personal', label: 'Personal tasks (buy, book, call)', emoji: '🛒' },
      { id: 'work', label: 'Work follow-ups', emoji: '💼' },
      { id: 'longterm', label: 'Long-term important things', emoji: '🧠' },
      { id: 'everything', label: 'I forget everything', emoji: '🤷' },
    ],
  },
  {
    title: 'When do you usually complete tasks?',
    subtitle: 'Tap one or two',
    type: 'multi-limited',
    maxSelection: 2,
    options: [
      { id: 'morning', label: 'Morning', emoji: '🌅' },
      { id: 'afternoon', label: 'Afternoon', emoji: '☀️' },
      { id: 'evening', label: 'Evening', emoji: '🌆' },
      { id: 'latenight', label: 'Late night', emoji: '🌙' },
      { id: 'specific', label: 'Only at specific places', emoji: '📍' },
    ],
  },
  {
    title: 'If you snooze a reminder multiple times, what should we do?',
    subtitle: 'Choose one',
    type: 'single',
    options: [
      { id: 'gentle', label: 'Keep reminding gently', emoji: '😌' },
      { id: 'urgent', label: 'Increase urgency', emoji: '📈' },
      { id: 'breakdown', label: 'Break it into smaller steps', emoji: '🧩' },
      { id: 'auto', label: 'Decide automatically', emoji: '🤖' },
    ],
  },
  {
    title: 'When a reminder pops up, what do you usually do?',
    subtitle: 'Be honest!',
    type: 'single',
    options: [
      { id: 'immediate', label: 'Do it immediately', emoji: '✅' },
      { id: 'snooze', label: 'Snooze it', emoji: '⏰' },
      { id: 'dismiss', label: 'Dismiss and forget', emoji: '❌' },
      { id: 'ignore', label: 'Ignore completely', emoji: '😵' },
    ],
  },
];

function getOptionLabel(questionIndex: number, optionId: string): string {
  const q = questions[questionIndex];
  const option = q.options?.find((o) => o.id === optionId);
  return option?.label ?? optionId;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  const [data, setData] = useState<OnboardingData>({
    forgetTypes: [],
    completionTimes: [],
    snoozeStrategy: '',
    reminderBehavior: '',
  });

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const buildOnboardingPayload = () => {
    const responses = [
      {
        question: questions[1].title,
        answers: data.forgetTypes.map((id) => getOptionLabel(1, id)),
      },
      {
        question: questions[2].title,
        answers: data.completionTimes.map((id) => getOptionLabel(2, id)),
      },
      {
        question: questions[3].title,
        answers: data.snoozeStrategy ? [getOptionLabel(3, data.snoozeStrategy)] : [],
      },
      {
        question: questions[4].title,
        answers: data.reminderBehavior ? [getOptionLabel(4, data.reminderBehavior)] : [],
      },
    ];
    return { responses };
  };

  const goToNext = async () => {
    console.log('Current onboarding data:', data,currentIndex);
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: width * nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      setIsSubmitting(true);
      try {
        const payload = buildOnboardingPayload();
        submitOnboarding(payload).catch((err) => {
          console.error('Onboarding submission failed:', err);
        });
        completeOnboarding();
        router.replace('/(tabs)');
      } catch (err) {
        console.error('Onboarding submit error:', err);
        Alert.alert(
          'Something went wrong',
          'We couldn’t save your preferences. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSelection = (questionIndex: number, optionId: string) => {
    const question = questions[questionIndex];

    if (questionIndex === 1) {
      if (data.forgetTypes.includes(optionId)) {
        setData({ ...data, forgetTypes: data.forgetTypes.filter(id => id !== optionId) });
      } else {
        setData({ ...data, forgetTypes: [...data.forgetTypes, optionId] });
      }
    } else if (questionIndex === 2) {
      if (data.completionTimes.includes(optionId)) {
        setData({ ...data, completionTimes: data.completionTimes.filter(id => id !== optionId) });
      } else {
        if (question.maxSelection && data.completionTimes.length >= question.maxSelection) {
          return;
        }
        setData({ ...data, completionTimes: [...data.completionTimes, optionId] });
      }
    } else if (questionIndex === 3) {
      setData({ ...data, snoozeStrategy: optionId });
    } else if (questionIndex === 4) {
      setData({ ...data, reminderBehavior: optionId });
    }
  };

  const isSelected = (questionIndex: number, optionId: string) => {
    if (questionIndex === 1) return data.forgetTypes.includes(optionId);
    if (questionIndex === 2) return data.completionTimes.includes(optionId);
    if (questionIndex === 3) return data.snoozeStrategy === optionId;
    if (questionIndex === 4) return data.reminderBehavior === optionId;
    return false;
  };

  const canProceed = () => {
    if (currentIndex === 0) return true;
    if (currentIndex === 1) return data.forgetTypes.length > 0;
    if (currentIndex === 2) return data.completionTimes.length > 0;
    if (currentIndex === 3) return data.snoozeStrategy !== '';
    if (currentIndex === 4) return data.reminderBehavior !== '';
    return false;
  };

  const renderWelcome = () => (
    <View style={styles.pageContainer}>
      <LinearGradient
        colors={['#FFE5E5', '#E5F0FF', '#F0E5FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentCenter}>
          <View style={styles.lotusContainer}>
            <Text style={styles.lotusEmoji}>🪷</Text>
          </View>
          <Text style={styles.welcomeTitle}>Welcome to Smran</Text>
          <Text style={styles.welcomeSubtitle}>
            Your intelligent reminder companion{'\n'}
            powered by voice and synced everywhere
          </Text>
          <Text style={styles.welcomeDescription}>
            Let's personalize your experience{'\n'}
            to help you remember what matters
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  const renderQuestion = (questionIndex: number) => {
    const question = questions[questionIndex];
    return (
      <View style={styles.pageContainer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerSection}>
            <View style={styles.progressContainer}>
              {questions.slice(1).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressDot,
                    currentIndex >= idx + 1 && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.questionTitle}>{question.title}</Text>
            <Text style={styles.questionSubtitle}>{question.subtitle}</Text>
          </View>

          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
          >
            {question.options?.map((option) => {
              const selected = isSelected(questionIndex, option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    selected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelection(questionIndex, option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.optionLabel,
                      selected && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {selected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canProceed() || isSubmitting) && styles.primaryButtonDisabled,
              ]}
              onPress={goToNext}
              activeOpacity={0.8}
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {currentIndex === questions.length - 1 ? 'Finish' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={false}
      >
        {questions.map((question, index) => (
          <View key={index} style={styles.page}>
            {index === 0 ? renderWelcome() : renderQuestion(index)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  page: {
    width,
    height,
  },
  pageContainer: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lotusContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  lotusEmoji: {
    fontSize: 60,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#60A5FA',
    width: 24,
  },
  questionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 34,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionsScroll: {
    flex: 1,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 17,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  optionLabelSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});