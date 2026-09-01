import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import { calculateAge, orDash } from "../../utils/format";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";

/**
 * PatientCard — patient summary for grid views rendering real FastAPI patient data.
 */
function PatientCard({ patient, actions, className }) {
  const age = calculateAge(patient.date_of_birth || patient.dob);

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
              <span className="t-caption">
                {age !== null ? `${age} yrs` : "—"} · {orDash(patient.gender)}
              </span>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="col col--gap-xs">
          <span className="t-caption row row--tight">
            <Icon name="phone" size={13} />
            {orDash(patient.mobile_no)}
          </span>
          <span className="t-caption row row--tight">
            <Icon name="location" size={13} />
            {orDash(patient.address)}
          </span>
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
