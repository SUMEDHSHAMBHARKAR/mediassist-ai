import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import StatusBadge from "../../components/domain/StatusBadge";
import Badge from "../../components/ui/Badge";
import Banner, { Progress } from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import { EmptyState, ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import {
  REPORT_STATUS,
  REPORT_TYPES,
  optionLabel,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { medicalRecordsService, reportsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatBytes, formatDateTime, orDash } from "../../utils/format";

/**
 * ReportDetail — one stored file.
 *
 * The preview pane is honest about what it cannot do: the file is not streamed
 * in this phase, so a placeholder states that instead of showing a fake viewer.
 */
function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      reportsService.getById(id).then((report) =>
        Promise.all([
          patientsService.getById(report.patientId),
          report.doctorId ? doctorsService.getById(report.doctorId) : Promise.resolve(null),
          report.recordId
            ? medicalRecordsService.getById(report.recordId).catch(() => null)
            : Promise.resolve(null),
        ]).then(([patient, doctor, record]) => ({ report, patient, doctor, record })),
      ),
    [id],
  );

  useDocumentTitle(data?.report ? data.report.title : "Report");

  if (loading) {
    return (
      <div className="page">
        <Skeleton variant="block" height={180} />
        <div style={{ marginTop: "var(--s-lg)" }}>
          <LoadingState label="Loading report" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Breadcrumb items={[{ label: "Reports", to: "/reports" }, { label: "Not found" }]} />
        <ErrorState title="Report unavailable" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { report, patient, doctor, record } = data;
  const isReady = report.status === REPORT_STATUS.READY;

  const download = () =>
    reportsService.download(report.id).then(() =>
      setNotice(
        "File streaming is not connected yet, so no download started. The real action calls GET /reports/download/{report_id}.",
      ),
    );

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await reportsService.remove(report.id);
      navigate("/reports", { replace: true });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "Reports", to: "/reports" }, { label: report.title }]} />

      <RecordHeader
        eyebrow={optionLabel(REPORT_TYPES, report.type)}
        name={report.title}
        badges={
          <>
            <StatusBadge kind="report" value={report.status} size="lg" />
            {report.aiAnalysed && (
              <Badge tone="accent" icon="ai">
                AI summarised
              </Badge>
            )}
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "file", text: report.fileName },
              report.sizeBytes > 0 ? { icon: "database", text: formatBytes(report.sizeBytes) } : null,
              { icon: "patients", text: patient.name },
            ].filter(Boolean)}
          />
        }
        actions={
          <>
            {isReady && (
              <Button variant="outline" icon="download" onClick={download}>
                Download
              </Button>
            )}
            {isReady && (
              <Button
                variant="primary"
                icon="ai"
                to={`/ai/analysis?reportId=${report.id}`}
              >
                Analyse with AI
              </Button>
            )}
            {report.status === REPORT_STATUS.FAILED && (
              <Button
                variant="primary"
                icon="refresh"
                onClick={() => setNotice("Retry queued. Upload retry is not connected yet.")}
              >
                Retry upload
              </Button>
            )}
            {role !== ROLES.PATIENT && (
              <Button
                variant="danger"
                icon="trash"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete report"
              />
            )}
          </>
        }
        facts={[
          { label: "Patient", value: `${patient.name} · ${patient.mrn}` },
          { label: "Requested by", value: orDash(doctor?.name) },
          { label: "Uploaded", value: formatDateTime(report.uploadedAt) },
          { label: "Type", value: optionLabel(REPORT_TYPES, report.type) },
          {
            label: "Size",
            value: report.sizeBytes > 0 ? formatBytes(report.sizeBytes) : "—",
          },
        ]}
      />

      {notice && (
        <Banner tone="accent" className="stack" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      )}

      {report.status === REPORT_STATUS.FAILED && (
        <Banner tone="critical" title="Transfer failed" className="stack">
          {report.error || "The upload did not complete."}
        </Banner>
      )}

      {report.status === REPORT_STATUS.UPLOADING && (
        <div className="banner banner--accent stack">
          <span className="banner__icon" aria-hidden="true">
            <Icon name="upload" size={16} />
          </span>
          <div className="grow col col--gap-xs">
            <span className="banner__title">
              Uploading · {Math.round(report.uploadProgress ?? 0)}%
            </span>
            <Progress value={report.uploadProgress ?? 0} label="Upload progress" />
          </div>
        </div>
      )}

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead
              title="Findings"
              subtitle={
                report.aiAnalysed
                  ? "Summary attached · verify against the source document"
                  : undefined
              }
            />
            <CardBody>
              {report.summary ? (
                <>
                  <p className="t-body">{report.summary}</p>
                  {report.aiAnalysed && (
                    <Banner tone="warning" icon="alertTriangle" className="stack">
                      This summary is machine generated. Always confirm findings
                      against the original report before acting on them.
                    </Banner>
                  )}
                </>
              ) : (
                <EmptyState
                  size="inline"
                  icon="quote"
                  title="No summary yet"
                  message={
                    report.status === REPORT_STATUS.PROCESSING
                      ? "The report is still being processed. A summary appears once processing completes."
                      : "No findings have been recorded against this report."
                  }
                />
              )}
            </CardBody>
            {isReady && (
              <CardFoot>
                <Link
                  to={`/ai/analysis?reportId=${report.id}`}
                  className="text-link text-link--sm"
                >
                  Run full AI analysis
                  <Icon name="arrowRight" size={13} />
                </Link>
              </CardFoot>
            )}
          </Card>

          <Card surface="soft">
            <CardHead title="Document" subtitle={report.fileName} />
            <CardBody>
              <div
                className="card card--inset"
                style={{
                  minHeight: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <EmptyState
                  size="compact"
                  icon={report.type === "imaging" ? "image" : "file"}
                  title="Preview not available"
                  message="Document streaming is not connected in this phase. Download the file to view it, or connect the reports endpoint to enable inline preview."
                  secondary={
                    isReady && (
                      <Button variant="outline" icon="download" onClick={download}>
                        Download file
                      </Button>
                    )
                  }
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="File details" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "File name", value: report.fileName },
                  {
                    label: "Size",
                    value: report.sizeBytes > 0 ? formatBytes(report.sizeBytes) : "—",
                  },
                  { label: "Uploaded", value: formatDateTime(report.uploadedAt) },
                  { label: "Reference", value: report.id },
                ]}
              />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead
              title="Patient"
              actions={
                <Button size="sm" variant="ghost" to={`/patients/${patient.id}`} iconEnd="arrowRight">
                  Record
                </Button>
              }
            />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Name", value: patient.name },
                  { label: "MRN", value: patient.mrn },
                  {
                    label: "Allergies",
                    value:
                      patient.allergies?.length > 0
                        ? patient.allergies.join(", ")
                        : "None recorded",
                  },
                ]}
              />
            </CardBody>
          </Card>

          {record && (
            <Card surface="soft">
              <CardHead title="Linked encounter" />
              <CardBody>
                <Link to={`/medical-records/${record.id}`} className="col col--gap-xs">
                  <span className="t-data t-ink">{record.diagnosis}</span>
                  <span className="t-caption">{formatDateTime(record.visitDate)}</span>
                  <span className="text-link text-link--sm" style={{ marginTop: 6 }}>
                    Open record
                    <Icon name="arrowRight" size={12} />
                  </span>
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete report"
        message={`Delete “${report.title}”?`}
        detail="The file is removed from the archive. This is recorded in the audit trail and cannot be undone."
        confirmLabel="Delete report"
      />
    </div>
  );
}

export default ReportDetail;
