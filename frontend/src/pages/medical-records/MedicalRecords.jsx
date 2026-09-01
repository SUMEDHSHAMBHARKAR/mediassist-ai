import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import RecordCard from "../../components/domain/RecordCard";
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
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import { medicalRecordsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatDate, truncate } from "../../utils/format";
import RecordFormModal from "./RecordFormModal";

function MedicalRecords() {
  useDocumentTitle("Medical records");

  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const [params, setParams] = useSearchParams();

  const openViaRoute =
    location.pathname.endsWith("/new") || params.get("new") === "1";

  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(openViaRoute);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        role === ROLES.PATIENT
          ? medicalRecordsService.listByPatient(user?.patientId || user?.id)
          : medicalRecordsService.list(),
        patientsService.list().catch(() => []),
        doctorsService.list().catch(() => []),
      ]).then(([rawRecords, rawPatients, rawDoctors]) => {
        const recordList = Array.isArray(rawRecords) ? rawRecords : rawRecords?.items || [];
        const patientList = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
        const doctorList = Array.isArray(rawDoctors?.items) ? rawDoctors.items : Array.isArray(rawDoctors) ? rawDoctors : [];

        return {
          records: recordList,
          patients: patientList,
          doctors: doctorList,
          patientsById: new Map(patientList.map((patient) => [patient.id, patient])),
          doctorsById: new Map(doctorList.map((doctor) => [doctor.id, doctor])),
        };
      }),
    [role, user?.patientId, user?.id],
  );

  useEffect(() => {
    if (openViaRoute) setFormOpen(true);
  }, [openViaRoute]);

  const controls = useTableControls(data?.records || [], {
    searchFields: [
      "diagnosis",
      "chief_complaint",
      "chiefComplaint",
      "treatment",
      (record) => data?.patientsById.get(record.patient_id || record.patientId)?.name,
    ],
    initialSort: { key: "visit_date", direction: "desc" },
    initialFilters: {
      doctorId: params.get("doctorId") || "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      visit_date: (record) => record.visit_date || record.visitDate,
      diagnosis: (record) => record.diagnosis,
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
      key: "visit_date",
      header: "Date",
      sortable: true,
      render: (record) => (
        <span className="t-nowrap t-tabular">{formatDate(record.visit_date || record.visitDate)}</span>
      ),
    },
    {
      key: "patient_id",
      header: "Patient",
      full: true,
      render: (record) => {
        const patient = data?.patientsById.get(record.patient_id || record.patientId);
        return (
          <Identity
            name={patient?.name || `Patient #${record.patient_id || record.patientId}`}
            meta={patient?.mobile_no}
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
          <span className="t-caption t-muted">{truncate(record.chief_complaint || record.chiefComplaint, 60)}</span>
        </div>
      ),
    },
    {
      key: "doctor_id",
      header: "Clinician",
      hideOn: "mobile",
      render: (record) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 160 }}>
          {data?.doctorsById.get(record.doctor_id || record.doctorId)?.name || `Doctor #${record.doctor_id || record.doctorId}`}
        </span>
      ),
    },
    {
      key: "treatment",
      header: "Treatment Plan",
      hideOn: "mobile",
      render: (record) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 200 }}>
          {record.treatment || "—"}
        </span>
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

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinical"
        title="Medical records"
        lede={
          role === ROLES.PATIENT
            ? "Every documented encounter in your care history."
            : "Documented clinical encounters and medical records across patients."
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
        searchPlaceholder="Search diagnosis, complaint, treatment or patient name"
        filters={
          <>
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
              patient={data?.patientsById?.get(record.patient_id || record.patientId)}
              doctor={data?.doctorsById?.get(record.doctor_id || record.doctorId)}
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
          onSaved={() => reload()}
        />
      )}
    </div>
  );
}

export default MedicalRecords;
