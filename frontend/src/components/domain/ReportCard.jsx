import { Link } from "react-router-dom";

import { REPORT_TYPES, optionLabel } from "../../constants/statuses";
import cx from "../../utils/classNames";
import { formatDate, orDash } from "../../utils/format";
import Icon from "../ui/Icon";
import IconButton from "../ui/IconButton";

function ReportCard({
  report,
  patient,
  onDownload,
  onDelete,
  onAnalyse,
  className,
}) {
  const title = report.filename || report.fileName || `Report #${report.id}`;
  const pId = report.patient_id || report.patientId;
  const dateVal = report.upload_date || report.uploadedAt;
  const notes = report.notes || report.summary;

  return (
    <article
      className={cx("card", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top">
          <div className="row row--loose" style={{ minWidth: 0 }}>
            <span className="file-row__icon" aria-hidden="true">
              <Icon name="file" size={16} />
            </span>
            <div className="col col--gap-xxs" style={{ minWidth: 0 }}>
              <Link to={`/reports/${report.id}`} className="t-data t-ink">
                {title}
              </Link>
              <span className="t-caption t-truncate">{report.file_type || "Document"}</span>
            </div>
          </div>
        </div>

        {notes && (
          <p className="t-body-sm t-clamp-3">{notes}</p>
        )}

        <div className="divider" />

        <div className="meta">
          <span className="meta__item">
            <Icon name="layers" size={13} />
            {optionLabel(REPORT_TYPES, report.file_type || report.type || "Report")}
          </span>
          <span className="meta__sep" aria-hidden="true" />
          <span className="meta__item">{formatDate(dateVal)}</span>
          {patient && (
            <>
              <span className="meta__sep" aria-hidden="true" />
              <span className="meta__item t-truncate">
                <Link to={`/patients/${pId}`} className="t-strong">
                  {orDash(patient.name)}
                </Link>
              </span>
            </>
          )}
        </div>
      </div>

      <footer className="card__foot">
        <Link to={`/reports/${report.id}`} className="text-link text-link--sm">
          Details
          <Icon name="arrowRight" size={13} />
        </Link>

        <div className="row row--tight">
          {onAnalyse && (
            <IconButton
              icon="ai"
              label={`Analyse ${title} with AI`}
              size="sm"
              onClick={() => onAnalyse(report)}
            />
          )}
          {onDownload && (
            <IconButton
              icon="download"
              label={`Download ${title}`}
              size="sm"
              onClick={() => onDownload(report)}
            />
          )}
          {onDelete && (
            <IconButton
              icon="trash"
              label={`Delete ${title}`}
              size="sm"
              onClick={() => onDelete(report)}
            />
          )}
        </div>
      </footer>
    </article>
  );
}

export default ReportCard;
