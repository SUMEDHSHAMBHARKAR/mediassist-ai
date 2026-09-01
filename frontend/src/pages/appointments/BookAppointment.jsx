import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Avatar, { Identity } from "../../components/ui/Avatar";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardHead } from "../../components/ui/Card";
import DefList from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import SearchInput from "../../components/ui/SearchInput";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { DEPARTMENT_OPTIONS } from "../../constants/departments";
import { ROLES } from "../../constants/roles";
import { APPOINTMENT_TYPES } from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { searchBy } from "../../utils/collection";
import cx from "../../utils/classNames";
import { formatCurrency, formatDate } from "../../utils/format";

const TIME_SLOTS = [
  "09:00:00",
  "09:30:00",
  "10:00:00",
  "10:30:00",
  "11:00:00",
  "11:30:00",
  "14:00:00",
  "14:30:00",
  "15:00:00",
  "15:30:00",
  "16:00:00",
];

function BookAppointment() {
  useDocumentTitle("Book appointment");

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { role, user } = useAuth();

  const isSelfBooking = role === ROLES.PATIENT;

  const [step, setStep] = useState(() => {
    const hasPatient = Boolean(params.get("patientId")) || isSelfBooking;
    const hasDoctor = Boolean(params.get("doctorId"));

    if (hasPatient && hasDoctor) return 3;
    if (hasPatient) return 2;
    return 1;
  });

  const [patientId, setPatientId] = useState(
    params.get("patientId") || (isSelfBooking ? user?.patientId || user?.id : ""),
  );
  const [doctorId, setDoctorId] = useState(params.get("doctorId") || "");
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [appointmentTime, setAppointmentTime] = useState("09:00:00");

  const [details, setDetails] = useState({
    type: "General",
    reason: "General Consultation",
  });

  const [patientQuery, setPatientQuery] = useState("");
  const [department, setDepartment] = useState(params.get("department") || "all");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        patientsService.list().catch(() => []),
        doctorsService.list().catch(() => []),
      ]).then(([rawPatients, rawDoctors]) => {
        const patients = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
        const doctors = Array.isArray(rawDoctors?.items) ? rawDoctors.items : Array.isArray(rawDoctors) ? rawDoctors : [];
        return { patients, doctors };
      }),
    [],
  );

  const patientList = useMemo(() => data?.patients || [], [data?.patients]);
  const doctorList = useMemo(() => data?.doctors || [], [data?.doctors]);

  const patient = useMemo(
    () => patientList.find((entry) => String(entry.id) === String(patientId)) || null,
    [patientList, patientId],
  );
  const doctor = useMemo(
    () => doctorList.find((entry) => String(entry.id) === String(doctorId)) || null,
    [doctorList, doctorId],
  );

  const patientMatches = useMemo(
    () => searchBy(patientList, patientQuery, ["name", "mobile_no", "address"]).slice(0, 6),
    [patientList, patientQuery],
  );

  const doctorMatches = useMemo(
    () =>
      doctorList.filter(
        (entry) => department === "all" || String(entry.department_id) === String(department),
      ),
    [doctorList, department],
  );

  if (loading) {
    return (
      <div className="page">
        <LoadingState label="Preparing booking" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title="Booking unavailable"
          message="Patients and clinicians could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const submit = async () => {
    setSubmitting(true);
    try {
      const created = await appointmentsService.create({
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: details.reason.trim() || "Consultation",
        appointment_type: details.type || "General",
      });
      setConfirmed(created);
    } catch (err) {
      alert(err?.message || "Could not create appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: "Appointments", to: "/appointments" },
            { label: "Booking confirmed" },
          ]}
        />

        <Card surface="soft" stripe>
          <CardBody>
            <div className="col col--gap-lg" style={{ maxWidth: 560 }}>
              <span className="state__icon" aria-hidden="true" style={{ margin: 0 }}>
                <Icon name="checkCircle" size={22} />
              </span>

              <div>
                <h1 className="t-display-sm">Appointment Booked</h1>
                <p className="t-body" style={{ marginTop: "var(--s-sm)" }}>
                  Appointment ID #{confirmed.id} created successfully on{" "}
                  <span className="t-ink">{formatDate(confirmed.appointment_date)} at {confirmed.appointment_time}</span>.
                </p>
              </div>

              <DefList
                items={[
                  { label: "Appointment ID", value: `#${confirmed.id}` },
                  { label: "Patient ID", value: `#${confirmed.patient_id}` },
                  { label: "Doctor ID", value: `#${confirmed.doctor_id}` },
                  { label: "Date", value: formatDate(confirmed.appointment_date) },
                  { label: "Time", value: confirmed.appointment_time },
                  { label: "Type", value: confirmed.appointment_type },
                  { label: "Reason", value: confirmed.reason },
                  { label: "Status", value: confirmed.status || "Scheduled" },
                ]}
              />

              <div className="row row--tight row--wrap">
                <Button variant="primary" to="/appointments" icon="appointments">
                  Back to schedule
                </Button>
                <Button
                  variant="outline"
                  icon="calendarPlus"
                  onClick={() => {
                    setConfirmed(null);
                    setStep(isSelfBooking ? 2 : 1);
                    setDetails({
                      type: "General",
                      reason: "General Consultation",
                    });
                  }}
                >
                  Book another
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const steps = [
    { number: 1, label: "Patient", done: Boolean(patientId), skipped: isSelfBooking },
    { number: 2, label: "Clinician", done: Boolean(doctorId) },
    { number: 3, label: "Date & Time", done: Boolean(appointmentDate && appointmentTime) },
    { number: 4, label: "Details", done: Boolean(details.reason.trim()) },
  ].filter((entry) => !entry.skipped);

  return (
    <div className="page">
      <Breadcrumb
        items={[{ label: "Appointments", to: "/appointments" }, { label: "Book" }]}
      />

      <PageHeader
        eyebrow="Scheduling"
        title="Book appointment"
        lede="Choose a patient, a clinician and an open time slot."
        actions={
          <Button variant="ghost" icon="arrowLeft" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="grid grid--split">
        <div className="col col--gap-lg">
          <div className="row row--wrap" style={{ gap: "var(--s-md)" }}>
            {steps.map((entry) => (
              <button
                type="button"
                key={entry.number}
                className={cx("row row--tight")}
                onClick={() => setStep(entry.number)}
                style={{
                  opacity: step === entry.number ? 1 : 0.55,
                  borderBottom:
                    step === entry.number ? "2px solid var(--ink)" : "2px solid transparent",
                  paddingBottom: 6,
                }}
              >
                <span
                  className="badge"
                  style={{
                    background: entry.done ? "var(--success-tint)" : "var(--neutral-tint)",
                    borderColor: entry.done ? "var(--success-line)" : "var(--neutral-tint)",
                    color: entry.done ? "#4ec96f" : "var(--body-strong)",
                    width: 22,
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {entry.done ? <Icon name="check" size={11} strokeWidth={2.4} /> : entry.number}
                </span>
                <span className="t-label t-label--sm t-label--ink">{entry.label}</span>
              </button>
            ))}
          </div>

          {step === 1 && (
            <Card surface="soft">
              <CardHead title="Select patient" subtitle="Search by patient name" />
              <CardBody>
                <div className="col col--gap-md">
                  <SearchInput
                    value={patientQuery}
                    onChange={setPatientQuery}
                    placeholder="Start typing a patient name"
                    label="Search patients"
                  />

                  {patientQuery.trim() === "" ? (
                    <EmptyState
                      size="inline"
                      icon="patients"
                      title="Search for a patient"
                      message="Enter patient name to select."
                    />
                  ) : patientMatches.length === 0 ? (
                    <EmptyState
                      size="inline"
                      icon="search"
                      title="No matching patients"
                      message={`Nothing found for “${patientQuery}”.`}
                    />
                  ) : (
                    <div className="list">
                      {patientMatches.map((entry) => (
                        <button
                          type="button"
                          key={entry.id}
                          className={cx(
                            "list__row list__row--link",
                            String(entry.id) === String(patientId) && "list__row--unread",
                          )}
                          onClick={() => {
                            setPatientId(entry.id);
                            setStep(2);
                          }}
                          style={{ width: "100%", textAlign: "left" }}
                        >
                          <Identity
                            name={entry.name}
                            meta={entry.mobile_no}
                            size="sm"
                            square
                            accent
                          />
                          <span className="grow" />
                          <Icon name="chevronRight" size={14} className="t-muted" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {step === 2 && (
            <Card surface="soft">
              <CardHead
                title="Select clinician"
                subtitle={`${doctorMatches.length} available`}
                actions={
                  <Select
                    size="sm"
                    options={[{ value: "all", label: "All departments" }, ...DEPARTMENT_OPTIONS]}
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    aria-label="Filter by department"
                  />
                }
              />
              <CardBody padding="none">
                {doctorMatches.length === 0 ? (
                  <EmptyState
                    size="compact"
                    icon="doctors"
                    title="No clinicians in this department"
                    message="Choose a different department."
                  />
                ) : (
                  <div className="list">
                    {doctorMatches.map((entry) => (
                      <button
                        type="button"
                        key={entry.id}
                        className={cx(
                          "list__row list__row--link",
                          String(entry.id) === String(doctorId) && "list__row--unread",
                        )}
                        onClick={() => {
                          setDoctorId(entry.id);
                          setStep(3);
                        }}
                        style={{ width: "100%", textAlign: "left" }}
                      >
                        <Avatar name={entry.name} size="sm" square accent status="online" />
                        <div className="grow col col--gap-xxs">
                          <span className="t-data t-ink">{entry.name}</span>
                          <span className="t-caption">
                            {entry.qualification || "Specialist"} · Department #{entry.department_id}
                          </span>
                        </div>
                        <span className="t-caption hide-mobile t-nowrap">
                          {formatCurrency(entry.consultation_fee || 0)}
                        </span>
                        <Icon name="chevronRight" size={14} className="t-muted" />
                      </button>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {step === 3 && (
            <Card surface="soft">
              <CardHead
                title="Choose Date & Time"
                subtitle={doctor ? `${doctor.name}` : "Select a clinician first"}
              />
              <CardBody>
                <div className="col col--gap-md">
                  <label className="t-label t-label--sm">Appointment Date</label>
                  <input
                    type="date"
                    className="input"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />

                  <label className="t-label t-label--sm" style={{ marginTop: "var(--s-md)" }}>
                    Select Time Slot
                  </label>
                  <div className="grid grid--3 grid--tight">
                    {TIME_SLOTS.map((slotTime) => (
                      <Button
                        key={slotTime}
                        type="button"
                        size="sm"
                        variant={appointmentTime === slotTime ? "primary" : "outline"}
                        onClick={() => {
                          setAppointmentTime(slotTime);
                          setStep(4);
                        }}
                      >
                        {slotTime.substring(0, 5)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {step === 4 && (
            <Card surface="soft">
              <CardHead title="Appointment details" />
              <CardBody>
                <div className="col col--gap-md">
                  <Select
                    label="Appointment type"
                    options={APPOINTMENT_TYPES}
                    value={details.type}
                    onChange={(event) =>
                      setDetails({ ...details, type: event.target.value })
                    }
                  />

                  <Textarea
                    label="Reason for visit"
                    rows={3}
                    required
                    placeholder="Presenting complaint or purpose of appointment"
                    value={details.reason}
                    onChange={(event) =>
                      setDetails({ ...details, reason: event.target.value })
                    }
                  />
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Summary rail */}
        <Card surface="soft" stripe>
          <CardHead title="Booking summary" />
          <CardBody>
            <div className="col col--gap-md">
              <div className="col col--gap-xs">
                <span className="deflist__label">Patient</span>
                {patient ? (
                  <Identity name={patient.name} meta={patient.mobile_no} size="sm" square accent />
                ) : (
                  <span className="t-caption">Not selected</span>
                )}
              </div>

              <div className="divider" />

              <div className="col col--gap-xs">
                <span className="deflist__label">Clinician</span>
                {doctor ? (
                  <Identity
                    name={doctor.name}
                    meta={`${doctor.qualification || "Specialist"} · Room ${doctor.room_number || "101"}`}
                    size="sm"
                    square
                    accent
                  />
                ) : (
                  <span className="t-caption">Not selected</span>
                )}
              </div>

              <div className="divider" />

              <div className="col col--gap-xs">
                <span className="deflist__label">Date & Time</span>
                <span className="t-title-sm t-ink">{formatDate(appointmentDate)} at {appointmentTime}</span>
              </div>

              {doctor && (
                <>
                  <div className="divider" />
                  <div className="row row--between">
                    <span className="deflist__label">Consultation fee</span>
                    <span className="t-data t-ink t-tabular">
                      {formatCurrency(doctor.consultation_fee || 0)}
                    </span>
                  </div>
                </>
              )}

              <Button
                variant="primary"
                block
                icon="check"
                loading={submitting}
                disabled={!patientId || !doctorId || !appointmentDate || !details.reason.trim()}
                onClick={submit}
              >
                Confirm booking
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default BookAppointment;
