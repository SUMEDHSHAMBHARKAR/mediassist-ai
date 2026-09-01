import { at } from "./time";

/**
 * Doctor availability — shaped like GET /doctors/{id}/schedules.
 *
 * `weekly` is the recurring template; `slotsByDay` is the derived bookable grid
 * the booking UI consumes. Slots are generated so the picker always has a live
 * next-7-days window.
 */
const WEEKDAY_TEMPLATE = [
  { day: "Monday", start: "09:00", end: "13:00", location: "Outpatient" },
  { day: "Monday", start: "15:00", end: "18:00", location: "Outpatient" },
  { day: "Tuesday", start: "09:00", end: "13:00", location: "Outpatient" },
  { day: "Wednesday", start: "10:00", end: "14:00", location: "Day Care" },
  { day: "Thursday", start: "09:00", end: "13:00", location: "Outpatient" },
  { day: "Thursday", start: "15:00", end: "17:30", location: "Teleconsult" },
  { day: "Friday", start: "09:00", end: "12:30", location: "Outpatient" },
  { day: "Saturday", start: "10:00", end: "13:00", location: "Outpatient" },
];

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

/**
 * Deterministic pseudo-random availability so the grid looks realistic but does
 * not reshuffle on every render.
 */
function isSlotFree(doctorId, dayOffset, slotIndex) {
  const seed =
    doctorId.charCodeAt(doctorId.length - 1) * 17 + dayOffset * 7 + slotIndex * 3;
  return seed % 4 !== 0;
}

/** Bookable slots for a clinician over the next `days` days. */
export function slotsForDoctor(doctorId, days = 7) {
  return Array.from({ length: days }, (_, dayOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const isSunday = date.getDay() === 0;

    const slots = isSunday
      ? []
      : TIME_SLOTS.map((time, slotIndex) => {
          const [hour, minute] = time.split(":").map(Number);
          return {
            time,
            startsAt: at(dayOffset, hour, minute),
            available: isSlotFree(doctorId, dayOffset, slotIndex),
          };
        });

    return {
      dayOffset,
      date: date.toISOString(),
      closed: isSunday,
      slots,
      freeCount: slots.filter((slot) => slot.available).length,
    };
  });
}

export function weeklyScheduleForDoctor(doctorId) {
  // Vary the template slightly per clinician so profiles are not identical.
  const skip = doctorId.charCodeAt(doctorId.length - 1) % 3;
  return WEEKDAY_TEMPLATE.filter((_, index) => index % 4 !== skip);
}

export { WEEKDAY_TEMPLATE, TIME_SLOTS };
