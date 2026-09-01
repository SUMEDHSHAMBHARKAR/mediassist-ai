import { Link } from "react-router-dom";

import { departmentLabel } from "../../constants/departments";
import cx from "../../utils/classNames";
import { formatCurrency, formatDateTime } from "../../utils/format";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

const PRESENCE = {
  online: { label: "Available", tone: "success" },
  busy: { label: "In clinic", tone: "warning" },
  off: { label: "Off duty", tone: "muted" },
};

/** DoctorCard — clinician summary with availability and a booking entry point. */
function DoctorCard({ doctor, actions, className }) {
  const presence = PRESENCE[doctor.status] || PRESENCE.off;

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
              status={doctor.status}
            />
            <div className="col col--gap-xxs" style={{ minWidth: 0 }}>
              <Link to={`/doctors/${doctor.id}`} className="t-title-sm t-ink t-truncate">
                {doctor.name}
              </Link>
              <span className="t-caption t-truncate">{doctor.specialisation}</span>
              <span className="t-label t-label--sm">
                {departmentLabel(doctor.department)}
              </span>
            </div>
          </div>

          <Badge tone={presence.tone} dot>
            {presence.label}
          </Badge>
        </div>

        <div className="divider" />

        <div className="row row--between row--wrap">
          <span className="row row--tight t-caption">
            <Icon name="star" size={13} className="t-warning" />
            <span className="t-ink">{doctor.rating}</span>
            <span>({doctor.reviewCount})</span>
          </span>
          <span className="t-caption">{doctor.experienceYears} yrs experience</span>
        </div>

        <div className="meta">
          <span className="meta__item">
            <Icon name="mapPin" size={13} />
            {doctor.room}
          </span>
          <span className="meta__sep" aria-hidden="true" />
          <span className="meta__item">
            <Icon name="cash" size={13} />
            {formatCurrency(doctor.consultationFee)}
          </span>
        </div>

        <div className="card--soft" style={{ padding: "var(--s-xs) var(--s-sm)" }}>
          <span className="t-caption">
            {doctor.acceptingNew ? "Next available" : "Not accepting new patients · next"}
          </span>
          <div className="t-data t-ink">{formatDateTime(doctor.nextAvailable)}</div>
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
