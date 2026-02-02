import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from "expo-secure-store";
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';

const ONBOARDING_KEY = 'has_completed_onboarding';

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const router = useRouter();
  const segments = useSegments();

  const onboardingQuery = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
      return value === 'true';
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
      return true;
    },
    onSuccess: () => {
      onboardingQuery.refetch();
    },
  });

  const hasCompletedOnboarding = onboardingQuery.data ?? false;
  const isLoading = onboardingQuery.isLoading;

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    // Only redirect: if user has completed onboarding but is still on the onboarding
    // screen (e.g. back button), send them to tabs. Do NOT redirect to onboarding
    // from other screens (profile, tabs, login, modal) — index.tsx already sends
    // unauthenticated users to /onboarding.
    if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isLoading, segments]);

  return {
    hasCompletedOnboarding,
    isLoading,
    completeOnboarding: completeMutation.mutate,
  };
});