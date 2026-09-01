import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import StatusBadge from "../../components/domain/StatusBadge";
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
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { calculateAge, formatDate, formatCurrency } from "../../utils/format";

const CANCEL_REASONS = [
  { value: "patient_request", label: "Patient request" },
  { value: "clinician_unavailable", label: "Clinician unavailable" },
  { value: "clinical_reason", label: "Clinical reason" },
  { value: "duplicate", label: "Duplicate booking" },
  { value: "other", label: "Other" },
];

function AppointmentDetail() {
  const { id } = useParams();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const [cancelReason, setCancelReason] = useState("patient_request");
  const [cancelNote, setCancelNote] = useState("");

  const { data, loading, error, reload, setData } = useAsyncData(
    () =>
      appointmentsService.getById(id).then((appointment) => {
        const pId = appointment.patient_id || appointment.patientId;
        const dId = appointment.doctor_id || appointment.doctorId;
        return Promise.all([
          patientsService.getById(pId),
          doctorsService.getById(dId),
        ]).then(([patient, doctor]) => ({
          appointment,
          patient,
          doctor,
        }));
      }),
    [id],
  );

  useDocumentTitle(data?.appointment ? `Appointment #${data.appointment.id}` : "Appointment");

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

  const { appointment, patient, doctor } = data;
  const isCancelled = (appointment.status || "").toLowerCase() === "cancelled";
  const age = calculateAge(patient.date_of_birth || patient.dob);

  const patch = (changes, message) => {
    setData({ ...data, appointment: { ...appointment, ...changes } });
    setNotice(message);
  };

  const _changeStatus = async (newStatus) => {
    setBusy(true);
    try {
      await appointmentsService.setStatus(appointment.id, newStatus);
      patch({ status: newStatus }, `Status updated to ${newStatus}.`);
    } catch (err) {
      alert(err?.message || "Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async () => {
    setBusy(true);
    try {
      await appointmentsService.cancel(appointment.id);
      patch({ status: "Cancelled" }, "Appointment cancelled successfully.");
      setCancelOpen(false);
    } catch (err) {
      alert(err?.message || "Could not cancel appointment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: "Appointments", to: "/appointments" },
          { label: `Appointment #${appointment.id}` },
        ]}
      />

      <RecordHeader
        eyebrow={`#${appointment.id}`}
        name={patient.name}
        badges={
          <>
            <StatusBadge kind="appointment" value={appointment.status || "Scheduled"} />
            <Badge tone="outline">{appointment.appointment_type || "General"}</Badge>
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "appointments", text: `${formatDate(appointment.appointment_date)} at ${appointment.appointment_time || "09:00:00"}` },
              { icon: "doctors", text: doctor.name },
            ]}
          />
        }
        actions={
          !isCancelled ? (
            <>
              <Button variant="danger" icon="calendarX" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              icon="calendarPlus"
              to={`/appointments/book?patientId=${patient.id}&doctorId=${doctor.id}`}
            >
              Book new
            </Button>
          )
        }
        facts={[
          { label: "Appointment ID", value: `#${appointment.id}` },
          { label: "Date", value: formatDate(appointment.appointment_date) },
          { label: "Time", value: appointment.appointment_time || "09:00:00" },
          { label: "Patient Age", value: age !== null ? `${age} years` : "—" },
        ]}
      />

      {notice && (
        <Banner
          tone="success"
          title="Status Updated"
          className="stack"
          onDismiss={() => setNotice(null)}
        >
          {notice}
        </Banner>
      )}

      {isCancelled && (
        <Banner tone="critical" title="This appointment was cancelled" className="stack">
          Book a replacement if the patient still needs to be seen.
        </Banner>
      )}

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Consultation Details" />
            <CardBody>
              <div className="col col--gap-lg">
                <div>
                  <span className="deflist__label">Reason for visit</span>
                  <p className="t-body" style={{ marginTop: 4 }}>
                    {appointment.reason}
                  </p>
                </div>

                <div className="card__divider" />

                <DefList
                  items={[
                    { label: "Type", value: appointment.appointment_type || "General" },
                    { label: "Date", value: formatDate(appointment.appointment_date) },
                    { label: "Time", value: appointment.appointment_time || "09:00:00" },
                    { label: "Status", value: appointment.status || "Scheduled" },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead
              title="Patient Information"
              actions={
                <Button size="sm" variant="ghost" to={`/patients/${patient.id}`} iconEnd="arrowRight">
                  Full record
                </Button>
              }
            />
            <CardBody>
              <DefList
                items={[
                  { label: "Name", value: patient.name },
                  { label: "Phone", value: patient.mobile_no },
                  { label: "Gender", value: patient.gender },
                  { label: "Age", value: age !== null ? `${age} years` : "—" },
                  { label: "Address", value: patient.address },
                ]}
              />
            </CardBody>
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Clinician Information" />
            <CardBody>
              <Link to={`/doctors/${doctor.id}`} className="col col--gap-xs">
                <span className="t-title-sm t-ink">{doctor.name}</span>
                <span className="t-caption">{doctor.qualification || "Specialist"}</span>
                <span className="t-caption">Fee: {formatCurrency(doctor.consultation_fee || 0)}</span>
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
            <CardHead title="Appointment Timeline" />
            <CardBody>
              <Timeline
                items={[
                  {
                    id: "created",
                    title: "Appointment Booked",
                    meta: formatDate(appointment.appointment_date),
                    tone: "accent",
                  },
                  {
                    id: "status",
                    title: `Status: ${appointment.status || "Scheduled"}`,
                    meta: "Current",
                    tone: isCancelled ? "critical" : "success",
                  },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        title="Cancel appointment"
        subtitle={`ID #${appointment.id}`}
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
            Cancelling will mark this appointment as cancelled.
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
            placeholder="Reason for cancellation"
            value={cancelNote}
            onChange={(event) => setCancelNote(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

export default AppointmentDetail;
