import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import DoctorCard from "../../components/domain/DoctorCard";
import { Identity } from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader, { SectionHead } from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import Table from "../../components/ui/Table";
import { Segmented } from "../../components/ui/Tabs";
import Toolbar from "../../components/ui/Toolbar";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { DEPARTMENT_OPTIONS, departmentLabel } from "../../constants/departments";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import doctorsService from "../../services/doctorsService";
import { groupBy } from "../../utils/collection";
import { formatCurrency, formatDateTime } from "../../utils/format";

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Any availability" },
  { value: "online", label: "Available now" },
  { value: "busy", label: "In clinic" },
  { value: "off", label: "Off duty" },
];

const PRESENCE_TONE = { online: "success", busy: "warning", off: "muted" };
const PRESENCE_LABEL = { online: "Available", busy: "In clinic", off: "Off duty" };

/**
 * Doctors — the clinician directory.
 *
 * Offers a department-grouped view alongside the flat list, because "who is in
 * cardiology" is the question this page is opened with most often.
 */
function Doctors() {
  useDocumentTitle("Clinicians");

  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("cards");

  const { data, loading, error, reload } = useAsyncData(
    () => doctorsService.list(),
    [],
    { initialData: [] },
  );

  const controls = useTableControls(data || [], {
    searchFields: ["name", "specialisation", "department", "qualifications"],
    initialSort: { key: "name", direction: "asc" },
    initialFilters: {
      department: params.get("department") || "all",
      status: params.get("status") || "all",
    },
    sortAccessors: {
      name: (doctor) => doctor.name,
      experienceYears: (doctor) => doctor.experienceYears,
      rating: (doctor) => doctor.rating,
      consultationFee: (doctor) => doctor.consultationFee,
    },
    pageSize: view === "grouped" ? 100 : 9,
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
      header: "Clinician",
      sortable: true,
      full: true,
      render: (doctor) => (
        <Identity
          name={doctor.name}
          meta={doctor.specialisation}
          size="sm"
          square
          accent
          status={doctor.status}
        />
      ),
    },
    {
      key: "department",
      header: "Department",
      hideOn: "mobile",
      render: (doctor) => (
        <span className="t-label t-label--sm">{departmentLabel(doctor.department)}</span>
      ),
    },
    {
      key: "experienceYears",
      header: "Experience",
      sortable: true,
      align: "right",
      hideOn: "mobile",
      render: (doctor) => `${doctor.experienceYears} yrs`,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      hideOn: "mobile",
      render: (doctor) => (
        <span className="row row--tight">
          <Icon name="star" size={12} className="t-warning" />
          <span className="t-ink t-tabular">{doctor.rating}</span>
          <span className="t-muted">({doctor.reviewCount})</span>
        </span>
      ),
    },
    {
      key: "consultationFee",
      header: "Fee",
      sortable: true,
      align: "right",
      hideOn: "mobile",
      render: (doctor) => formatCurrency(doctor.consultationFee),
    },
    {
      key: "status",
      header: "Presence",
      render: (doctor) => (
        <Badge tone={PRESENCE_TONE[doctor.status]} dot>
          {PRESENCE_LABEL[doctor.status]}
        </Badge>
      ),
    },
    {
      key: "nextAvailable",
      header: "Next available",
      hideOn: "mobile",
      render: (doctor) => (
        <span className="t-nowrap">{formatDateTime(doctor.nextAvailable)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      stackedLabel: "",
      render: (doctor) => (
        <Button
          size="sm"
          variant="outline"
          icon="calendarPlus"
          to={`/appointments/book?doctorId=${doctor.id}`}
          onClick={(event) => event.stopPropagation()}
        >
          Book
        </Button>
      ),
    },
  ];

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Care" title="Clinicians" />
        <ErrorState
          title="Directory unavailable"
          message="The clinician directory could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const grouped =
    view === "grouped" ? [...groupBy(controls.rows, "department").entries()] : [];

  const availableNow = (data || []).filter((doctor) => doctor.status === "online").length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Care"
        title="Clinicians"
        lede={
          loading
            ? "Loading the directory"
            : `${data.length} clinicians across ${new Set(data.map((d) => d.department)).size} departments · ${availableNow} available now.`
        }
        actions={
          <Button variant="primary" icon="calendarPlus" to="/appointments/book">
            Book appointment
          </Button>
        }
      />

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by name, speciality or qualification"
        filters={
          <>
            <Select
              size="sm"
              options={[{ value: "all", label: "All departments" }, ...DEPARTMENT_OPTIONS]}
              value={controls.filters.department}
              onChange={setFilter("department", "department")}
              aria-label="Filter by department"
            />
            <Select
              size="sm"
              options={AVAILABILITY_OPTIONS}
              value={controls.filters.status}
              onChange={setFilter("status", "status")}
              aria-label="Filter by availability"
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
              { value: "grouped", label: "By dept", icon: "department" },
              { value: "table", label: "Table", icon: "list" },
            ]}
          />
        }
      />

      {loading ? (
        <div className="grid grid--3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} variant="block" height={260} />
          ))}
        </div>
      ) : controls.rows.length === 0 ? (
        <Card surface="soft">
          <EmptyState
            icon="search"
            title="No clinicians match those filters"
            message="Try a different department or clear the availability filter."
            secondary={
              <Button variant="outline" icon="close" onClick={controls.resetFilters}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : view === "table" ? (
        <Card surface="soft">
          <Table
            columns={columns}
            rows={controls.rows}
            caption="Clinician directory"
            sort={controls.sort}
            onSortChange={controls.setSort}
            onRowClick={(doctor) => navigate(`/doctors/${doctor.id}`)}
          />
        </Card>
      ) : view === "grouped" ? (
        <div className="col col--gap-lg">
          {grouped.map(([department, list]) => (
            <section key={department}>
              <SectionHead
                title={departmentLabel(department)}
                meta={`${list.length} clinician${list.length === 1 ? "" : "s"}`}
              />
              <div className="grid grid--3">
                {list.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid--3">
          {controls.rows.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}

      {!loading && view !== "grouped" && controls.rows.length > 0 && (
        <Pagination
          page={controls.page}
          pageCount={controls.pageCount}
          pageSize={controls.pageSize}
          total={controls.filteredCount}
          onChange={controls.setPage}
          itemLabel="clinicians"
        />
      )}
    </div>
  );
}

export default Doctors;
