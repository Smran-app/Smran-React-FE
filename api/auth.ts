import { Platform } from "react-native";
import { apiClient } from "./client";

export interface DeviceInfo {
  device_token: string;
  device_type: string;
  name: string;
  id?: string;
}

export interface AuthPayload {
  id_token: string;
  device: DeviceInfo;
}

export interface UserDetail {
  id: number;
  first_name: string | null;
  last_name: string | null;
  profile_img_url: string | null;
  phone_number: string;
  email: string;
  created_at: string;
  devices: any[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user?: UserDetail;
  device?: DeviceInfo;
  is_new_user?: boolean;
  is_onboarding_completed?: boolean;
}

export type AuthProvider = "google" | "apple";

/**
 * Get current user details
 */
export const getCurrentUser = async (): Promise<UserDetail> => {
  return apiClient<UserDetail>("/users/me", {
    method: "GET",
    useAuth: true,
  });
};

/**
 * Login with Google or Apple
 * @param idToken The token received from Google or Apple sign-in
 * @param provider "google" or "apple"
 * @param deviceToken The push notification device token
 */
export const loginWithBackend = async (
  idToken: string,
  provider: AuthProvider,
  deviceToken: string,
): Promise<AuthResponse> => {
  const payload: AuthPayload = {
    id_token: idToken,
    device: {
      device_token: deviceToken || "unknown_device_token",
      device_type: Platform.OS,
      name: Platform.select({
        ios: "iPhone",
        android: "Android",
        default: "Unknown",
      }),
    },
  };
  const endpoint = provider === "google" ? "/auth/google" : "/auth/apple";

  return apiClient<AuthResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
