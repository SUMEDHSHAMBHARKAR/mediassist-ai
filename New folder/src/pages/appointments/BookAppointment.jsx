import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import SlotPicker from "../../components/domain/SlotPicker";
import Avatar, { Identity } from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
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
import { DEPARTMENT_OPTIONS, departmentLabel } from "../../constants/departments";
import { ROLES } from "../../constants/roles";
import { APPOINTMENT_TYPES, optionLabel } from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { searchBy } from "../../utils/collection";
import cx from "../../utils/classNames";
import { formatCurrency, formatDateTime, formatTime } from "../../utils/format";

const DURATIONS = [
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
];

/**
 * BookAppointment — four-step booking flow.
 *
 * Steps are linear because each one narrows the next: the patient determines who
 * can see them, the clinician determines the slot grid, and the slot determines
 * what can be confirmed. A patient booking for themselves skips step one.
 */
function BookAppointment() {
  useDocumentTitle("Book appointment");

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { role, user } = useAuth();

  const isSelfBooking = role === ROLES.PATIENT;

  // Land on the first undecided step: a link that already names a clinician and a
  // patient should open at slot selection, not back at step one.
  const [step, setStep] = useState(() => {
    const hasPatient = Boolean(params.get("patientId")) || isSelfBooking;
    const hasDoctor = Boolean(params.get("doctorId"));

    if (hasPatient && hasDoctor) return 3;
    if (hasPatient) return 2;
    return 1;
  });

  const [patientId, setPatientId] = useState(
    params.get("patientId") || (isSelfBooking ? user.patientId : ""),
  );
  const [doctorId, setDoctorId] = useState(params.get("doctorId") || "");
  const [selectedDay, setSelectedDay] = useState(0);
  const [slot, setSlot] = useState(null);

  const [details, setDetails] = useState({
    type: "consultation",
    durationMinutes: "30",
    reason: "",
    notes: "",
  });

  const [patientQuery, setPatientQuery] = useState("");
  const [department, setDepartment] = useState(params.get("department") || "all");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([patientsService.list(), doctorsService.list()]).then(
        ([patients, doctors]) => ({ patients, doctors }),
      ),
    [],
  );

  const { data: schedule, loading: scheduleLoading } = useAsyncData(
    () => doctorsService.getSchedule(doctorId),
    [doctorId],
    { enabled: Boolean(doctorId) },
  );

  const patient = useMemo(
    () => (data?.patients || []).find((entry) => entry.id === patientId) || null,
    [data, patientId],
  );
  const doctor = useMemo(
    () => (data?.doctors || []).find((entry) => entry.id === doctorId) || null,
    [data, doctorId],
  );

  const patientMatches = useMemo(
    () =>
      searchBy(data?.patients || [], patientQuery, ["name", "mrn", "phone"]).slice(0, 6),
    [data, patientQuery],
  );

  const doctorMatches = useMemo(
    () =>
      (data?.doctors || []).filter(
        (entry) => department === "all" || entry.department === department,
      ),
    [data, department],
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
        patientId,
        doctorId,
        startsAt: slot,
        durationMinutes: Number(details.durationMinutes),
        type: details.type,
        reason: details.reason,
        notes: details.notes,
        status: "scheduled",
      });
      setConfirmed(created);
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
                <h1 className="t-display-sm">Appointment booked</h1>
                <p className="t-body" style={{ marginTop: "var(--s-sm)" }}>
                  {patient.name} will see {doctor.name} on{" "}
                  <span className="t-ink">{formatDateTime(slot)}</span>.
                </p>
              </div>

              <DefList
                items={[
                  { label: "Reference", value: confirmed.code },
                  { label: "Patient", value: patient.name },
                  { label: "Clinician", value: doctor.name },
                  { label: "Department", value: departmentLabel(doctor.department) },
                  { label: "When", value: formatDateTime(slot) },
                  { label: "Duration", value: `${details.durationMinutes} minutes` },
                  { label: "Type", value: optionLabel(APPOINTMENT_TYPES, details.type) },
                  { label: "Location", value: doctor.room },
                ]}
              />

              <Banner tone="accent" icon="info">
                The appointments API is not connected yet, so this booking is not
                persisted and will not appear in the schedule.
              </Banner>

              <div className="row row--tight row--wrap">
                <Button variant="primary" to="/appointments" icon="appointments">
                  Back to schedule
                </Button>
                <Button
                  variant="outline"
                  icon="calendarPlus"
                  onClick={() => {
                    setConfirmed(null);
                    setSlot(null);
                    setStep(isSelfBooking ? 2 : 1);
                    setDetails({
                      type: "consultation",
                      durationMinutes: "30",
                      reason: "",
                      notes: "",
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
    { number: 3, label: "Time", done: Boolean(slot) },
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
        lede="Choose a patient, a clinician and an open slot."
        actions={
          <Button variant="ghost" icon="arrowLeft" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="grid grid--split">
        <div className="col col--gap-lg">
          {/* Step rail */}
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
              <CardHead title="Select patient" subtitle="Search by name, MRN or phone" />
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
                      message="Enter at least part of a name, medical record number or phone number."
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
                            entry.id === patientId && "list__row--unread",
                          )}
                          onClick={() => {
                            setPatientId(entry.id);
                            setStep(2);
                          }}
                          style={{ width: "100%", textAlign: "left" }}
                        >
                          <Identity
                            name={entry.name}
                            meta={`${entry.mrn} · ${entry.phone}`}
                            size="sm"
                            square
                            accent
                          />
                          <span className="grow" />
                          {entry.allergies?.length > 0 && (
                            <Badge tone="critical" icon="alertTriangle">
                              Allergies
                            </Badge>
                          )}
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
                          entry.id === doctorId && "list__row--unread",
                        )}
                        onClick={() => {
                          setDoctorId(entry.id);
                          setSlot(null);
                          setStep(3);
                        }}
                        style={{ width: "100%", textAlign: "left" }}
                      >
                        <Avatar name={entry.name} size="sm" square accent status={entry.status} />
                        <div className="grow col col--gap-xxs">
                          <span className="t-data t-ink">{entry.name}</span>
                          <span className="t-caption">
                            {entry.specialisation} · {departmentLabel(entry.department)}
                          </span>
                        </div>
                        <span className="t-caption hide-mobile t-nowrap">
                          {formatCurrency(entry.consultationFee)}
                        </span>
                        {!entry.acceptingNew && <Badge tone="muted">Panel closed</Badge>}
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
                title="Choose a time"
                subtitle={doctor ? `${doctor.name} · next 7 days` : "Select a clinician first"}
              />
              <CardBody>
                {!doctorId ? (
                  <EmptyState
                    size="inline"
                    icon="doctors"
                    title="No clinician selected"
                    message="Go back and pick a clinician to see their open slots."
                    secondary={
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Select clinician
                      </Button>
                    }
                  />
                ) : scheduleLoading ? (
                  <LoadingState size="inline" label="Loading availability" />
                ) : (
                  <SlotPicker
                    days={schedule?.days || []}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                    selectedSlot={slot}
                    onSelectSlot={(entry) => {
                      setSlot(entry.startsAt);
                      setStep(4);
                    }}
                  />
                )}
              </CardBody>
            </Card>
          )}

          {step === 4 && (
            <Card surface="soft">
              <CardHead title="Appointment details" />
              <CardBody>
                <div className="col col--gap-md">
                  <div className="grid grid--2 grid--tight">
                    <Select
                      label="Appointment type"
                      options={APPOINTMENT_TYPES}
                      value={details.type}
                      onChange={(event) =>
                        setDetails({ ...details, type: event.target.value })
                      }
                    />
                    <Select
                      label="Duration"
                      options={DURATIONS}
                      value={details.durationMinutes}
                      onChange={(event) =>
                        setDetails({ ...details, durationMinutes: event.target.value })
                      }
                    />
                  </div>

                  <Textarea
                    label="Reason for visit"
                    rows={3}
                    required
                    placeholder="Presenting complaint or purpose of the appointment"
                    value={details.reason}
                    onChange={(event) =>
                      setDetails({ ...details, reason: event.target.value })
                    }
                    hint="Shown to the clinician before the consultation."
                  />

                  <Textarea
                    label="Notes for the patient (optional)"
                    rows={2}
                    placeholder="Fasting required, bring previous films, etc."
                    value={details.notes}
                    onChange={(event) =>
                      setDetails({ ...details, notes: event.target.value })
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
                  <Identity name={patient.name} meta={patient.mrn} size="sm" square accent />
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
                    meta={`${doctor.specialisation} · ${doctor.room}`}
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
                <span className="deflist__label">When</span>
                {slot ? (
                  <span className="t-title-sm t-ink">{formatDateTime(slot)}</span>
                ) : (
                  <span className="t-caption">No slot selected</span>
                )}
                {slot && (
                  <span className="t-caption">
                    {formatTime(slot)} for {details.durationMinutes} minutes
                  </span>
                )}
              </div>

              {doctor && (
                <>
                  <div className="divider" />
                  <div className="row row--between">
                    <span className="deflist__label">Consultation fee</span>
                    <span className="t-data t-ink t-tabular">
                      {formatCurrency(doctor.consultationFee)}
                    </span>
                  </div>
                </>
              )}

              {patient?.allergies?.length > 0 && (
                <Banner tone="critical" icon="alertTriangle">
                  Allergies on record: {patient.allergies.join(", ")}
                </Banner>
              )}

              <Button
                variant="primary"
                block
                icon="check"
                loading={submitting}
                disabled={!patientId || !doctorId || !slot || !details.reason.trim()}
                onClick={submit}
              >
                Confirm booking
              </Button>

              {(!patientId || !doctorId || !slot || !details.reason.trim()) && (
                <p className="t-caption">
                  {!patientId
                    ? "Select a patient to continue."
                    : !doctorId
                      ? "Select a clinician to continue."
                      : !slot
                        ? "Choose an available time slot."
                        : "Add a reason for the visit."}
                </p>
              )}

              {patient && (
                <Link to={`/patients/${patient.id}`} className="text-link text-link--sm">
                  Open patient record
                  <Icon name="arrowRight" size={12} />
                </Link>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default BookAppointment;
