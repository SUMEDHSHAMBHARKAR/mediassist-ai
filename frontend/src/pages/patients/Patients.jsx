import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PatientCard from "../../components/domain/PatientCard";
import { Identity } from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import Dropdown, { DropdownItem } from "../../components/ui/Dropdown";
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
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import patientsService from "../../services/patientsService";
import { calculateAge, orDash } from "../../utils/format";
import PatientFormModal from "./PatientFormModal";

const GENDER_OPTIONS = [
  { value: "all", label: "All genders" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

function Patients() {
  useDocumentTitle("Patients");

  const navigate = useNavigate();

  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  const { data: patientPage, loading, error, reload } = useAsyncData(
    () =>
      patientsService.listPaginated({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        gender: genderFilter !== "all" ? genderFilter : undefined,
      }),
    [page, pageSize, search, genderFilter],
  );

  const patientRows = patientPage?.items ?? [];
  const totalCount = patientPage?.total_records ?? 0;
  const totalPages = patientPage?.total_pages ?? 1;

  const columns = [
    {
      key: "name",
      header: "Patient",
      sortable: false,
      full: true,
      render: (patient) => (
        <Identity
          name={patient.name}
          meta={patient.mobile_no}
          size="sm"
          square
          accent
        />
      ),
    },
    {
      key: "age",
      header: "Age / Gender",
      sortable: false,
      hideOn: "mobile",
      render: (patient) => {
        const age = calculateAge(patient.date_of_birth);
        return (
          <span className="t-tabular">
            {age !== null ? `${age} yrs` : "—"}
            <span className="t-muted"> · {orDash(patient.gender)}</span>
          </span>
        );
      },
    },
    {
      key: "address",
      header: "Address",
      hideOn: "mobile",
      render: (patient) => <span>{orDash(patient.address)}</span>,
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
          message={error.message}
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
        lede="Registered patient directory connected directly to live backend records."
        actions={
          <Button variant="primary" icon="userPlus" onClick={() => setFormOpen(true)}>
            Register patient
          </Button>
        }
      />

      <Toolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search patients by name..."
        filters={
          <>
            <Select
              size="sm"
              options={GENDER_OPTIONS}
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by gender"
            />
            {(search || genderFilter !== "all") && (
              <Button
                size="sm"
                variant="ghost"
                icon="close"
                onClick={() => {
                  setSearch("");
                  setGenderFilter("all");
                  setPage(1);
                }}
              >
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
              <Skeleton key={index} variant="block" height={200} />
            ))}
          </div>
        )
      ) : patientRows.length === 0 ? (
        <Card surface="soft">
          {search || genderFilter !== "all" ? (
            <EmptyState
              icon="search"
              title="No patients match search criteria"
              message="Try adjusting search or gender filter."
              secondary={
                <Button
                  variant="outline"
                  icon="close"
                  onClick={() => {
                    setSearch("");
                    setGenderFilter("all");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="patients"
              title="No patients registered"
              message="Register the first patient to build your hospital directory."
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
            rows={patientRows}
            caption="Patient directory"
            onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
          />
        </Card>
      ) : (
        <div className="grid grid--3">
          {patientRows.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}

      {!loading && patientRows.length > 0 && (
        <Pagination
          page={page}
          pageCount={totalPages}
          pageSize={pageSize}
          total={totalCount}
          onChange={setPage}
          itemLabel="patients"
        />
      )}

      {formOpen && (
        <PatientFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={() => reload()}
        />
      )}
    </div>
  );
}

export default Patients;
