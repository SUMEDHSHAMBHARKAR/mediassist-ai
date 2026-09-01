import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AppointmentCard from "../../components/domain/AppointmentCard";
import StatusBadge from "../../components/domain/StatusBadge";
import { Identity } from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import StatCard from "../../components/ui/StatCard";
import Table from "../../components/ui/Table";
import Tabs, { Segmented } from "../../components/ui/Tabs";
import Toolbar from "../../components/ui/Toolbar";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_META,
  APPOINTMENT_TYPES,
  optionLabel,
  statusOptions,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { isFuture, isSameDay } from "../../utils/collection";
import { formatDate, formatTime } from "../../utils/format";

/**
 * Appointments — the schedule index.
 *
 * The scope tabs (today / upcoming / past / all) mirror the backend's dedicated
 * endpoints, so each tab maps to one request once integration happens.
 */
function Appointments() {
  useDocumentTitle("Appointments");

  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [params, setParams] = useSearchParams();

  const scope = params.get("view") || "upcoming";
  const [view, setView] = useState("table");

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        role === ROLES.PATIENT
          ? appointmentsService.listForPatient(user.patientId)
          : role === ROLES.DOCTOR
            ? appointmentsService.listForDoctor(user.doctorId)
            : appointmentsService.list(),
        patientsService.list(),
        doctorsService.list(),
      ]).then(([appointments, patients, doctors]) => ({
        appointments,
        patientsById: new Map(patients.map((patient) => [patient.id, patient])),
        doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
        doctors,
      })),
    [role, user?.patientId, user?.doctorId],
  );

  // Memoised so the scope filter below has a stable dependency.
  const all = useMemo(() => data?.appointments || [], [data]);

  const scoped = useMemo(() => {
    switch (scope) {
      case "today":
        return all.filter((appointment) => isSameDay(appointment.startsAt));
      case "upcoming":
        return all.filter(
          (appointment) =>
            isFuture(appointment.startsAt) &&
            ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status),
        );
      case "past":
        return all.filter((appointment) => !isFuture(appointment.startsAt));
      default:
        return all;
    }
  }, [all, scope]);

  const controls = useTableControls(scoped, {
    searchFields: [
      "reason",
      "code",
      "room",
      (appointment) => data?.patientsById.get(appointment.patientId)?.name,
      (appointment) => data?.doctorsById.get(appointment.doctorId)?.name,
    ],
    initialSort: { key: "startsAt", direction: scope === "past" ? "desc" : "asc" },
    initialFilters: {
      status: params.get("status") || "all",
      type: "all",
      doctorId: params.get("doctorId") || "all",
    },
    sortAccessors: { startsAt: (appointment) => appointment.startsAt },
    pageSize: 10,
  });

  const setScope = (value) => {
    const next = new URLSearchParams(params);
    if (value === "upcoming") next.delete("view");
    else next.set("view", value);
    setParams(next, { replace: true });
  };

  const counts = {
    today: all.filter((appointment) => isSameDay(appointment.startsAt)).length,
    upcoming: all.filter(
      (appointment) =>
        isFuture(appointment.startsAt) &&
        ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status),
    ).length,
    past: all.filter((appointment) => !isFuture(appointment.startsAt)).length,
    all: all.length,
  };

  const perspective = role === ROLES.PATIENT ? "patient" : "doctor";

  const columns = [
    {
      key: "startsAt",
      header: "When",
      sortable: true,
      render: (appointment) => (
        <div className="col col--gap-xxs">
          <span className="t-data t-ink t-tabular">
            {formatTime(appointment.startsAt)}
          </span>
          <span className="t-caption t-nowrap">
            {isSameDay(appointment.startsAt) ? "Today" : formatDate(appointment.startsAt)}
          </span>
        </div>
      ),
    },
    {
      key: "patientId",
      header: "Patient",
      full: true,
      render: (appointment) => {
        const patient = data?.patientsById.get(appointment.patientId);
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
      key: "doctorId",
      header: "Clinician",
      hideOn: "mobile",
      render: (appointment) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 170 }}>
          {data?.doctorsById.get(appointment.doctorId)?.name || "—"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      hideOn: "mobile",
      render: (appointment) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 240 }}>
          {appointment.reason}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      hideOn: "mobile",
      render: (appointment) => (
        <span className="t-label t-label--sm">
          {optionLabel(APPOINTMENT_TYPES, appointment.type)}
        </span>
      ),
    },
    {
      key: "room",
      header: "Location",
      hideOn: "mobile",
      render: (appointment) => appointment.room || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (appointment) => (
        <StatusBadge kind="appointment" value={appointment.status} />
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
        <PageHeader eyebrow="Care" title="Appointments" />
        <ErrorState
          title="Schedule unavailable"
          message="Appointments could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Care"
        title="Appointments"
        lede="Today's clinic, what is coming up, and everything already seen."
        actions={
          <Button variant="primary" icon="calendarPlus" to="/appointments/book">
            Book appointment
          </Button>
        }
      />

      <section className="grid grid--4" style={{ marginBottom: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="block" height={110} />
          ))
        ) : (
          <>
            <StatCard label="Today" value={counts.today} icon="appointments" />
            <StatCard label="Upcoming" value={counts.upcoming} icon="clock" />
            <StatCard
              label="Completed"
              value={all.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length}
              icon="checkCircle"
            />
            <StatCard
              label="Cancelled or missed"
              value={
                all.filter((a) =>
                  [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW].includes(
                    a.status,
                  ),
                ).length
              }
              icon="calendarX"
            />
          </>
        )}
      </section>

      <Tabs
        value={scope}
        onChange={setScope}
        items={[
          { value: "today", label: "Today", count: counts.today },
          { value: "upcoming", label: "Upcoming", count: counts.upcoming },
          { value: "past", label: "Past", count: counts.past },
          { value: "all", label: "All", count: counts.all },
        ]}
        className="stack"
      />

      <div style={{ marginTop: "var(--s-lg)" }}>
        <Toolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          searchPlaceholder="Search by patient, clinician, reason or code"
          filters={
            <>
              <Select
                size="sm"
                options={[
                  { value: "all", label: "All statuses" },
                  ...statusOptions(APPOINTMENT_STATUS_META),
                ]}
                value={controls.filters.status}
                onChange={(event) => controls.setFilter("status", event.target.value)}
                aria-label="Filter by status"
              />
              <Select
                size="sm"
                options={[{ value: "all", label: "All types" }, ...APPOINTMENT_TYPES]}
                value={controls.filters.type}
                onChange={(event) => controls.setFilter("type", event.target.value)}
                aria-label="Filter by type"
              />
              {role === ROLES.ADMIN && (
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
                title="No appointments match"
                message="Nothing found for the current search and filters."
                secondary={
                  <Button variant="outline" icon="close" onClick={controls.resetFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={scope === "past" ? "history" : "appointments"}
                title={
                  scope === "today"
                    ? "No appointments today"
                    : scope === "upcoming"
                      ? "Nothing booked yet"
                      : scope === "past"
                        ? "No past appointments"
                        : "No appointments"
                }
                message={
                  scope === "past"
                    ? "Attended, cancelled and missed appointments will be listed here."
                    : "Book an appointment to fill the schedule."
                }
                actionLabel={scope === "past" ? undefined : "Book appointment"}
                actionIcon="calendarPlus"
                actionTo="/appointments/book"
              />
            )}
          </Card>
        ) : view === "table" ? (
          <Card surface="soft">
            <Table
              columns={columns}
              rows={controls.rows}
              caption="Appointment schedule"
              sort={controls.sort}
              onSortChange={controls.setSort}
              onRowClick={(appointment) => navigate(`/appointments/${appointment.id}`)}
            />
          </Card>
        ) : (
          <div className="grid grid--3">
            {controls.rows.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                patient={data.patientsById.get(appointment.patientId)}
                doctor={data.doctorsById.get(appointment.doctorId)}
                perspective={perspective}
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
            itemLabel="appointments"
          />
        )}
      </div>
    </div>
  );
}

export default Appointments;
