import { apiClient } from "./client";

export interface ReminderProfileSettings {
  notify_on: {
    mode: "all" | "others";
    devices: string[];
  };
  notify_before: {
    unit: "minutes" | "hours";
    amount: number;
  };
  snooze_duration: {
    unit: "minutes" | "hours";
    amount: number;
  };
}

export interface ReminderProfileResponse {
  id: string;
  name: string;
  description: string;
  settings: ReminderProfileSettings;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderProfilePayload {
  name: string;
  description?: string;
  settings: ReminderProfileSettings;
}

export type UpdateReminderProfilePayload = CreateReminderProfilePayload;

/**
 * Get all reminder profiles for the current user
 */
export const getReminderProfiles = async (): Promise<
  ReminderProfileResponse[]
> => {
  return apiClient<ReminderProfileResponse[]>("/reminder-profiles/", {
    method: "GET",
    useAuth: true,
  });
};

/**
 * Create a new reminder profile
 */
export const createReminderProfile = async (
  payload: CreateReminderProfilePayload,
): Promise<ReminderProfileResponse> => {
  return apiClient<ReminderProfileResponse>("/reminder-profiles/", {
    method: "POST",
    body: JSON.stringify(payload),
    useAuth: true,
  });
};

/**
 * Update an existing reminder profile
 */
export const updateReminderProfile = async (
  id: string,
  payload: UpdateReminderProfilePayload,
): Promise<ReminderProfileResponse> => {
  return apiClient<ReminderProfileResponse>(`/reminder-profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    useAuth: true,
  });
};
