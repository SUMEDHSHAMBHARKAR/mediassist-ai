import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import { calculateAge, formatDate, formatRelative, orDash } from "../../utils/format";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Icon from "../ui/Icon";
import StatusBadge from "./StatusBadge";

/**
 * PatientCard — patient summary for grid views.
 *
 * Allergies are surfaced on the card rather than buried in the record: they are
 * the single most safety-relevant field on a patient summary.
 */
function PatientCard({ patient, actions, className }) {
  const age = calculateAge(patient.dob);

  return (
    <article className={cx("card", className)} style={{ display: "flex", flexDirection: "column" }}>
      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top">
          <div className="row row--loose" style={{ minWidth: 0 }}>
            <Avatar name={patient.name} size="lg" square accent />
            <div className="col col--gap-xxs" style={{ minWidth: 0 }}>
              <Link to={`/patients/${patient.id}`} className="t-title-sm t-ink t-truncate">
                {patient.name}
              </Link>
              <span className="t-caption">{patient.mrn}</span>
              <span className="t-caption">
                {age !== null ? `${age} yrs` : "—"} · {orDash(patient.bloodGroup)}
              </span>
            </div>
          </div>

          <StatusBadge kind="patient" value={patient.status} />
        </div>

        <div className="divider" />

        <div className="col col--gap-xs">
          {patient.conditions?.length > 0 ? (
            <div className="row row--tight row--wrap">
              {patient.conditions.slice(0, 2).map((condition) => (
                <Badge key={condition} tone="outline">
                  {condition}
                </Badge>
              ))}
              {patient.conditions.length > 2 && (
                <Badge tone="muted">+{patient.conditions.length - 2}</Badge>
              )}
            </div>
          ) : (
            <span className="t-caption">No recorded conditions</span>
          )}

          {patient.allergies?.length > 0 && (
            <span className="row row--tight t-caption t-critical">
              <Icon name="alertTriangle" size={13} />
              Allergies: {patient.allergies.join(", ")}
            </span>
          )}
        </div>

        <div className="meta">
          <span className="meta__item">
            <Icon name="history" size={13} />
            Seen {formatRelative(patient.lastVisitAt)}
          </span>
          {patient.nextAppointmentAt && (
            <>
              <span className="meta__sep" aria-hidden="true" />
              <span className="meta__item">
                <Icon name="appointments" size={13} />
                {formatDate(patient.nextAppointmentAt)}
              </span>
            </>
          )}
        </div>
      </div>

      <footer className="card__foot">
        <Link to={`/patients/${patient.id}`} className="text-link text-link--sm">
          Open record
          <Icon name="arrowRight" size={13} />
        </Link>
        {actions && <div className="row row--tight">{actions}</div>}
      </footer>
    </article>
  );
}

export default PatientCard;
