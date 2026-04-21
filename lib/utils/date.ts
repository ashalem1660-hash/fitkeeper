import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

// Israeli week: Sunday → Saturday
export const WEEK_STARTS_ON = 0 as const;

export const HEBREW_DAYS_SHORT = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
export const HEBREW_DAYS_FULL = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];
export const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export function getWeekDays(ref: Date) {
  const start = startOfWeek(ref, { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getWeekRange(ref: Date) {
  return {
    start: startOfWeek(ref, { weekStartsOn: WEEK_STARTS_ON }),
    end: endOfWeek(ref, { weekStartsOn: WEEK_STARTS_ON }),
  };
}

export function toISODate(d: Date) {
  // YYYY-MM-DD in local time (not UTC) — avoids day shifts
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hebrewFormat(d: Date) {
  return `${HEBREW_DAYS_FULL[d.getDay()]}, ${d.getDate()} ${
    HEBREW_MONTHS[d.getMonth()]
  }`;
}

export function hebrewFormatShort(d: Date) {
  return `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()].slice(0, 3)}`;
}

export { isSameDay, parseISO, startOfDay, subDays, format, addDays };
