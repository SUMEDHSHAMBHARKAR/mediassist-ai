import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import RecordCard from "../../components/domain/RecordCard";
import StatusBadge from "../../components/domain/StatusBadge";
import { Identity } from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import Table from "../../components/ui/Table";
import { Segmented } from "../../components/ui/Tabs";
import Toolbar from "../../components/ui/Toolbar";
import { EmptyState, ErrorState, SkeletonRows } from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import { SEVERITY_META, statusOptions } from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import { medicalRecordsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatDate, truncate } from "../../utils/format";
import RecordFormModal from "./RecordFormModal";

/**
 * MedicalRecords — the encounter index.
 *
 * A patient sees only their own history, which is why the loader branches on
 * role rather than filtering after the fact.
 */
function MedicalRecords() {
  useDocumentTitle("Medical records");

  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const [params, setParams] = useSearchParams();

  // The composer opens either from /medical-records/new or ?new=1, so links from
  // a patient record work either way.
  const openViaRoute =
    location.pathname.endsWith("/new") || params.get("new") === "1";

  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(openViaRoute);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        role === ROLES.PATIENT
          ? medicalRecordsService.listByPatient(user.patientId)
          : medicalRecordsService.list(),
        patientsService.list(),
        doctorsService.list(),
      ]).then(([records, patients, doctors]) => ({
        records,
        patients,
        doctors,
        patientsById: new Map(patients.map((patient) => [patient.id, patient])),
        doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
      })),
    [role, user?.patientId],
  );

  useEffect(() => {
    if (openViaRoute) setFormOpen(true);
  }, [openViaRoute]);

  const controls = useTableControls(data?.records || [], {
    searchFields: [
      "diagnosis",
      "icdCode",
      "chiefComplaint",
      "treatment",
      (record) => data?.patientsById.get(record.patientId)?.name,
    ],
    initialSort: { key: "visitDate", direction: "desc" },
    initialFilters: {
      severity: params.get("severity") || "all",
      doctorId: params.get("doctorId") || "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      visitDate: (record) => record.visitDate,
      diagnosis: (record) => record.diagnosis,
      severity: (record) => record.severity,
    },
    pageSize: 10,
  });

  const closeForm = () => {
    setFormOpen(false);

    if (location.pathname.endsWith("/new")) {
      navigate(`/medical-records${location.search}`, { replace: true });
      return;
    }

    const next = new URLSearchParams(params);
    next.delete("new");
    setParams(next, { replace: true });
  };

  const columns = [
    {
      key: "visitDate",
      header: "Date",
      sortable: true,
      render: (record) => (
        <span className="t-nowrap t-tabular">{formatDate(record.visitDate)}</span>
      ),
    },
    {
      key: "patientId",
      header: "Patient",
      full: true,
      render: (record) => {
        const patient = data?.patientsById.get(record.patientId);
        return (
          <Identity
            name={patient?.name || "Unknown"}
            meta={patient?.mrn}
            size="sm"
            square
            accent
          />
        );
      },
    },
    {
      key: "diagnosis",
      header: "Diagnosis",
      sortable: true,
      render: (record) => (
        <div className="col col--gap-xxs">
          <span className="t-ink">{truncate(record.diagnosis, 60)}</span>
          {record.icdCode && <span className="t-mono t-muted">{record.icdCode}</span>}
        </div>
      ),
    },
    {
      key: "doctorId",
      header: "Clinician",
      hideOn: "mobile",
      render: (record) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 160 }}>
          {data?.doctorsById.get(record.doctorId)?.name || "—"}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      sortable: true,
      render: (record) => <StatusBadge kind="severity" value={record.severity} />,
    },
    {
      key: "followUpDate",
      header: "Follow-up",
      hideOn: "mobile",
      render: (record) =>
        record.followUpDate ? (
          <span className="t-nowrap">{formatDate(record.followUpDate)}</span>
        ) : (
          <span className="t-muted">None</span>
        ),
    },
    {
      key: "attachmentCount",
      header: "Files",
      align: "right",
      hideOn: "mobile",
      render: (record) =>
        record.attachmentCount > 0 ? (
          <span className="row row--tight" style={{ justifyContent: "flex-end" }}>
            <Icon name="paperclip" size={12} />
            {record.attachmentCount}
          </span>
        ) : (
          <span className="t-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      stackedLabel: "",
      render: () => <Icon name="chevronRight" size={14} className="t-muted" />,
    },
  ];

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Clinical" title="Medical records" />
        <ErrorState
          title="Records unavailable"
          message="Medical records could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const followUpsDue = (data?.records || []).filter(
    (record) => record.followUpDate && new Date(record.followUpDate) > new Date(),
  ).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinical"
        title="Medical records"
        lede={
          role === ROLES.PATIENT
            ? "Every documented encounter in your care history."
            : `Documented encounters across all patients${followUpsDue ? ` · ${followUpsDue} follow-ups pending` : ""}.`
        }
        actions={
          role !== ROLES.PATIENT && (
            <Button variant="primary" icon="plus" onClick={() => setFormOpen(true)}>
              New record
            </Button>
          )
        }
      />

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search diagnosis, ICD code, complaint or patient"
        filters={
          <>
            <Select
              size="sm"
              options={[
                { value: "all", label: "All severities" },
                ...statusOptions(SEVERITY_META),
              ]}
              value={controls.filters.severity}
              onChange={(event) => controls.setFilter("severity", event.target.value)}
              aria-label="Filter by severity"
            />
            {role !== ROLES.PATIENT && (
              <Select
                size="sm"
                options={[
                  { value: "all", label: "All clinicians" },
                  ...(data?.doctors || []).map((doctor) => ({
                    value: doctor.id,
                    label: doctor.name,
                  })),
                ]}
                value={controls.filters.doctorId}
                onChange={(event) => controls.setFilter("doctorId", event.target.value)}
                aria-label="Filter by clinician"
              />
            )}
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
              { value: "table", label: "List", icon: "list" },
              { value: "cards", label: "Cards", icon: "grid" },
            ]}
          />
        }
      />

      {loading ? (
        <Card surface="soft">
          <CardBody>
            <SkeletonRows rows={6} />
          </CardBody>
        </Card>
      ) : controls.rows.length === 0 ? (
        <Card surface="soft">
          {controls.isFiltered ? (
            <EmptyState
              icon="search"
              title="No records match"
              message="Nothing found for the current search and filters."
              secondary={
                <Button variant="outline" icon="close" onClick={controls.resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="records"
              title="No medical records"
              message={
                role === ROLES.PATIENT
                  ? "Encounters documented by your care team will appear here."
                  : "Document an encounter to start building the clinical record."
              }
              actionLabel={role === ROLES.PATIENT ? undefined : "New record"}
              actionIcon="plus"
              action={() => setFormOpen(true)}
            />
          )}
        </Card>
      ) : view === "table" ? (
        <Card surface="soft">
          <Table
            columns={columns}
            rows={controls.rows}
            caption="Medical records"
            sort={controls.sort}
            onSortChange={controls.setSort}
            onRowClick={(record) => navigate(`/medical-records/${record.id}`)}
          />
        </Card>
      ) : (
        <div className="grid grid--2">
          {controls.rows.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              patient={data.patientsById.get(record.patientId)}
              doctor={data.doctorsById.get(record.doctorId)}
            />
          ))}
        </div>
      )}

      {!loading && controls.rows.length > 0 && (
        <Pagination
          page={controls.page}
          pageCount={controls.pageCount}
          pageSize={controls.pageSize}
          total={controls.filteredCount}
          onChange={controls.setPage}
          itemLabel="records"
        />
      )}

      {formOpen && (
        <RecordFormModal
          open={formOpen}
          onClose={closeForm}
          patients={data?.patients || []}
          doctors={data?.doctors || []}
          defaultPatientId={params.get("patientId") || undefined}
        />
      )}
    </div>
  );
}

export default MedicalRecords;
