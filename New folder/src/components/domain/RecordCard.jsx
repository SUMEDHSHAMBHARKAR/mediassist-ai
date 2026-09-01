import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import { formatDate, orDash } from "../../utils/format";
import Icon from "../ui/Icon";
import StatusBadge from "./StatusBadge";

/**
 * RecordCard — one clinical encounter.
 *
 * The diagnosis is the card's title because that is what clinicians scan for;
 * the date and clinician are supporting metadata.
 */
function RecordCard({ record, patient, doctor, showPatient = true, actions, className }) {
  const isCritical = record.severity === "critical";

  return (
    <article
      className={cx("card", isCritical && "card--critical", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {isCritical && <div className="card__stripe" aria-hidden="true" />}

      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top row--wrap">
          <span className="t-label t-label--sm">{formatDate(record.visitDate)}</span>
          <StatusBadge kind="severity" value={record.severity} />
        </div>

        <Link to={`/medical-records/${record.id}`} className="t-title-sm t-ink">
          {record.diagnosis}
        </Link>

        {record.icdCode && <span className="t-mono t-muted">{record.icdCode}</span>}

        {record.chiefComplaint && (
          <p className="t-body-sm t-clamp-2">{record.chiefComplaint}</p>
        )}

        <div className="divider" />

        <div className="meta">
          {showPatient && patient && (
            <>
              <span className="meta__item">
                <Icon name="patients" size={13} />
                <Link to={`/patients/${patient.id}`} className="t-strong">
                  {patient.name}
                </Link>
              </span>
              <span className="meta__sep" aria-hidden="true" />
            </>
          )}
          <span className="meta__item t-truncate">
            <Icon name="doctors" size={13} />
            {orDash(doctor?.name)}
          </span>
          {record.attachmentCount > 0 && (
            <>
              <span className="meta__sep" aria-hidden="true" />
              <span className="meta__item">
                <Icon name="paperclip" size={13} />
                {record.attachmentCount}
              </span>
            </>
          )}
        </div>
      </div>

      <footer className="card__foot">
        <Link to={`/medical-records/${record.id}`} className="text-link text-link--sm">
          Open record
          <Icon name="arrowRight" size={13} />
        </Link>
        {actions && <div className="row row--tight">{actions}</div>}
      </footer>
    </article>
  );
}

export default RecordCard;
