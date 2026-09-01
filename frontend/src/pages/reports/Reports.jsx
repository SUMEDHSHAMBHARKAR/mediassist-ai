import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ReportCard from "../../components/domain/ReportCard";
import { Identity } from "../../components/ui/Avatar";
import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import Table from "../../components/ui/Table";
import { Segmented } from "../../components/ui/Tabs";
import Toolbar from "../../components/ui/Toolbar";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import {
  REPORT_TYPES,
  optionLabel,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import { reportsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatDate, truncate } from "../../utils/format";
import UploadReportModal from "./UploadReportModal";

function Reports() {
  useDocumentTitle("Reports");

  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [params, setParams] = useSearchParams();

  const [view, setView] = useState("cards");
  const [uploadOpen, setUploadOpen] = useState(params.get("upload") === "1");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        role === ROLES.PATIENT
          ? reportsService.listByPatient(user?.patientId || user?.id)
          : reportsService.list(),
        patientsService.list().catch(() => []),
        doctorsService.list().catch(() => []),
      ]).then(([rawReports, rawPatients, rawDoctors]) => {
        const reportList = Array.isArray(rawReports) ? rawReports : rawReports?.items || [];
        const patientList = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
        const doctorList = Array.isArray(rawDoctors?.items) ? rawDoctors.items : Array.isArray(rawDoctors) ? rawDoctors : [];

        return {
          reports: reportList,
          patients: patientList,
          doctors: doctorList,
          patientsById: new Map(patientList.map((patient) => [patient.id, patient])),
          doctorsById: new Map(doctorList.map((doctor) => [doctor.id, doctor])),
        };
      }),
    [role, user?.patientId, user?.id],
  );

  useEffect(() => {
    if (params.get("upload") === "1") setUploadOpen(true);
  }, [params]);

  const controls = useTableControls(data?.reports || [], {
    searchFields: [
      "filename",
      "fileName",
      "file_type",
      "notes",
      (report) => data?.patientsById.get(report.patient_id || report.patientId)?.name,
    ],
    initialSort: { key: "upload_date", direction: "desc" },
    initialFilters: {
      type: params.get("type") || "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      upload_date: (report) => report.upload_date || report.uploadedAt,
      filename: (report) => report.filename || report.fileName || report.title,
    },
    pageSize: 9,
  });

  const closeUpload = () => {
    setUploadOpen(false);
    const next = new URLSearchParams(params);
    next.delete("upload");
    setParams(next, { replace: true });
  };

  const download = (report) => {
    window.open(reportsService.getDownloadUrl(report.id), "_blank");
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await reportsService.remove(pendingDelete.id);
      setNotice(`Report #${pendingDelete.id} deleted.`);
      reload();
    } catch (err) {
      alert(err?.message || "Failed to delete report.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const columns = [
    {
      key: "filename",
      header: "Report File",
      sortable: true,
      full: true,
      render: (report) => (
        <div className="col col--gap-xxs">
          <span className="t-ink">{truncate(report.filename || report.fileName || `Report #${report.id}`, 52)}</span>
          <span className="t-caption t-truncate">{report.file_type || "Document"}</span>
        </div>
      ),
    },
    {
      key: "patient_id",
      header: "Patient",
      hideOn: "mobile",
      render: (report) => {
        const patient = data?.patientsById.get(report.patient_id || report.patientId);
        return patient ? (
          <Identity name={patient.name} meta={patient.mobile_no} size="sm" square accent />
        ) : (
          `Patient #${report.patient_id || report.patientId}`
        );
      },
    },
    {
      key: "file_type",
      header: "Type",
      hideOn: "mobile",
      render: (report) => (
        <span className="t-label t-label--sm">
          {optionLabel(REPORT_TYPES, report.file_type || report.type || "Report")}
        </span>
      ),
    },
    {
      key: "upload_date",
      header: "Uploaded",
      sortable: true,
      hideOn: "mobile",
      render: (report) => (
        <span className="t-nowrap">{formatDate(report.upload_date || report.uploadedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      stackedLabel: "",
      render: (report) => (
        <div className="row row--tight" style={{ justifyContent: "flex-end" }}>
          <Button
            size="sm"
            variant="ghost"
            icon="download"
            onClick={(event) => {
              event.stopPropagation();
              download(report);
            }}
            aria-label={`Download ${report.filename || report.title}`}
          />
          <Icon name="chevronRight" size={14} className="t-muted" />
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Clinical" title="Reports" />
        <ErrorState
          title="Reports unavailable"
          message="The report archive could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const reportsList = data?.reports || [];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinical"
        title="Reports"
        lede="Laboratory results, imaging studies and diagnostic report documents."
        actions={
          role !== ROLES.PATIENT && (
            <Button variant="primary" icon="upload" onClick={() => setUploadOpen(true)}>
              Upload report
            </Button>
          )
        }
      />

      {notice && (
        <Banner tone="accent" className="stack" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      )}

      <section className="grid grid--3" style={{ marginBottom: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} variant="block" height={110} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Reports"
              value={reportsList.length}
              icon="reports"
            />
            <StatCard
              label="Lab Reports"
              value={reportsList.filter((r) => (r.file_type || r.type || "").toLowerCase().includes("lab")).length}
              icon="checkCircle"
            />
            <StatCard
              label="Radiology & Imaging"
              value={reportsList.filter((r) => (r.file_type || r.type || "").toLowerCase().includes("rad")).length}
              icon="layers"
            />
          </>
        )}
      </section>

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by filename, type, or notes"
        filters={
          <>
            {controls.isFiltered && (
              <Button size="sm" variant="ghost" icon="close" onClick={controls.resetFilters}>
                Clear
              </Button>
            )}
          </>
        }
        trailing={
          <Segmented
            value={view}
            onChange={setView}
            items={[
              { value: "cards", label: "Cards", icon: "grid" },
              { value: "table", label: "List", icon: "list" },
            ]}
          />
        }
      />

      {loading ? (
        view === "cards" ? (
          <div className="grid grid--3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} variant="block" height={240} />
            ))}
          </div>
        ) : (
          <Card surface="soft">
            <CardBody>
              <SkeletonRows rows={6} />
            </CardBody>
          </Card>
        )
      ) : controls.rows.length === 0 ? (
        <Card surface="soft">
          <EmptyState
            icon="reports"
            title="No reports yet"
            message={
              role === ROLES.PATIENT
                ? "Results and imaging shared by your care team will appear here."
                : "Upload a laboratory result, imaging study or report document."
            }
            actionLabel={role === ROLES.PATIENT ? undefined : "Upload report"}
            actionIcon="upload"
            action={() => setUploadOpen(true)}
          />
        </Card>
      ) : view === "cards" ? (
        <div className="grid grid--3">
          {controls.rows.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              patient={data?.patientsById?.get(report.patient_id || report.patientId)}
              onDownload={download}
              onDelete={role !== ROLES.PATIENT ? setPendingDelete : undefined}
              onAnalyse={(entry) => navigate(`/ai/analysis?reportId=${entry.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card surface="soft">
          <Table
            columns={columns}
            rows={controls.rows}
            caption="Report archive"
            sort={controls.sort}
            onSortChange={controls.setSort}
            onRowClick={(report) => navigate(`/reports/${report.id}`)}
          />
        </Card>
      )}

      {!loading && controls.rows.length > 0 && (
        <Pagination
          page={controls.page}
          pageCount={controls.pageCount}
          pageSize={controls.pageSize}
          total={controls.filteredCount}
          onChange={controls.setPage}
          itemLabel="reports"
        />
      )}

      {uploadOpen && (
        <UploadReportModal
          open={uploadOpen}
          onClose={closeUpload}
          patients={data?.patients || []}
          doctors={data?.doctors || []}
          defaultPatientId={params.get("patientId") || undefined}
          onUploaded={() => reload()}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete report"
        message={pendingDelete ? `Delete report #${pendingDelete.id}?` : ""}
        detail="This report document will be removed from the archive."
        confirmLabel="Delete report"
      />
    </div>
  );
}

export default Reports;
