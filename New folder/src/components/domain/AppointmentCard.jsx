import { Link } from "react-router-dom";

import { APPOINTMENT_TYPES, optionLabel } from "../../constants/statuses";
import cx from "../../utils/classNames";
import { formatDate, formatTime, orDash } from "../../utils/format";
import { isSameDay } from "../../utils/collection";
import Icon from "../ui/Icon";
import { Identity } from "../ui/Avatar";
import StatusBadge from "./StatusBadge";

/**
 * AppointmentCard — one appointment as a card.
 *
 * `perspective` decides whose name is prominent: a clinician sees the patient,
 * a patient sees the clinician. Both are shown, only the hierarchy changes.
 */
function AppointmentCard({
  appointment,
  patient,
  doctor,
  perspective = "doctor",
  actions,
  compact = false,
  className,
}) {
  const start = new Date(appointment.startsAt);
  const isToday = isSameDay(start);

  const person = perspective === "doctor" ? patient : doctor;
  const personMeta =
    perspective === "doctor"
      ? patient?.mrn
      : doctor?.specialisation;

  return (
    <article
      className={cx("card", isToday && "card--accent", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        className="card__body card__body--tight col col--gap-sm"
        style={{ flex: "1 1 auto" }}
      >
        <div className="row row--between row--top row--wrap">
          <div className="col col--gap-xxs">
            <span className="row row--tight">
              <Icon name="clock" size={14} className="t-muted" />
              <span className="t-title-sm t-tabular" style={{ fontWeight: 700 }}>
                {formatTime(appointment.startsAt)}
              </span>
              <span className="t-caption">· {appointment.durationMinutes} min</span>
            </span>
            <span className="t-caption">
              {isToday ? "Today" : formatDate(appointment.startsAt)}
            </span>
          </div>

          <StatusBadge kind="appointment" value={appointment.status} />
        </div>

        <div className="divider" />

        <Link
          to={
            perspective === "doctor"
              ? `/patients/${appointment.patientId}`
              : `/doctors/${appointment.doctorId}`
          }
        >
          <Identity
            name={person?.name || "Unknown"}
            meta={orDash(personMeta)}
            size="sm"
            accent
          />
        </Link>

        {!compact && (
          <p className="t-body-sm t-strong t-clamp-2">{appointment.reason}</p>
        )}

        <div className="meta">
          <span className="meta__item">
            <Icon name="appointments" size={13} />
            {optionLabel(APPOINTMENT_TYPES, appointment.type)}
          </span>
          <span className="meta__sep" aria-hidden="true" />
          <span className="meta__item">
            <Icon name="mapPin" size={13} />
            {orDash(appointment.room)}
          </span>
          {perspective === "doctor" && doctor && (
            <>
              <span className="meta__sep" aria-hidden="true" />
              <span className="meta__item t-truncate">{doctor.name}</span>
            </>
          )}
        </div>
      </div>

      <footer className="card__foot">
        <Link
          to={`/appointments/${appointment.id}`}
          className="text-link text-link--sm"
        >
          Open
          <Icon name="arrowRight" size={13} />
        </Link>

        {actions && <div className="row row--tight">{actions}</div>}
      </footer>
    </article>
  );
}

/**
 * AppointmentRow — dense list variant for schedules and "today" panels, where a
 * grid of cards would waste vertical space.
 */
export function AppointmentRow({
  appointment,
  patient,
  doctor,
  perspective = "doctor",
  trailing,
}) {
  const person = perspective === "doctor" ? patient : doctor;

  return (
    <Link to={`/appointments/${appointment.id}`} className="list__row list__row--link">
      <div className="col col--gap-xxs" style={{ minWidth: 62, flex: "none" }}>
        <span className="t-data t-ink t-tabular" style={{ fontWeight: 700 }}>
          {formatTime(appointment.startsAt)}
        </span>
        <span className="t-caption">{appointment.durationMinutes}m</span>
      </div>

      <div className="divider--vert" aria-hidden="true" />

      <div className="grow col col--gap-xxs">
        <span className="t-data t-ink t-truncate">{person?.name || "Unknown"}</span>
        <span className="t-caption t-truncate">{appointment.reason}</span>
      </div>

      {trailing}
      <StatusBadge kind="appointment" value={appointment.status} />
    </Link>
  );
}

export default AppointmentCard;
