import { Reminder } from "@/store/reminderStore";

export interface ReminderSection {
  title: string;
  dateString: string;
  data: Reminder[];
}

export function groupRemindersByDate(reminders: Reminder[]): ReminderSection[] {
  if (!reminders || reminders.length === 0) return [];
  //   console.log("reminders", reminders);
  // Helper to get normalized date string (YYYY-MM-DD)
  const getDateKey = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper to parse reminder time
  const getReminderDate = (r: Reminder): Date | null => {
    if (r.next_run_time) return new Date(r.next_run_time);

    // Fallback: use today + time_of_day if it's a daily/recurring one that hasn't computed next_run_time yet
    // But ideally next_run_time should be present.
    // If not, we try to use start_date or created_at as a fallback for "when this appears"
    if (r.repeat_metadata?.start_datetime)
      return new Date(r.repeat_metadata.start_datetime);
    if (r.repeat_metadata?.start_date)
      return new Date(r.repeat_metadata.start_date);

    // If we only have time_of_day, assume it is for "today" effectively?
    // Or just put it at the end.
    return new Date();
  };

  const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  //   console.log("today", today);
  //   console.log("tomorrow", tomorrow);

  const sectionsMap = new Map<string, Reminder[]>();

  reminders.forEach((r) => {
    const rDate = getReminderDate(r);
    // console.log("rDate for reminder", r.name, " : ", rDate);
    if (!rDate) return;

    // Check if it's in the past (before today)
    const checkDate = new Date(rDate);
    // console.log("checkDate for reminder", r.name, " : ", checkDate);
    // checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      // Option: Add to "Overdue" or ignore. User said "starting from today".
      // Let's ignore strictly past items for now, or maybe they should be shown as overdue on "Today"?
      // Todoist shows overdue at the top. Let's group them under "Overdue" or "Today" with a warning?
      // For simplicity and "diary starting from today", let's map them to Today or separate Overdue.
      // Let's put them in a separate "Overdue" bucket if we want, or just stick to the request "starting from today" literal meaning.
      // Interpretation: "Day wise, starting from today" -> exclude yesterday.
      // But if I missed a task yesterday, I probably want to see it.
      // I will perform a soft check: if it is overdue and status is active, show in "Overdue".
      //   if (r.status === "active") {
      //     const key = "Overdue";
      //     if (!sectionsMap.has(key)) sectionsMap.set(key, []);
      //     sectionsMap.get(key)?.push(r);
      //   }
      return;
    }

    const key = getDateKey(rDate);
    if (!sectionsMap.has(key)) {
      sectionsMap.set(key, []);
    }
    sectionsMap.get(key)?.push(r);
  });

  // Sort keys
  const sortedKeys = Array.from(sectionsMap.keys()).sort();

  const sections: ReminderSection[] = [];

  // Special handling for Overdue
  //   if (sectionsMap.has("Overdue")) {
  //     sections.push({
  //       title: "Overdue",
  //       data: sectionsMap.get("Overdue")!.sort(compareTime),
  //     });
  //   }

  sortedKeys.forEach((key) => {
    if (key === "Overdue") return; // Handled above

    const date = new Date(key);
    let title = "";
    let dateString = "";

    if (key === getDateKey(today)) {
      title = "Today";
      dateString = `${today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
    } else if (key === getDateKey(tomorrow)) {
      title = "Tomorrow";
      dateString = `${tomorrow.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
    } else {
      dateString = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }

    const tasks = sectionsMap.get(key) || [];
    sections.push({
      title,
      dateString,
      data: tasks.sort(compareTime),
    });
  });

  return sections;
}

function compareTime(a: Reminder, b: Reminder): number {
  const getTimestamp = (r: Reminder) => {
    if (r.next_run_time) return new Date(r.next_run_time).getTime();
    if (r.repeat_metadata?.time_of_day) {
      // Create a dummy date with this time
      return new Date(
        `2000-01-01T${r.repeat_metadata.time_of_day}:00`,
      ).getTime();
    }
    return 0; // No time specified
  };
  return getTimestamp(a) - getTimestamp(b);
}
