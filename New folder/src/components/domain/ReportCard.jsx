import { Link } from "react-router-dom";

import { REPORT_STATUS, REPORT_TYPES, optionLabel } from "../../constants/statuses";
import cx from "../../utils/classNames";
import { formatBytes, formatRelative, orDash } from "../../utils/format";
import Badge from "../ui/Badge";
import Icon from "../ui/Icon";
import IconButton from "../ui/IconButton";
import { Progress } from "../ui/Banner";
import StatusBadge from "./StatusBadge";

const TYPE_ICON = {
  lab: "reports",
  imaging: "image",
  pathology: "database",
  cardiology: "pulse",
  discharge: "file",
  referral: "mail",
  other: "file",
};

/**
 * ReportCard — a stored file with its transfer/processing state.
 *
 * Download is only offered when the file is actually ready; an in-flight or
 * failed report shows why instead of an action that cannot succeed.
 */
function ReportCard({
  report,
  patient,
  onDownload,
  onDelete,
  onRetry,
  onAnalyse,
  className,
}) {
  const isReady = report.status === REPORT_STATUS.READY;
  const isFailed = report.status === REPORT_STATUS.FAILED;
  const isUploading = report.status === REPORT_STATUS.UPLOADING;
  const isProcessing = report.status === REPORT_STATUS.PROCESSING;

  return (
    <article
      className={cx("card", isFailed && "card--critical", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top">
          <div className="row row--loose" style={{ minWidth: 0 }}>
            <span className="file-row__icon" aria-hidden="true">
              <Icon name={TYPE_ICON[report.type] || "file"} size={16} />
            </span>
            <div className="col col--gap-xxs" style={{ minWidth: 0 }}>
              <Link to={`/reports/${report.id}`} className="t-data t-ink">
                {report.title}
              </Link>
              <span className="t-caption t-truncate">{report.fileName}</span>
            </div>
          </div>

          <StatusBadge kind="report" value={report.status} />
        </div>

        {isUploading && (
          <div className="col col--gap-xxs">
            <Progress value={report.uploadProgress ?? 0} label="Upload progress" />
            <span className="t-caption">
              Uploading · {Math.round(report.uploadProgress ?? 0)}%
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="row row--tight t-caption">
            <span className="spinner" aria-hidden="true" />
            Processing on the imaging server. This can take a few minutes.
          </div>
        )}

        {isFailed && report.error && (
          <span className="row row--tight t-caption t-critical row--top">
            <Icon name="alertCircle" size={13} />
            {report.error}
          </span>
        )}

        {isReady && report.summary && (
          <p className="t-body-sm t-clamp-3">{report.summary}</p>
        )}

        <div className="divider" />

        <div className="meta">
          <span className="meta__item">
            <Icon name="layers" size={13} />
            {optionLabel(REPORT_TYPES, report.type)}
          </span>
          <span className="meta__sep" aria-hidden="true" />
          <span className="meta__item">{formatRelative(report.uploadedAt)}</span>
          {report.sizeBytes > 0 && (
            <>
              <span className="meta__sep" aria-hidden="true" />
              <span className="meta__item">{formatBytes(report.sizeBytes)}</span>
            </>
          )}
          {patient && (
            <>
              <span className="meta__sep" aria-hidden="true" />
              <span className="meta__item t-truncate">
                <Link to={`/patients/${patient.id}`} className="t-strong">
                  {orDash(patient.name)}
                </Link>
              </span>
            </>
          )}
        </div>

        {report.aiAnalysed && (
          <Badge tone="accent" icon="ai">
            AI summarised
          </Badge>
        )}
      </div>

      <footer className="card__foot">
        <Link to={`/reports/${report.id}`} className="text-link text-link--sm">
          Details
          <Icon name="arrowRight" size={13} />
        </Link>

        <div className="row row--tight">
          {isReady && onAnalyse && (
            <IconButton
              icon="ai"
              label={`Analyse ${report.title} with AI`}
              size="sm"
              onClick={() => onAnalyse(report)}
            />
          )}
          {isReady && onDownload && (
            <IconButton
              icon="download"
              label={`Download ${report.title}`}
              size="sm"
              onClick={() => onDownload(report)}
            />
          )}
          {isFailed && onRetry && (
            <IconButton
              icon="refresh"
              label={`Retry upload of ${report.title}`}
              size="sm"
              onClick={() => onRetry(report)}
            />
          )}
          {onDelete && (
            <IconButton
              icon="trash"
              label={`Delete ${report.title}`}
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
