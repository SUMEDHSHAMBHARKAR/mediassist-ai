import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import { formatDate, orDash } from "../../utils/format";
import Icon from "../ui/Icon";

function RecordCard({ record, patient, doctor, showPatient = true, actions, className }) {
  const pId = record.patient_id || record.patientId;
  const visitDate = record.visit_date || record.visitDate;
  const complaint = record.chief_complaint || record.chiefComplaint;

  return (
    <article
      className={cx("card", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top row--wrap">
          <span className="t-label t-label--sm">{formatDate(visitDate)}</span>
        </div>

        <Link to={`/medical-records/${record.id}`} className="t-title-sm t-ink">
          {record.diagnosis}
        </Link>

        {complaint && (
          <p className="t-body-sm t-clamp-2">{complaint}</p>
        )}

        <div className="divider" />

        <div className="meta">
          {showPatient && (
            <>
              <span className="meta__item">
                <Icon name="patients" size={13} />
                <Link to={`/patients/${pId}`} className="t-strong">
                  {patient?.name || `Patient #${pId}`}
                </Link>
              </span>
              <span className="meta__sep" aria-hidden="true" />
            </>
          )}
          <span className="meta__item t-truncate">
            <Icon name="doctors" size={13} />
            {orDash(doctor?.name || (record.doctor_id ? `Doctor #${record.doctor_id}` : null))}
          </span>
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
