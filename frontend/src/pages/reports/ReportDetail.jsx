import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardHead } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DefList, { MetaRow } from "../../components/ui/DefList";
import { ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { reportsService } from "../../services/clinicalService";
import patientsService from "../../services/patientsService";
import { formatDate } from "../../utils/format";

function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      reportsService.getById(id).then((report) => {
        const pId = report.patient_id || report.patientId;
        return patientsService.getById(pId).then((patient) => ({ report, patient }));
      }),
    [id],
  );

  useDocumentTitle(data?.report ? (data.report.filename || `Report #${data.report.id}`) : "Report");

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

  const { report, patient } = data;
  const fileName = report.filename || report.fileName || `Report #${report.id}`;
  const uploadDate = report.upload_date || report.uploadedAt;

  const download = () => {
    window.open(reportsService.getDownloadUrl(report.id), "_blank");
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await reportsService.remove(report.id);
      navigate("/reports", { replace: true });
    } catch (err) {
      alert(err?.message || "Failed to delete report.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "Reports", to: "/reports" }, { label: fileName }]} />

      <RecordHeader
        eyebrow={report.file_type || "Report Document"}
        name={fileName}
        meta={
          <MetaRow
            items={[
              { icon: "file", text: fileName },
              { icon: "patients", text: patient.name },
            ]}
          />
        }
        actions={
          <>
            <Button variant="outline" icon="download" onClick={download}>
              Download
            </Button>
            <Button
              variant="primary"
              icon="ai"
              to={`/ai/analysis?reportId=${report.id}`}
            >
              Analyse with AI
            </Button>
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
          { label: "Patient", value: patient.name },
          { label: "Patient Mobile", value: patient.mobile_no },
          { label: "Uploaded Date", value: formatDate(uploadDate) },
          { label: "Report Type", value: report.file_type || "Diagnostic Report" },
        ]}
      />

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Notes & Findings" />
            <CardBody>
              {report.notes ? (
                <p className="t-body">{report.notes}</p>
              ) : (
                <p className="t-caption">No notes entered for this report.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="File Details" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Filename", value: fileName },
                  { label: "File Type", value: report.file_type || "Report" },
                  { label: "Upload Date", value: formatDate(uploadDate) },
                  { label: "Report ID", value: `#${report.id}` },
                ]}
              />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Patient Information" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Name", value: patient.name },
                  { label: "Mobile", value: patient.mobile_no },
                  { label: "Gender", value: patient.gender },
                  { label: "Address", value: patient.address },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete report"
        message={`Delete "${fileName}"?`}
        detail="The report file will be permanently removed."
        confirmLabel="Delete report"
      />
    </div>
  );
}

export default ReportDetail;
