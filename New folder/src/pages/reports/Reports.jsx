import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ReportCard from "../../components/domain/ReportCard";
import StatusBadge from "../../components/domain/StatusBadge";
import { Identity } from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
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
  REPORT_STATUS,
  REPORT_STATUS_META,
  REPORT_TYPES,
  optionLabel,
  statusOptions,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import { reportsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatBytes, formatRelative, truncate } from "../../utils/format";
import UploadReportModal from "./UploadReportModal";

/**
 * Reports — the file index.
 *
 * Deliberately shows in-flight and failed transfers alongside ready files, so
 * the page reflects the real state of the archive rather than only the happy path.
 */
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
          ? reportsService.listByPatient(user.patientId)
          : reportsService.list(),
        patientsService.list(),
        doctorsService.list(),
      ]).then(([reports, patients, doctors]) => ({
        reports,
        patients,
        doctors,
        patientsById: new Map(patients.map((patient) => [patient.id, patient])),
        doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
      })),
    [role, user?.patientId],
  );

  useEffect(() => {
    if (params.get("upload") === "1") setUploadOpen(true);
  }, [params]);

  const controls = useTableControls(data?.reports || [], {
    searchFields: [
      "title",
      "fileName",
      "summary",
      (report) => data?.patientsById.get(report.patientId)?.name,
    ],
    initialSort: { key: "uploadedAt", direction: "desc" },
    initialFilters: {
      status: params.get("status") || "all",
      type: params.get("type") || "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      uploadedAt: (report) => report.uploadedAt,
      title: (report) => report.title,
      sizeBytes: (report) => report.sizeBytes,
    },
    pageSize: 9,
  });

  const closeUpload = () => {
    setUploadOpen(false);
    const next = new URLSearchParams(params);
    next.delete("upload");
    setParams(next, { replace: true });
  };

  const download = (report) =>
    reportsService.download(report.id).then(() => {
      setNotice(
        `${report.fileName} is ready. File streaming is not connected yet, so no download started.`,
      );
    });

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await reportsService.remove(pendingDelete.id);
      setNotice(`${pendingDelete.title} was marked for deletion.`);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const counts = (data?.reports || []).reduce(
    (acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    },
    {},
  );

  const columns = [
    {
      key: "title",
      header: "Report",
      sortable: true,
      full: true,
      render: (report) => (
        <div className="col col--gap-xxs">
          <span className="t-ink">{truncate(report.title, 52)}</span>
          <span className="t-caption t-truncate">{report.fileName}</span>
        </div>
      ),
    },
    {
      key: "patientId",
      header: "Patient",
      hideOn: "mobile",
      render: (report) => {
        const patient = data?.patientsById.get(report.patientId);
        return patient ? (
          <Identity name={patient.name} meta={patient.mrn} size="sm" square accent />
        ) : (
          "—"
        );
      },
    },
    {
      key: "type",
      header: "Type",
      hideOn: "mobile",
      render: (report) => (
        <span className="t-label t-label--sm">
          {optionLabel(REPORT_TYPES, report.type)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (report) => <StatusBadge kind="report" value={report.status} />,
    },
    {
      key: "sizeBytes",
      header: "Size",
      sortable: true,
      align: "right",
      hideOn: "mobile",
      render: (report) =>
        report.sizeBytes > 0 ? formatBytes(report.sizeBytes) : "—",
    },
    {
      key: "uploadedAt",
      header: "Uploaded",
      sortable: true,
      hideOn: "mobile",
      render: (report) => (
        <span className="t-nowrap">{formatRelative(report.uploadedAt)}</span>
      ),
    },
    {
      key: "aiAnalysed",
      header: "AI",
      hideOn: "mobile",
      render: (report) =>
        report.aiAnalysed ? (
          <Badge tone="accent" icon="ai">
            Summarised
          </Badge>
        ) : (
          <span className="t-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      stackedLabel: "",
      render: (report) => (
        <div className="row row--tight" style={{ justifyContent: "flex-end" }}>
          {report.status === REPORT_STATUS.READY && (
            <Button
              size="sm"
              variant="ghost"
              icon="download"
              onClick={(event) => {
                event.stopPropagation();
                download(report);
              }}
              aria-label={`Download ${report.title}`}
            />
          )}
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

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinical"
        title="Reports"
        lede="Laboratory results, imaging studies and correspondence, with their current transfer state."
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

      <section className="grid grid--4" style={{ marginBottom: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="block" height={110} />
          ))
        ) : (
          <>
            <StatCard
              label="Ready"
              value={counts[REPORT_STATUS.READY] || 0}
              icon="checkCircle"
            />
            <StatCard
              label="Processing"
              value={
                (counts[REPORT_STATUS.PROCESSING] || 0) +
                (counts[REPORT_STATUS.UPLOADING] || 0)
              }
              icon="clock"
            />
            <StatCard
              label="Failed"
              value={counts[REPORT_STATUS.FAILED] || 0}
              icon="alertTriangle"
            />
            <StatCard
              label="AI summarised"
              value={(data?.reports || []).filter((report) => report.aiAnalysed).length}
              icon="ai"
            />
          </>
        )}
      </section>

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by title, file name, finding or patient"
        filters={
          <>
            <Select
              size="sm"
              options={[
                { value: "all", label: "All statuses" },
                ...statusOptions(REPORT_STATUS_META),
              ]}
              value={controls.filters.status}
              onChange={(event) => controls.setFilter("status", event.target.value)}
              aria-label="Filter by status"
            />
            <Select
              size="sm"
              options={[{ value: "all", label: "All types" }, ...REPORT_TYPES]}
              value={controls.filters.type}
              onChange={(event) => controls.setFilter("type", event.target.value)}
              aria-label="Filter by type"
            />
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
          {controls.isFiltered ? (
            <EmptyState
              icon="search"
              title="No reports match"
              message="Nothing found for the current search and filters."
              secondary={
                <Button variant="outline" icon="close" onClick={controls.resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="reports"
              title="No reports yet"
              message={
                role === ROLES.PATIENT
                  ? "Results and imaging shared by your care team will appear here."
                  : "Upload a laboratory result, imaging study or discharge summary."
              }
              actionLabel={role === ROLES.PATIENT ? undefined : "Upload report"}
              actionIcon="upload"
              action={() => setUploadOpen(true)}
            />
          )}
        </Card>
      ) : view === "cards" ? (
        <div className="grid grid--3">
          {controls.rows.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              patient={data.patientsById.get(report.patientId)}
              onDownload={download}
              onDelete={role !== ROLES.PATIENT ? setPendingDelete : undefined}
              onRetry={(entry) =>
                setNotice(`Retry queued for ${entry.fileName}. Not connected yet.`)
              }
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
          onUploaded={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete report"
        message={pendingDelete ? `Delete “${pendingDelete.title}”?` : ""}
        detail="The file is removed from the archive. This is recorded in the audit trail and cannot be undone."
        confirmLabel="Delete report"
      />
    </div>
  );
}

export default Reports;
