import { useParams, useSearchParams } from "react-router-dom";

import { AppointmentRow } from "../../components/domain/AppointmentCard";
import RecordHeader from "../../components/domain/RecordHeader";
import Badge from "../../components/ui/Badge";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardHead } from "../../components/ui/Card";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Tabs from "../../components/ui/Tabs";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
} from "../../components/ui/States";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { isFuture, isSameDay } from "../../utils/collection";
import { formatCurrency, orDash } from "../../utils/format";

function DoctorDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();

  const tab = params.get("tab") || "overview";

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        doctorsService.getById(id),
        doctorsService.getSchedule(id).catch(() => []),
        appointmentsService.listForDoctor(id).catch(() => []),
        patientsService.list().catch(() => []),
      ]).then(([doctor, rawSchedule, rawAppointments, rawPatients]) => {
        const scheduleList = Array.isArray(rawSchedule) ? rawSchedule : rawSchedule?.weekly || [];
        const appointments = Array.isArray(rawAppointments) ? rawAppointments : rawAppointments?.items || [];
        const patientPage = rawPatients?.items ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];

        return {
          doctor,
          schedule: scheduleList,
          appointments,
          patients: patientPage,
          patientsById: new Map(patientPage.map((patient) => [patient.id, patient])),
        };
      }),
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

  const { doctor, schedule, appointments, patientsById } = data;
  const isAvailable = doctor.is_available ?? doctor.is_active ?? true;
  const presence = isAvailable
    ? { label: "Available", tone: "success" }
    : { label: "Off duty", tone: "muted" };

  const todays = appointments
    .filter((appointment) => isSameDay(appointment.appointment_date || appointment.startsAt))
    .sort((a, b) => new Date(a.appointment_date || a.startsAt) - new Date(b.appointment_date || b.startsAt));
  const upcoming = appointments
    .filter((appointment) => isFuture(appointment.appointment_date || appointment.startsAt))
    .sort((a, b) => new Date(a.appointment_date || a.startsAt) - new Date(b.appointment_date || b.startsAt));

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "schedule", label: "Duty Schedule", count: schedule.length },
    { value: "appointments", label: "Appointments", count: upcoming.length },
  ];

  return (
    <div className="page">
      <Breadcrumb
        items={[{ label: "Clinicians", to: "/doctors" }, { label: doctor.name }]}
      />

      <RecordHeader
        eyebrow={`Department ID #${doctor.department_id || 1}`}
        name={doctor.name}
        avatarStatus={isAvailable ? "online" : "off"}
        badges={
          <Badge tone={presence.tone} dot>
            {presence.label}
          </Badge>
        }
        meta={
          <MetaRow
            items={[
              { icon: "doctors", text: doctor.qualification || "Medical Specialist" },
              { icon: "mapPin", text: doctor.room_number ? `Room ${doctor.room_number}` : "Main Clinic" },
              { icon: "mail", text: orDash(doctor.email) },
              { icon: "phone", text: orDash(doctor.phone) },
            ]}
          />
        }
        actions={
          <Button
            variant="primary"
            icon="calendarPlus"
            to={`/appointments/book?doctorId=${doctor.id}`}
          >
            Book appointment
          </Button>
        }
        facts={[
          { label: "Experience", value: `${doctor.experience_years || doctor.experienceYears || 0} years` },
          { label: "Consultation fee", value: formatCurrency(doctor.consultation_fee || doctor.consultationFee || 0) },
          { label: "Qualifications", value: doctor.qualification || "MD" },
        ]}
      />

      <Tabs items={tabs} value={tab} onChange={setTab} className="stack" />

      <div style={{ marginTop: "var(--s-lg)" }}>
        {tab === "overview" && (
          <div className="col col--gap-lg">
            <div className="grid grid--split">
              <Card surface="soft">
                <CardHead title="Clinician Profile" />
                <CardBody>
                  <DefList
                    items={[
                      { label: "Full Name", value: doctor.name },
                      { label: "Department ID", value: String(doctor.department_id || 1) },
                      { label: "Qualifications", value: doctor.qualification || "MD", span: true },
                      { label: "Consulting Room", value: doctor.room_number ? `Room ${doctor.room_number}` : "Main Clinic" },
                      { label: "Experience", value: `${doctor.experience_years || 0} years` },
                    ]}
                  />
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
                            patient={patientsById.get(appointment.patient_id || appointment.patientId)}
                            perspective="doctor"
                          />
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <Card surface="soft">
            <CardHead
              title="Weekly Duty Schedule"
              subtitle={`${schedule.length} shifts recorded`}
            />
            <CardBody padding="none">
              {schedule.length === 0 ? (
                <EmptyState
                  size="compact"
                  icon="calendar"
                  title="No shifts defined"
                  message="This clinician has no duty schedule defined yet."
                />
              ) : (
                <div className="list">
                  {schedule.map((entry, index) => (
                    <div className="list__row" key={entry.id || index}>
                      <span className="t-label t-label--sm" style={{ minWidth: 100 }}>
                        {entry.day_of_week || entry.day}
                      </span>
                      <span className="grow t-data t-ink t-tabular">
                        {entry.start_time || entry.start} – {entry.end_time || entry.end}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                      patient={patientsById.get(appointment.patient_id || appointment.patientId)}
                      perspective="doctor"
                    />
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
