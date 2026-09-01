import { Link } from "react-router-dom";

import { APPOINTMENT_TYPES, optionLabel } from "../../constants/statuses";
import cx from "../../utils/classNames";
import { formatDate, orDash } from "../../utils/format";
import { isSameDay } from "../../utils/collection";
import Icon from "../ui/Icon";
import { Identity } from "../ui/Avatar";
import StatusBadge from "./StatusBadge";

function AppointmentCard({
  appointment,
  patient,
  doctor,
  perspective = "doctor",
  actions,
  compact = false,
  className,
}) {
  const dateVal = appointment.appointment_date || appointment.startsAt;
  const isToday = isSameDay(dateVal);

  const person = perspective === "doctor" ? patient : doctor;
  const personMeta =
    perspective === "doctor"
      ? patient?.mobile_no || patient?.phone
      : doctor?.qualification || doctor?.specialisation;

  const targetId = perspective === "doctor"
    ? (appointment.patient_id || appointment.patientId)
    : (appointment.doctor_id || appointment.doctorId);

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
                {appointment.appointment_time || "09:00:00"}
              </span>
            </span>
            <span className="t-caption">
              {isToday ? "Today" : formatDate(dateVal)}
            </span>
          </div>

          <StatusBadge kind="appointment" value={appointment.status || "Scheduled"} />
        </div>

        <div className="divider" />

        <Link to={perspective === "doctor" ? `/patients/${targetId}` : `/doctors/${targetId}`}>
          <Identity
            name={person?.name || `ID #${targetId}`}
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
            {optionLabel(APPOINTMENT_TYPES, appointment.appointment_type || appointment.type || "General")}
          </span>
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

export function AppointmentRow({
  appointment,
  patient,
  doctor,
  perspective = "doctor",
  trailing,
}) {
  const person = perspective === "doctor" ? patient : doctor;
  const targetId = perspective === "doctor"
    ? (appointment.patient_id || appointment.patientId)
    : (appointment.doctor_id || appointment.doctorId);

  return (
    <Link to={`/appointments/${appointment.id}`} className="list__row list__row--link">
      <div className="col col--gap-xxs" style={{ minWidth: 70, flex: "none" }}>
        <span className="t-data t-ink t-tabular" style={{ fontWeight: 700 }}>
          {appointment.appointment_time || "09:00:00"}
        </span>
        <span className="t-caption">{formatDate(appointment.appointment_date || appointment.startsAt)}</span>
      </div>

      <div className="divider--vert" aria-hidden="true" />

      <div className="grow col col--gap-xxs">
        <span className="t-data t-ink t-truncate">{person?.name || `ID #${targetId}`}</span>
        <span className="t-caption t-truncate">{appointment.reason}</span>
      </div>

      {trailing}
      <StatusBadge kind="appointment" value={appointment.status || "Scheduled"} />
    </Link>
  );
}

export default AppointmentCard;
