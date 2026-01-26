import { apiClient } from "./client";

export interface RepeatMetadata {
  frequency: "once" | "daily" | "weekly" | "monthly" | "yearly" | "WEEKLY" | "DAILY";
  time_of_day?: string; // "HH:mm"
  timezone?: string;
  start_datetime?: string; // ISO string
  start_date?: string;
  end_date?: string;
  interval?: number | string;
  weekdays?: string[]; // ["Mon", "Wed", "Fri"]
  days?: string[];
  days_of_week?: string[];
  month_day?: number;
  nth_weekday?: {
    weekday: string;
    n: number | "last";
  };
  ends?: "never" | "on_date" | "after_occurrences";
  occurrences?: number;
  duration?: string;
}

export interface LinkMetadata {
  title?: string;
  image?: string;
}

export interface ReminderResponse {
  id: string;
  name: string;
  link?: string | null;
  status: "active" | "paused";
  repeat_metadata: RepeatMetadata;
  next_run_time: string | null; // ISO string with offset
  link_metadata?: LinkMetadata | null;
}

export interface CreateReminderPayload {
  user_id: number | null;
  name: string;
  link?: string | null;
  repeat_metadata: RepeatMetadata;
}

export const getReminders = async (): Promise<ReminderResponse[]> => {
  return apiClient<ReminderResponse[]>("/reminders/", { useAuth: true });
};

export const createReminder = async (payload: CreateReminderPayload): Promise<ReminderResponse> => {
  return apiClient<ReminderResponse>("/reminders/", {
    method: "POST",
    body: JSON.stringify(payload),
    useAuth: true,
  });
};

export const updateReminderStatus = async (id: string, status: "active" | "paused"): Promise<ReminderResponse> => {
  return apiClient<ReminderResponse>(`/reminders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    useAuth: true,
  });
};

export const deleteReminder = async (id: string): Promise<void> => {
  return apiClient<void>(`/reminders/${id}/`, {
    method: "DELETE",
    useAuth: true,
  });
};
