import { apiClient } from "./client";

export type Frequency = "once" | "daily" | "weekly" | "monthly" | "yearly";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type EndsRule = "never" | "on_date" | "after_occurrences";

export interface NthWeekday {
  weekday: Weekday;
  n: 1 | 2 | 3 | 4 | -1; // 1st..4th or last
}

export interface RepeatMetadata {
  frequency: Frequency;
  time_of_day: string; // "09:00" or "09:00:00" required

  // Optional / Conditional
  interval?: number; // Default 1
  timezone?: string; // "America/Los_Angeles"
  weekdays?: Weekday[]; // ["mon", "wed"]
  month_day?: number; // 1-31
  nth_weekday?: NthWeekday;

  start_date?: string; // "YYYY-MM-DD"
  start_datetime?: string; // ISO

  ends?: EndsRule;
  end_date?: string; // "YYYY-MM-DD"
  occurrences?: number;
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

export const getReminders = async (
  date?: string,
): Promise<{ data: ReminderResponse[] }> => {
  const url = date ? `/reminders/?date=${date}` : "/reminders/";
  return apiClient<{ data: ReminderResponse[] }>(url, {
    useAuth: true,
  });
};

export const createReminder = async (
  payload: CreateReminderPayload,
): Promise<ReminderResponse> => {
  return apiClient<ReminderResponse>("/reminders/", {
    method: "POST",
    body: JSON.stringify(payload),
    useAuth: true,
  });
};

export const updateReminderStatus = async (
  id: string,
  status: "active" | "paused",
): Promise<ReminderResponse> => {
  return apiClient<ReminderResponse>(`/reminders/${id}`, {
    method: "PUT",
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

export const dismissSync = async (
  reminder_id: string,
  device_id: string,
): Promise<void> => {
  return apiClient<void>(`/true_sync/DISMISS`, {
    method: "POST",
    useAuth: true,
    body: JSON.stringify({ reminder_id: reminder_id, device_id: device_id }),
  });
};
