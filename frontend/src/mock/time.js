/**
 * Relative time helpers for the mock dataset.
 *
 * All fixtures are built relative to "now" so that "Today", "Upcoming" and
 * "Overdue" views stay meaningful whenever the app is opened, instead of
 * decaying into a wall of past dates.
 */

const DAY_MS = 86_400_000;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/** ISO timestamp for a given day offset and wall-clock time. */
export function at(dayOffset, hour = 9, minute = 0) {
  const date = startOfToday();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function today(hour = 9, minute = 0) {
  return at(0, hour, minute);
}

export function daysAgo(days, hour = 10, minute = 0) {
  return at(-days, hour, minute);
}

export function daysAhead(days, hour = 10, minute = 0) {
  return at(days, hour, minute);
}

/** Minutes relative to the current moment — used for "just now" activity. */
export function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export function yearsAgo(years, month = 5, day = 12) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years, month, day);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/** Labels for the last `count` months, oldest first: ["Sep", "Oct", ...] */
export function recentMonthLabels(count = 6) {
  const labels = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let index = count - 1; index >= 0; index -= 1) {
    const month = new Date(cursor);
    month.setMonth(cursor.getMonth() - index);
    labels.push(month.toLocaleDateString("en-GB", { month: "short" }));
  }

  return labels;
}

/** Labels for the last `count` days, oldest first: ["Mon", "Tue", ...] */
export function recentDayLabels(count = 7) {
  const labels = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const day = new Date(Date.now() - index * DAY_MS);
    labels.push(day.toLocaleDateString("en-GB", { weekday: "short" }));
  }

  return labels;
}

export { DAY_MS };
