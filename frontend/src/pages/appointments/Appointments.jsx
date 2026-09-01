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
  APPOINTMENT_TYPES,
  optionLabel,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { isFuture, isSameDay } from "../../utils/collection";
import { formatDate } from "../../utils/format";

function Appointments() {
  useDocumentTitle("Appointments");

  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [params, setParams] = useSearchParams();

  const scope = params.get("view") || "all";
  const [view, setView] = useState("table");

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        role === ROLES.PATIENT
          ? appointmentsService.listForPatient(user?.patientId || user?.id)
          : role === ROLES.DOCTOR
            ? appointmentsService.listForDoctor(user?.doctorId || user?.id)
            : appointmentsService.list(),
        patientsService.list().catch(() => []),
        doctorsService.list().catch(() => []),
      ]).then(([rawAppointments, rawPatients, rawDoctors]) => {
        const appointmentList = Array.isArray(rawAppointments?.items) ? rawAppointments.items : Array.isArray(rawAppointments) ? rawAppointments : [];
        const patientList = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
        const doctorList = Array.isArray(rawDoctors?.items) ? rawDoctors.items : Array.isArray(rawDoctors) ? rawDoctors : [];

        return {
          appointments: appointmentList,
          patientsById: new Map(patientList.map((patient) => [patient.id, patient])),
          doctorsById: new Map(doctorList.map((doctor) => [doctor.id, doctor])),
          doctors: doctorList,
        };
      }),
    [role, user?.patientId, user?.doctorId, user?.id],
  );

  const all = useMemo(() => data?.appointments || [], [data]);

  const scoped = useMemo(() => {
    switch (scope) {
      case "today":
        return all.filter((a) => isSameDay(a.appointment_date || a.startsAt));
      case "upcoming":
        return all.filter(
          (a) =>
            isFuture(a.appointment_date || a.startsAt) &&
            (a.status === "Scheduled" || a.status === "scheduled"),
        );
      case "past":
        return all.filter((a) => !isFuture(a.appointment_date || a.startsAt));
      default:
        return all;
    }
  }, [all, scope]);

  const controls = useTableControls(scoped, {
    searchFields: [
      "reason",
      "appointment_type",
      (a) => data?.patientsById.get(a.patient_id || a.patientId)?.name,
      (a) => data?.doctorsById.get(a.doctor_id || a.doctorId)?.name,
    ],
    initialSort: { key: "appointment_date", direction: scope === "past" ? "desc" : "asc" },
    initialFilters: {
      status: params.get("status") || "all",
      type: "all",
    },
    sortAccessors: { appointment_date: (a) => a.appointment_date || a.startsAt },
    pageSize: 10,
  });

  const setScope = (value) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("view");
    else next.set("view", value);
    setParams(next, { replace: true });
  };

  const counts = {
    today: all.filter((a) => isSameDay(a.appointment_date || a.startsAt)).length,
    upcoming: all.filter((a) => isFuture(a.appointment_date || a.startsAt)).length,
    past: all.filter((a) => !isFuture(a.appointment_date || a.startsAt)).length,
    all: all.length,
  };

  const perspective = role === ROLES.PATIENT ? "patient" : "doctor";

  const columns = [
    {
      key: "appointment_date",
      header: "When",
      sortable: true,
      render: (appointment) => (
        <div className="col col--gap-xxs">
          <span className="t-data t-ink t-tabular">
            {appointment.appointment_time || "09:00:00"}
          </span>
          <span className="t-caption t-nowrap">
            {formatDate(appointment.appointment_date || appointment.startsAt)}
          </span>
        </div>
      ),
    },
    {
      key: "patient_id",
      header: "Patient",
      full: true,
      render: (appointment) => {
        const p = data?.patientsById.get(appointment.patient_id || appointment.patientId);
        return (
          <Identity
            name={p?.name || `Patient #${appointment.patient_id || appointment.patientId}`}
            meta={p?.mobile_no}
            size="sm"
            square
            accent
          />
        );
      },
    },
    {
      key: "doctor_id",
      header: "Clinician",
      hideOn: "mobile",
      render: (appointment) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 170 }}>
          {data?.doctorsById.get(appointment.doctor_id || appointment.doctorId)?.name || `Doctor #${appointment.doctor_id || appointment.doctorId}`}
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
      key: "appointment_type",
      header: "Type",
      hideOn: "mobile",
      render: (appointment) => (
        <span className="t-label t-label--sm">
          {optionLabel(APPOINTMENT_TYPES, appointment.appointment_type || appointment.type || "General")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (appointment) => (
        <StatusBadge kind="appointment" value={appointment.status || "Scheduled"} />
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
        lede="Schedule of patient consultations and appointments."
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
              label="Scheduled"
              value={all.filter((a) => (a.status || "").toLowerCase() === "scheduled").length}
              icon="checkCircle"
            />
            <StatCard
              label="Cancelled"
              value={all.filter((a) => (a.status || "").toLowerCase() === "cancelled").length}
              icon="calendarX"
            />
          </>
        )}
      </section>

      <Tabs
        value={scope}
        onChange={setScope}
        items={[
          { value: "all", label: "All", count: counts.all },
          { value: "today", label: "Today", count: counts.today },
          { value: "upcoming", label: "Upcoming", count: counts.upcoming },
          { value: "past", label: "Past", count: counts.past },
        ]}
        className="stack"
      />

      <div style={{ marginTop: "var(--s-lg)" }}>
        <Toolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          searchPlaceholder="Search by patient, clinician, or reason"
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
            <EmptyState
              icon="appointments"
              title="No appointments found"
              message="Book an appointment to fill the schedule."
              actionLabel="Book appointment"
              actionIcon="calendarPlus"
              actionTo="/appointments/book"
            />
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
                patient={data?.patientsById?.get(appointment.patient_id || appointment.patientId)}
                doctor={data?.doctorsById?.get(appointment.doctor_id || appointment.doctorId)}
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
