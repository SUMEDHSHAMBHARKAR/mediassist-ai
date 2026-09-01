import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { AppointmentRow } from "../../components/domain/AppointmentCard";
import RecordHeader from "../../components/domain/RecordHeader";
import SlotPicker from "../../components/domain/SlotPicker";
import Badge from "../../components/ui/Badge";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import StatCard from "../../components/ui/StatCard";
import Tabs from "../../components/ui/Tabs";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
} from "../../components/ui/States";
import { departmentLabel } from "../../constants/departments";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { isFuture, isSameDay } from "../../utils/collection";
import { formatCurrency, formatDateTime, formatNumber } from "../../utils/format";

const PRESENCE = {
  online: { label: "Available", tone: "success" },
  busy: { label: "In clinic", tone: "warning" },
  off: { label: "Off duty", tone: "muted" },
};

/** DoctorDetail — clinician profile, availability and workload. */
function DoctorDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();

  const tab = params.get("tab") || "overview";
  const [selectedDay, setSelectedDay] = useState(0);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        doctorsService.getById(id),
        doctorsService.getSchedule(id),
        appointmentsService.listForDoctor(id),
        patientsService.list(),
      ]).then(([doctor, schedule, appointments, patients]) => ({
        doctor,
        schedule,
        appointments,
        patients,
        patientsById: new Map(patients.map((patient) => [patient.id, patient])),
      })),
    [id],
  );

  useDocumentTitle(data?.doctor ? data.doctor.name : "Clinician");

  const setTab = (value) => {
    const next = new URLSearchParams(params);
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);
    setParams(next, { replace: true });
  };

  if (loading) {
    return (
      <div className="page">
        <Skeleton variant="block" height={180} />
        <div style={{ marginTop: "var(--s-lg)" }}>
          <LoadingState label="Loading clinician profile" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Breadcrumb
          items={[{ label: "Clinicians", to: "/doctors" }, { label: "Not found" }]}
        />
        <ErrorState title="Profile unavailable" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { doctor, schedule, appointments, patientsById, patients } = data;
  const presence = PRESENCE[doctor.status] || PRESENCE.off;

  const todays = appointments
    .filter((appointment) => isSameDay(appointment.startsAt))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const upcoming = appointments
    .filter((appointment) => isFuture(appointment.startsAt))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const panel = patients.filter((patient) => patient.primaryDoctorId === doctor.id);

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "availability", label: "Availability" },
    { value: "appointments", label: "Appointments", count: upcoming.length },
    { value: "panel", label: "Patient panel", count: panel.length },
  ];

  return (
    <div className="page">
      <Breadcrumb
        items={[{ label: "Clinicians", to: "/doctors" }, { label: doctor.name }]}
      />

      <RecordHeader
        eyebrow={departmentLabel(doctor.department)}
        name={doctor.name}
        avatarStatus={doctor.status}
        badges={
          <>
            <Badge tone={presence.tone} dot>
              {presence.label}
            </Badge>
            <Badge tone={doctor.acceptingNew ? "accent" : "muted"}>
              {doctor.acceptingNew ? "Accepting new patients" : "Panel closed"}
            </Badge>
            <Badge tone="outline" icon="star">
              {doctor.rating} · {doctor.reviewCount} reviews
            </Badge>
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "doctors", text: doctor.specialisation },
              { icon: "mapPin", text: doctor.room },
              { icon: "mail", text: doctor.email },
              { icon: "phone", text: doctor.phone },
            ]}
          />
        }
        actions={
          <>
            <Button variant="outline" icon="mail" href={`mailto:${doctor.email}`}>
              Contact
            </Button>
            <Button
              variant="primary"
              icon="calendarPlus"
              to={`/appointments/book?doctorId=${doctor.id}`}
            >
              Book appointment
            </Button>
          </>
        }
        facts={[
          { label: "Experience", value: `${doctor.experienceYears} years` },
          { label: "Consultation fee", value: formatCurrency(doctor.consultationFee) },
          { label: "Next available", value: formatDateTime(doctor.nextAvailable) },
          { label: "Languages", value: doctor.languages.join(", ") },
          { label: "Qualifications", value: doctor.qualifications },
        ]}
      />

      <Tabs items={tabs} value={tab} onChange={setTab} className="stack" />

      <div style={{ marginTop: "var(--s-lg)" }}>
        {tab === "overview" && (
          <div className="col col--gap-lg">
            <section className="grid grid--4">
              <StatCard
                label="Patients under care"
                value={formatNumber(doctor.patientsUnderCare)}
                icon="patients"
              />
              <StatCard
                label="Completed appointments"
                value={formatNumber(doctor.completedAppointments)}
                icon="checkCircle"
              />
              <StatCard label="Today's clinic" value={todays.length} icon="appointments" />
              <StatCard
                label="Rating"
                value={doctor.rating}
                unit="/5"
                icon="star"
                footnote={`${doctor.reviewCount} reviews`}
              />
            </section>

            <div className="grid grid--split">
              <Card surface="soft">
                <CardHead title="About" />
                <CardBody>
                  <div className="col col--gap-lg">
                    <p className="t-body">{doctor.bio}</p>
                    <div className="card__divider" />
                    <DefList
                      items={[
                        { label: "Department", value: departmentLabel(doctor.department) },
                        { label: "Speciality", value: doctor.specialisation },
                        { label: "Qualifications", value: doctor.qualifications, span: true },
                        { label: "Consulting room", value: doctor.room },
                        { label: "Languages", value: doctor.languages.join(", ") },
                      ]}
                    />
                  </div>
                </CardBody>
              </Card>

              <div className="col col--gap-lg">
                <Card surface="soft">
                  <CardHead
                    title="Today's clinic"
                    subtitle={`${todays.length} appointment${todays.length === 1 ? "" : "s"}`}
                  />
                  <CardBody padding="none">
                    {todays.length === 0 ? (
                      <EmptyState
                        size="inline"
                        icon="appointments"
                        title="No clinic today"
                        message="This clinician has no appointments scheduled today."
                      />
                    ) : (
                      <div className="list">
                        {todays.map((appointment) => (
                          <AppointmentRow
                            key={appointment.id}
                            appointment={appointment}
                            patient={patientsById.get(appointment.patientId)}
                            perspective="doctor"
                          />
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card surface="soft">
                  <CardHead title="Weekly template" />
                  <CardBody padding="none">
                    <div className="list">
                      {schedule.weekly.map((entry, index) => (
                        <div className="list__row" key={`${entry.day}-${index}`}>
                          <span
                            className="t-label t-label--sm"
                            style={{ minWidth: 92, flex: "none" }}
                          >
                            {entry.day}
                          </span>
                          <span className="grow t-data t-ink t-tabular">
                            {entry.start} – {entry.end}
                          </span>
                          <Badge tone="outline">{entry.location}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                  <CardFoot>
                    <button
                      type="button"
                      className="text-link text-link--sm"
                      onClick={() => setTab("availability")}
                    >
                      See open slots
                      <Icon name="arrowRight" size={13} />
                    </button>
                  </CardFoot>
                </Card>
              </div>
            </div>
          </div>
        )}

        {tab === "availability" && (
          <Card surface="soft">
            <CardHead
              title="Open slots"
              subtitle="Next 7 days · times shown in clinic local time"
              actions={
                <Button
                  size="sm"
                  variant="primary"
                  icon="calendarPlus"
                  to={`/appointments/book?doctorId=${doctor.id}`}
                >
                  Book
                </Button>
              }
            />
            <CardBody>
              <SlotPicker
                days={schedule.days}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                readOnly
              />
              <p className="t-caption" style={{ marginTop: "var(--s-md)" }}>
                Struck-through times are already taken. Start a booking to reserve a
                slot.
              </p>
            </CardBody>
          </Card>
        )}

        {tab === "appointments" && (
          <Card surface="soft">
            <CardHead
              title="Upcoming appointments"
              subtitle={`${upcoming.length} scheduled`}
            />
            <CardBody padding="none">
              {upcoming.length === 0 ? (
                <EmptyState
                  size="compact"
                  icon="appointments"
                  title="No upcoming appointments"
                  message="This clinician's future clinic is empty."
                  actionLabel="Book appointment"
                  actionIcon="calendarPlus"
                  actionTo={`/appointments/book?doctorId=${doctor.id}`}
                />
              ) : (
                <div className="list">
                  {upcoming.map((appointment) => (
                    <AppointmentRow
                      key={appointment.id}
                      appointment={appointment}
                      patient={patientsById.get(appointment.patientId)}
                      perspective="doctor"
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {tab === "panel" && (
          <Card surface="soft">
            <CardHead
              title="Patient panel"
              subtitle={`${panel.length} patients with this clinician as primary`}
            />
            <CardBody padding="none">
              {panel.length === 0 ? (
                <EmptyState
                  size="compact"
                  icon="patients"
                  title="No patients assigned"
                  message="Patients naming this clinician as primary appear here."
                />
              ) : (
                <div className="list">
                  {panel.map((patient) => (
                    <Link
                      key={patient.id}
                      to={`/patients/${patient.id}`}
                      className="list__row list__row--link"
                    >
                      <div className="grow col col--gap-xxs">
                        <span className="t-data t-ink">{patient.name}</span>
                        <span className="t-caption">
                          {patient.mrn} ·{" "}
                          {patient.conditions?.length > 0
                            ? patient.conditions.join(", ")
                            : "No recorded conditions"}
                        </span>
                      </div>
                      <Icon name="chevronRight" size={14} className="t-muted" />
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

export default DoctorDetail;
