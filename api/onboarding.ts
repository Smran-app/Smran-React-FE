import { apiClient } from "./client";

export interface OnboardingResponseItem {
  question: string;
  answers: string[];
}

export interface OnboardingPayload {
  responses: OnboardingResponseItem[];
}

/**
 * Submit onboarding questionnaire responses
 */
export const submitOnboarding = async (
  payload: OnboardingPayload
): Promise<void> => {
  return apiClient<void>("/users/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
    useAuth: true,
  });
};
