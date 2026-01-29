import { RepeatMetadata, Weekday } from "@/api/reminders";

// Helper: Map "mon" to 1 (Monday) ... "sun" to 0 (Sunday)
const WEEKDAY_MAP: Record<Weekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function generateOccurrenceDates(
  metadata: RepeatMetadata,
  limit = 20,
): Date[] {
  const dates: Date[] = [];
  // console.log("Generating occurrences for:", metadata);
  // 1. Determine Start Basis
  let current = getStartDate(metadata);

  // 2. Parse Time of Day (HH:MM)
  if (!metadata.time_of_day) {
    console.warn(
      "Reminder missing time_of_day, skipping occurrence generation:",
      metadata,
    );
    return [];
  }
  const [hour, minute] = metadata.time_of_day.split(":").map(Number);
  current.setHours(hour, minute, 0, 0);

  // 3. Short-circuit for "once" frequency
  if (metadata.frequency === "once") {
    if (current.getTime() > Date.now()) {
      dates.push(new Date(current));
    }
    return dates;
  }

  // 4. Loop to find occurrences
  let count = 0;
  // Safety break after 365 iterations to prevent infinite loops
  while (count < limit && count < 365) {
    // Check End Rules
    if (metadata.ends === "on_date" && metadata.end_date) {
      if (current > new Date(metadata.end_date)) break;
    }
    if (metadata.ends === "after_occurrences" && metadata.occurrences) {
      if (dates.length >= metadata.occurrences) break;
    }

    // Check if 'current' matches specific constraints (e.g. Weekdays)
    if (isValidOccurrence(current, metadata)) {
      // Avoid adding dates in the past
      if (current.getTime() > Date.now()) {
        dates.push(new Date(current));
      }
    }

    // Increment date based on Frequency & Interval
    current = incrementDate(current, metadata);
    count++;
  }

  return dates;
}

function getStartDate(meta: RepeatMetadata): Date {
  if (meta.start_datetime) return new Date(meta.start_datetime);
  if (meta.start_date) return new Date(meta.start_date);
  return new Date(); // Start today
}

function isValidOccurrence(date: Date, meta: RepeatMetadata): boolean {
  // Weekly Filter
  if (meta.frequency === "weekly" && meta.weekdays) {
    const dayName = Object.keys(WEEKDAY_MAP).find(
      (key) => WEEKDAY_MAP[key as Weekday] === date.getDay(),
    );
    if (!meta.weekdays.includes(dayName as Weekday)) return false;
  }

  // Monthly Filter (Specific Day)
  if (meta.frequency === "monthly" && meta.month_day) {
    if (date.getDate() !== meta.month_day) return false;
  }

  return true;
}

function incrementDate(date: Date, meta: RepeatMetadata): Date {
  const next = new Date(date);
  const interval = meta.interval || 1;

  switch (meta.frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      // If we have specific weekdays, we usually just step 1 day and let the validator catch it,
      // But for simple "Every 2 weeks", we step by week.
      // *Simplification*: Step 1 day to ensure we catch all "Mon/Wed/Fri" inside a week.
      next.setDate(next.getDate() + 1);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + interval);
      break;
    case "once":
      // Move it way into the future to stop the loop
      next.setFullYear(next.getFullYear() + 100);
      break;
  }
  return next;
}
