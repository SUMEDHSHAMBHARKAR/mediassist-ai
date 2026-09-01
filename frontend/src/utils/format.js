/**
 * Formatting helpers — presentation-only. No domain logic lives here.
 *
 * All date input is expected as an ISO-8601 string (what the FastAPI backend
 * returns) or a Date. Invalid input degrades to an em dash rather than
 * throwing, so a malformed record never blanks a whole page.
 */

const EMPTY = "—";

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "14 Mar 2026" */
export function formatDate(value) {
  const date = toDate(value);
  if (!date) return EMPTY;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "14 Mar" — used in dense rows where the year is implied. */
export function formatDateShort(value) {
  const date = toDate(value);
  if (!date) return EMPTY;

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** "09:30" */
export function formatTime(value) {
  const date = toDate(value);
  if (!date) return EMPTY;

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "14 Mar 2026 · 09:30" */
export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return EMPTY;

  return `${formatDate(date)} · ${formatTime(date)}`;
}

/** "Mar 2026" — chart axis labels. */
export function formatMonth(value) {
  const date = toDate(value);
  if (!date) return EMPTY;

  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

/** Relative age of an event: "just now", "4h ago", "3d ago", then a date. */
export function formatRelative(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return EMPTY;

  const diffMs = now.getTime() - date.getTime();
  const future = diffMs < 0;
  const mins = Math.round(Math.abs(diffMs) / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return future ? `in ${hours}h` : `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return future ? `in ${days}d` : `${days}d ago`;

  return formatDate(date);
}

/** Whole years between a date of birth and today. */
export function calculateAge(dob) {
  const date = toDate(dob);
  if (!date) return null;

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
}

/** ISO date portion ("2026-03-14") for <input type="date"> round-tripping. */
export function toDateInputValue(value) {
  const date = toDate(value);
  if (!date) return "";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Currency. Defaults to INR since the mock dataset is India-based. */
export function formatCurrency(amount, { currency = "INR", compact = false } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return EMPTY;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(Number(amount));
}

/** Plain grouped number: 12,480 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return EMPTY;
  }

  return new Intl.NumberFormat("en-IN", options).format(Number(value));
}

/** "62%" */
export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return EMPTY;
  }

  return `${Number(value).toFixed(digits)}%`;
}

/** Byte sizes for report attachments. */
export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return EMPTY;
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

/** Up to two initials from a person's name. */
export function initials(name = "") {
  const parts = String(name)
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "in-progress" -> "In progress" */
export function humanize(value = "") {
  const text = String(value).replace(/[_-]+/g, " ").trim();
  return text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : EMPTY;
}

/** Trim long prose for card excerpts without cutting mid-word. */
export function truncate(text = "", max = 120) {
  const value = String(text);
  if (value.length <= max) return value;

  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

/** Guard for rendering possibly-absent record fields. */
export function orDash(value) {
  if (value === null || value === undefined || value === "") return EMPTY;
  return value;
}

export { EMPTY };
