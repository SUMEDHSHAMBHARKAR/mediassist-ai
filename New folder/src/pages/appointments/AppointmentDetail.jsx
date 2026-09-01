import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import SlotPicker from "../../components/domain/SlotPicker";
import StatusBadge from "../../components/domain/StatusBadge";
import VitalsStrip from "../../components/domain/VitalsStrip";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Timeline from "../../components/ui/Timeline";
import { ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { departmentLabel } from "../../constants/departments";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_META,
  APPOINTMENT_TYPES,
  optionLabel,
  statusOptions,
} from "../../constants/statuses";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { calculateAge, formatDate, formatDateTime, formatTime, orDash } from "../../utils/format";

const CANCEL_REASONS = [
  { value: "patient_request", label: "Patient request" },
  { value: "clinician_unavailable", label: "Clinician unavailable" },
  { value: "clinical_reason", label: "Clinical reason" },
  { value: "duplicate", label: "Duplicate booking" },
  { value: "other", label: "Other" },
];

/**
 * AppointmentDetail — a single appointment with its lifecycle actions.
 *
 * Status change, reschedule and cancel all go through appointmentsService and
 * update local state optimistically. Nothing is persisted yet, which the page
 * states explicitly rather than implying a saved change.
 */
function AppointmentDetail() {
  const { id } = useParams();

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [cancelReason, setCancelReason] = useState("patient_request");
  const [cancelNote, setCancelNote] = useState("");

  const { data, loading, error, reload, setData } = useAsyncData(
    () =>
      appointmentsService.getById(id).then((appointment) =>
        Promise.all([
          patientsService.getById(appointment.patientId),
          doctorsService.getById(appointment.doctorId),
          doctorsService.getSchedule(appointment.doctorId),
        ]).then(([patient, doctor, schedule]) => ({
          appointment,
          patient,
          doctor,
          schedule,
        })),
      ),
    [id],
  );

  useDocumentTitle(data?.appointment ? data.appointment.code : "Appointment");

  if (loading) {
    return (
      <div className="page">
        <Skeleton variant="block" height={180} />
        <div style={{ marginTop: "var(--s-lg)" }}>
          <LoadingState label="Loading appointment" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Breadcrumb
          items={[{ label: "Appointments", to: "/appointments" }, { label: "Not found" }]}
        />
        <ErrorState title="Appointment unavailable" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { appointment, patient, doctor, schedule } = data;
  const isActive = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status);
  const age = calculateAge(patient.dob);

  const patch = (changes, message) => {
    setData({ ...data, appointment: { ...appointment, ...changes } });
    setNotice(message);
  };

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      await appointmentsService.setStatus(appointment.id, status);
      patch(
        { status },
        `Status set to ${optionLabel(statusOptions(APPOINTMENT_STATUS_META), status)}.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmReschedule = async () => {
    if (!selectedSlot) return;
    setBusy(true);
    try {
      await appointmentsService.reschedule(appointment.id, selectedSlot);
      patch(
        { startsAt: selectedSlot, status: APPOINTMENT_STATUS.SCHEDULED },
        `Moved to ${formatDateTime(selectedSlot)}.`,
      );
      setRescheduleOpen(false);
      setSelectedSlot(null);
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async () => {
    setBusy(true);
    try {
      await appointmentsService.cancel(appointment.id, cancelReason);
      patch(
        {
          status: APPOINTMENT_STATUS.CANCELLED,
          notes: cancelNote || appointment.notes,
        },
        "Appointment cancelled.",
      );
      setCancelOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: "Appointments", to: "/appointments" },
          { label: appointment.code },
        ]}
      />

      <RecordHeader
        eyebrow={appointment.code}
        name={patient.name}
        badges={
          <>
            <StatusBadge kind="appointment" value={appointment.status} />
            <Badge tone="outline">
              {optionLabel(APPOINTMENT_TYPES, appointment.type)}
            </Badge>
            <Badge tone="muted" icon="clock">
              {appointment.durationMinutes} min
            </Badge>
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "appointments", text: formatDateTime(appointment.startsAt) },
              { icon: "mapPin", text: appointment.room },
              { icon: "doctors", text: doctor.name },
            ]}
          />
        }
        actions={
          isActive ? (
            <>
              {appointment.status === APPOINTMENT_STATUS.SCHEDULED && (
                <Button
                  variant="primary"
                  icon="check"
                  onClick={() => changeStatus(APPOINTMENT_STATUS.CONFIRMED)}
                  loading={busy}
                >
                  Confirm
                </Button>
              )}
              {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                <Button
                  variant="primary"
                  icon="play"
                  onClick={() => changeStatus(APPOINTMENT_STATUS.IN_PROGRESS)}
                  loading={busy}
                >
                  Start consultation
                </Button>
              )}
              {appointment.status === APPOINTMENT_STATUS.IN_PROGRESS && (
                <Button
                  variant="primary"
                  icon="checkCircle"
                  onClick={() => changeStatus(APPOINTMENT_STATUS.COMPLETED)}
                  loading={busy}
                >
                  Mark completed
                </Button>
              )}

              <Button
                variant="outline"
                icon="history"
                onClick={() => setRescheduleOpen(true)}
              >
                Reschedule
              </Button>
              <Button variant="danger" icon="calendarX" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                icon="records"
                to={`/medical-records/new?patientId=${patient.id}&appointmentId=${appointment.id}`}
              >
                Add record
              </Button>
              <Button
                variant="primary"
                icon="calendarPlus"
                to={`/appointments/book?patientId=${patient.id}&doctorId=${doctor.id}`}
              >
                Book follow-up
              </Button>
            </>
          )
        }
        facts={[
          { label: "Date", value: formatDate(appointment.startsAt) },
          { label: "Time", value: formatTime(appointment.startsAt) },
          { label: "Department", value: departmentLabel(doctor.department) },
          { label: "Patient age", value: age !== null ? `${age} years` : "—" },
          { label: "Booked", value: formatDate(appointment.createdAt) },
        ]}
      />

      {notice && (
        <Banner
          tone="success"
          title="Change applied locally"
          className="stack"
          onDismiss={() => setNotice(null)}
        >
          {notice} The appointments API is not connected yet, so this is not saved.
        </Banner>
      )}

      {appointment.status === APPOINTMENT_STATUS.CANCELLED && (
        <Banner tone="critical" title="This appointment was cancelled" className="stack">
          Book a replacement if the patient still needs to be seen.
        </Banner>
      )}

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Consultation" />
            <CardBody>
              <div className="col col--gap-lg">
                <div>
                  <span className="deflist__label">Reason for visit</span>
                  <p className="t-body" style={{ marginTop: 4 }}>
                    {appointment.reason}
                  </p>
                </div>

                {appointment.notes && (
                  <div>
                    <span className="deflist__label">Clinical notes</span>
                    <p className="t-body" style={{ marginTop: 4 }}>
                      {appointment.notes}
                    </p>
                  </div>
                )}

                <div className="card__divider" />

                <DefList
                  items={[
                    { label: "Type", value: optionLabel(APPOINTMENT_TYPES, appointment.type) },
                    { label: "Duration", value: `${appointment.durationMinutes} minutes` },
                    { label: "Location", value: orDash(appointment.room) },
                    { label: "Reference", value: appointment.code },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead
              title="Patient"
              actions={
                <Button size="sm" variant="ghost" to={`/patients/${patient.id}`} iconEnd="arrowRight">
                  Full record
                </Button>
              }
            />
            <CardBody>
              <div className="col col--gap-md">
                <DefList
                  items={[
                    { label: "Name", value: patient.name },
                    { label: "MRN", value: patient.mrn },
                    { label: "Age", value: age !== null ? `${age} years` : "—" },
                    { label: "Blood group", value: orDash(patient.bloodGroup) },
                    { label: "Phone", value: patient.phone },
                    {
                      label: "Allergies",
                      value:
                        patient.allergies?.length > 0
                          ? patient.allergies.join(", ")
                          : "None recorded",
                    },
                  ]}
                />

                {patient.allergies?.length > 0 && (
                  <Banner tone="critical" icon="alertTriangle">
                    Documented allergies: {patient.allergies.join(" · ")}
                  </Banner>
                )}

                <div>
                  <span className="deflist__label">Latest observations</span>
                  <div style={{ marginTop: 6 }}>
                    <VitalsStrip vitals={patient.vitals} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Clinician" />
            <CardBody>
              <Link to={`/doctors/${doctor.id}`} className="col col--gap-xs">
                <span className="t-title-sm t-ink">{doctor.name}</span>
                <span className="t-caption">{doctor.specialisation}</span>
                <span className="t-label t-label--sm">
                  {departmentLabel(doctor.department)}
                </span>
              </Link>
            </CardBody>
            <CardFoot>
              <Link to={`/doctors/${doctor.id}`} className="text-link text-link--sm">
                View profile
                <Icon name="arrowRight" size={13} />
              </Link>
            </CardFoot>
          </Card>

          <Card surface="soft">
            <CardHead title="Status" />
            <CardBody>
              <div className="col col--gap-md">
                <Select
                  label="Set status"
                  options={statusOptions(APPOINTMENT_STATUS_META)}
                  value={appointment.status}
                  onChange={(event) => changeStatus(event.target.value)}
                  disabled={busy}
                  hint="Status changes are recorded in the audit trail."
                />

                <Timeline
                  items={[
                    {
                      id: "booked",
                      title: "Booked",
                      meta: formatDate(appointment.createdAt),
                      tone: "accent",
                    },
                    {
                      id: "scheduled",
                      title: "Scheduled",
                      meta: formatDateTime(appointment.startsAt),
                    },
                    {
                      id: "current",
                      title: optionLabel(
                        statusOptions(APPOINTMENT_STATUS_META),
                        appointment.status,
                      ),
                      meta: "Current",
                      tone:
                        appointment.status === APPOINTMENT_STATUS.COMPLETED
                          ? "success"
                          : appointment.status === APPOINTMENT_STATUS.CANCELLED ||
                              appointment.status === APPOINTMENT_STATUS.NO_SHOW
                            ? "critical"
                            : "accent",
                    },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          {isActive && (
            <Card surface="soft">
              <CardHead title="Actions" />
              <CardBody padding="tight">
                <div className="col col--gap-xs">
                  <Button variant="surface" icon="history" block onClick={() => setRescheduleOpen(true)}>
                    Reschedule
                  </Button>
                  <Button
                    variant="surface"
                    icon="alertCircle"
                    block
                    onClick={() => changeStatus(APPOINTMENT_STATUS.NO_SHOW)}
                    disabled={busy}
                  >
                    Mark as no show
                  </Button>
                  <Button variant="danger" icon="calendarX" block onClick={() => setCancelOpen(true)}>
                    Cancel appointment
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        size="lg"
        title="Reschedule appointment"
        subtitle={`${patient.name} with ${doctor.name} · currently ${formatDateTime(appointment.startsAt)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)} disabled={busy}>
              Keep current time
            </Button>
            <Button
              variant="primary"
              onClick={confirmReschedule}
              loading={busy}
              disabled={!selectedSlot}
            >
              {selectedSlot ? `Move to ${formatTime(selectedSlot)}` : "Select a slot"}
            </Button>
          </>
        }
      >
        <SlotPicker
          days={schedule.days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          selectedSlot={selectedSlot}
          onSelectSlot={(slot) => setSelectedSlot(slot.startsAt)}
        />
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        title="Cancel appointment"
        subtitle={appointment.code}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={busy}>
              Keep appointment
            </Button>
            <Button variant="danger-solid" onClick={confirmCancel} loading={busy}>
              Cancel appointment
            </Button>
          </>
        }
      >
        <div className="col col--gap-md">
          <Banner tone="warning" icon="alertTriangle">
            Cancelling notifies the patient and releases the slot for rebooking.
          </Banner>

          <Select
            label="Reason"
            options={CANCEL_REASONS}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            required
          />

          <Textarea
            label="Note (optional)"
            rows={3}
            placeholder="Anything the patient or care team should know"
            value={cancelNote}
            onChange={(event) => setCancelNote(event.target.value)}
          />
        </div>
      </Modal>

    </div>
  );
}

export default AppointmentDetail;
