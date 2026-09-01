import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import { formatCurrency, orDash } from "../../utils/format";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

/** DoctorCard — clinician summary rendering real FastAPI doctor fields. */
function DoctorCard({ doctor, actions, className }) {
  const isAvailable = doctor.is_available ?? doctor.is_active ?? true;
  const presence = isAvailable
    ? { label: "Available", tone: "success" }
    : { label: "Off duty", tone: "muted" };

  const experience = doctor.experience_years ?? doctor.experienceYears ?? 0;
  const fee = doctor.consultation_fee ?? doctor.consultationFee ?? 0;
  const qualification = doctor.qualification || doctor.specialisation || "Medical Specialist";
  const room = doctor.room_number ? `Room ${doctor.room_number}` : doctor.room;

  return (
    <article className={cx("card", className)} style={{ display: "flex", flexDirection: "column" }}>
      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top">
          <div className="row row--loose" style={{ minWidth: 0 }}>
            <Avatar
              name={doctor.name}
              size="lg"
              square
              accent
              status={isAvailable ? "online" : "off"}
            />
            <div className="col col--gap-xxs" style={{ minWidth: 0 }}>
              <Link to={`/doctors/${doctor.id}`} className="t-title-sm t-ink t-truncate">
                {doctor.name}
              </Link>
              <span className="t-caption t-truncate">{qualification}</span>
            </div>
          </div>

          <Badge tone={presence.tone} dot>
            {presence.label}
          </Badge>
        </div>

        <div className="divider" />

        <div className="row row--between row--wrap">
          <span className="t-caption">{experience} yrs experience</span>
          <span className="t-caption">{orDash(doctor.phone)}</span>
        </div>

        <div className="meta">
          {room && (
            <>
              <span className="meta__item">
                <Icon name="mapPin" size={13} />
                {room}
              </span>
              <span className="meta__sep" aria-hidden="true" />
            </>
          )}
          <span className="meta__item">
            <Icon name="cash" size={13} />
            {formatCurrency(fee)}
          </span>
        </div>
      </div>

      <footer className="card__foot">
        <Link to={`/doctors/${doctor.id}`} className="text-link text-link--sm">
          Profile
          <Icon name="arrowRight" size={13} />
        </Link>

        {actions || (
          <Button
            size="sm"
            variant="outline"
            icon="calendarPlus"
            to={`/appointments/book?doctorId=${doctor.id}`}
          >
            Book
          </Button>
        )}
      </footer>
    </article>
  );
}

export default DoctorCard;
