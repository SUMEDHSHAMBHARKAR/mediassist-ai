import cx from "../../utils/classNames";
import { EmptyState } from "../ui/States";

/**
 * SlotPicker — day strip plus a grid of bookable times.
 *
 * Shared by the clinician profile (read-only availability) and the booking flow
 * (selectable). Unavailable slots stay visible but struck through, so a clinic's
 * shape is legible rather than a grid of gaps.
 *
 * days: [{ dayOffset, date, closed, slots: [{ time, startsAt, available }], freeCount }]
 */
function SlotPicker({
  days = [],
  selectedDay = 0,
  onSelectDay,
  selectedSlot,
  onSelectSlot,
  readOnly = false,
  className,
}) {
  const active = days.find((day) => day.dayOffset === selectedDay) || days[0];

  return (
    <div className={cx("col col--gap-md", className)}>
      <div className="daystrip">
        {days.map((day) => {
          const date = new Date(day.date);

          return (
            <button
              type="button"
              key={day.dayOffset}
              className={cx(
                "daystrip__day",
                day.dayOffset === active?.dayOffset && "is-selected",
              )}
              onClick={() => onSelectDay?.(day.dayOffset)}
              disabled={day.closed}
              aria-pressed={day.dayOffset === active?.dayOffset}
            >
              <span className="daystrip__dow">
                {date.toLocaleDateString("en-GB", { weekday: "short" })}
              </span>
              <span className="daystrip__num">{date.getDate()}</span>
              <span className="daystrip__free">
                {day.closed ? "Closed" : `${day.freeCount} free`}
              </span>
            </button>
          );
        })}
      </div>

      {!active || active.closed ? (
        <EmptyState
          size="inline"
          icon="calendarX"
          title="No clinic on this day"
          message="Pick another day from the strip above."
        />
      ) : active.freeCount === 0 ? (
        <EmptyState
          size="inline"
          icon="calendarX"
          title="Fully booked"
          message="Every slot on this day is taken. Try the next available day."
        />
      ) : (
        <div className="slotgrid" role="group" aria-label="Available times">
          {active.slots.map((slot) => (
            <button
              type="button"
              key={slot.time}
              className={cx("slot", selectedSlot === slot.startsAt && "is-selected")}
              disabled={!slot.available || readOnly}
              onClick={() => onSelectSlot?.(slot)}
              aria-pressed={selectedSlot === slot.startsAt}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SlotPicker;
