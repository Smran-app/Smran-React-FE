import { apiClient } from "./client";

export interface RepeatMetadata {
  frequency: "once" | "daily" | "weekly" | "monthly" | "yearly";
  time_of_day: string; // "HH:mm"
  timezone: string;
  start_datetime?: string; // ISO string
  interval?: number;
  weekdays?: string[]; // ["Mon", "Wed", "Fri"]
  month_day?: number;
  nth_weekday?: {
    weekday: string;
    n: number | "last";
  };
  ends?: "never" | "on_date" | "after_occurrences";
  end_date?: string;
  occurrences?: number;
}

export interface ReminderResponse {
  id: string;
  name: string;
  link?: string | null;
  status: "active" | "paused";
  repeat_metadata: RepeatMetadata;
  next_run_time: string; // ISO string with offset
}

export interface CreateReminderPayload {
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
