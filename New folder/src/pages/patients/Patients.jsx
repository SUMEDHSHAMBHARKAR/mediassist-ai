import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import PatientCard from "../../components/domain/PatientCard";
import StatusBadge from "../../components/domain/StatusBadge";
import { Identity } from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import Dropdown, { DropdownItem } from "../../components/ui/Dropdown";
import Icon from "../../components/ui/Icon";
import IconButton from "../../components/ui/IconButton";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import Table from "../../components/ui/Table";
import { Segmented } from "../../components/ui/Tabs";
import Toolbar from "../../components/ui/Toolbar";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/ui/States";
import {
  PATIENT_STATUS_META,
  SEVERITY_META,
  statusOptions,
} from "../../constants/statuses";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { calculateAge, formatRelative, orDash } from "../../utils/format";
import PatientFormModal from "./PatientFormModal";

const SORT_ACCESSORS = {
  name: (patient) => patient.name,
  age: (patient) => calculateAge(patient.dob) ?? 0,
  lastVisitAt: (patient) => patient.lastVisitAt,
  status: (patient) => patient.status,
};

/**
 * Patients — the patient index.
 *
 * Search, filter, sort and pagination all come from useTableControls, so this
 * page holds only its column definitions and view state.
 */
function Patients() {
  useDocumentTitle("Patients");

  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([patientsService.list(), doctorsService.list()]).then(
        ([patients, doctors]) => ({
          patients,
          doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
          doctors,
        }),
      ),
    [],
  );

  const controls = useTableControls(data?.patients || [], {
    searchFields: ["name", "mrn", "phone", "email", "conditions"],
    initialSort: { key: "lastVisitAt", direction: "desc" },
    initialFilters: {
      status: params.get("status") || "all",
      riskLevel: params.get("risk") || "all",
    },
    sortAccessors: SORT_ACCESSORS,
    pageSize: 8,
  });

  const setFilter = (key, urlKey) => (event) => {
    const value = event.target.value;
    controls.setFilter(key, value);

    const next = new URLSearchParams(params);
    if (value === "all" || !value) next.delete(urlKey);
    else next.set(urlKey, value);
    setParams(next, { replace: true });
  };

  const columns = [
    {
      key: "name",
      header: "Patient",
      sortable: true,
      full: true,
      render: (patient) => (
        <Identity
          name={patient.name}
          meta={patient.mrn}
          size="sm"
          square
          accent
        />
      ),
    },
    {
      key: "age",
      header: "Age / sex",
      sortable: true,
      hideOn: "mobile",
      render: (patient) => {
        const age = calculateAge(patient.dob);
        return (
          <span className="t-tabular">
            {age !== null ? `${age}` : "—"}
            <span className="t-muted"> · {orDash(patient.gender?.[0]?.toUpperCase())}</span>
          </span>
        );
      },
    },
    {
      key: "bloodGroup",
      header: "Blood",
      hideOn: "mobile",
      render: (patient) => (
        <span className="t-mono t-ink">{orDash(patient.bloodGroup)}</span>
      ),
    },
    {
      key: "conditions",
      header: "Conditions",
      hideOn: "mobile",
      render: (patient) =>
        patient.conditions?.length > 0 ? (
          <span className="row row--tight row--wrap">
            <Badge tone="outline">{patient.conditions[0]}</Badge>
            {patient.conditions.length > 1 && (
              <Badge tone="muted">+{patient.conditions.length - 1}</Badge>
            )}
          </span>
        ) : (
          <span className="t-muted">—</span>
        ),
    },
    {
      key: "primaryDoctorId",
      header: "Primary clinician",
      hideOn: "mobile",
      render: (patient) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 180 }}>
          {orDash(data?.doctorsById.get(patient.primaryDoctorId)?.name)}
        </span>
      ),
    },
    {
      key: "riskLevel",
      header: "Risk",
      render: (patient) => <StatusBadge kind="severity" value={patient.riskLevel} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (patient) => <StatusBadge kind="patient" value={patient.status} />,
    },
    {
      key: "lastVisitAt",
      header: "Last seen",
      sortable: true,
      hideOn: "mobile",
      render: (patient) => (
        <span className="t-nowrap">{formatRelative(patient.lastVisitAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      stackedLabel: "",
      render: (patient) => (
        <Dropdown
          trigger={({ toggle }) => (
            <IconButton
              icon="more"
              label={`Actions for ${patient.name}`}
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                toggle();
              }}
            />
          )}
        >
          {({ close }) => (
            <>
              <DropdownItem
                icon="records"
                onClick={() => {
                  close();
                  navigate(`/patients/${patient.id}`);
                }}
              >
                Open record
              </DropdownItem>
              <DropdownItem
                icon="calendarPlus"
                onClick={() => {
                  close();
                  navigate(`/appointments/book?patientId=${patient.id}`);
                }}
              >
                Book appointment
              </DropdownItem>
              <DropdownItem
                icon="prescriptions"
                onClick={() => {
                  close();
                  navigate(`/prescriptions/new?patientId=${patient.id}`);
                }}
              >
                Write prescription
              </DropdownItem>
              <DropdownItem
                icon="ai"
                onClick={() => {
                  close();
                  navigate(`/ai?patientId=${patient.id}`);
                }}
              >
                Summarise with AI
              </DropdownItem>
            </>
          )}
        </Dropdown>
      ),
    },
  ];

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Care" title="Patients" />
        <ErrorState
          title="Patients could not be loaded"
          message="The patient directory is unavailable right now."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Care"
        title="Patients"
        lede="Every patient record you have access to, with their current status and risk flag."
        actions={
          <>
            <Button variant="outline" icon="download">
              Export
            </Button>
            <Button variant="primary" icon="userPlus" onClick={() => setFormOpen(true)}>
              Register patient
            </Button>
          </>
        }
      />

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by name, MRN, phone or condition"
        filters={
          <>
            <Select
              size="sm"
              options={[{ value: "all", label: "All statuses" }, ...statusOptions(PATIENT_STATUS_META)]}
              value={controls.filters.status}
              onChange={setFilter("status", "status")}
              aria-label="Filter by status"
            />
            <Select
              size="sm"
              options={[{ value: "all", label: "All risk levels" }, ...statusOptions(SEVERITY_META)]}
              value={controls.filters.riskLevel}
              onChange={setFilter("riskLevel", "risk")}
              aria-label="Filter by risk level"
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
              { value: "table", label: "Table", icon: "list" },
              { value: "cards", label: "Cards", icon: "grid" },
            ]}
          />
        }
      />

      {loading ? (
        view === "table" ? (
          <Card surface="soft">
            <CardBody>
              <SkeletonRows rows={6} />
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid--3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} variant="block" height={240} />
            ))}
          </div>
        )
      ) : controls.rows.length === 0 ? (
        <Card surface="soft">
          {controls.isFiltered ? (
            <EmptyState
              icon="search"
              title="No patients match those filters"
              message={`Nothing found for the current search and filter combination across ${controls.totalCount} records.`}
              secondary={
                <Button variant="outline" icon="close" onClick={controls.resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="patients"
              title="No patients yet"
              message="Register the first patient to start building the record."
              actionLabel="Register patient"
              actionIcon="userPlus"
              action={() => setFormOpen(true)}
            />
          )}
        </Card>
      ) : view === "table" ? (
        <Card surface="soft">
          <Table
            columns={columns}
            rows={controls.rows}
            caption="Patient directory"
            sort={controls.sort}
            onSortChange={controls.setSort}
            onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
          />
        </Card>
      ) : (
        <div className="grid grid--3">
          {controls.rows.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
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
          itemLabel="patients"
        />
      )}

      {!loading && controls.isFiltered && controls.rows.length > 0 && (
        <p className="t-caption row row--tight" style={{ marginTop: "var(--s-xs)" }}>
          <Icon name="filter" size={12} />
          Showing {controls.filteredCount} of {controls.totalCount} records
        </p>
      )}

      {formOpen && (
        <PatientFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          doctors={data?.doctors || []}
        />
      )}
    </div>
  );
}

export default Patients;
