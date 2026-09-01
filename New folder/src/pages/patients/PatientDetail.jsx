import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AppointmentRow } from "../../components/domain/AppointmentCard";
import InvoiceCard from "../../components/domain/InvoiceCard";
import PrescriptionCard from "../../components/domain/PrescriptionCard";
import RecordCard from "../../components/domain/RecordCard";
import RecordHeader from "../../components/domain/RecordHeader";
import ReportCard from "../../components/domain/ReportCard";
import StatusBadge from "../../components/domain/StatusBadge";
import VitalsStrip from "../../components/domain/VitalsStrip";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Dropdown, { DropdownItem, DropdownSeparator } from "../../components/ui/Dropdown";
import Icon from "../../components/ui/Icon";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Tabs from "../../components/ui/Tabs";
import Timeline from "../../components/ui/Timeline";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
} from "../../components/ui/States";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import billingService from "../../services/billingService";
import {
  medicalRecordsService,
  prescriptionsService,
  reportsService,
} from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { isFuture } from "../../utils/collection";
import {
  calculateAge,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelative,
  humanize,
  orDash,
} from "../../utils/format";
import PatientFormModal from "./PatientFormModal";

/**
 * PatientDetail — the full patient record.
 *
 * Six tabs over one shared header. Each tab renders from data already loaded, so
 * switching tabs never re-fetches or flashes a spinner.
 */
function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const tab = params.get("tab") || "overview";
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        patientsService.getById(id),
        medicalRecordsService.listByPatient(id),
        reportsService.listByPatient(id),
        prescriptionsService.listByPatient(id),
        billingService.listByPatient(id),
        appointmentsService.listForPatient(id),
        doctorsService.list(),
      ]).then(
        ([patient, records, reports, prescriptions, invoices, appointments, doctors]) => ({
          patient,
          records,
          reports,
          prescriptions,
          invoices,
          appointments,
          doctors,
          doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
        }),
      ),
    [id],
  );

  useDocumentTitle(data?.patient ? data.patient.name : "Patient record");

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
          <LoadingState label="Loading patient record" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Breadcrumb
          items={[{ label: "Patients", to: "/patients" }, { label: "Not found" }]}
        />
        <ErrorState
          title="Record unavailable"
          message={error.message}
          onRetry={reload}
        />
      </div>
    );
  }

  const {
    patient,
    records,
    reports,
    prescriptions,
    invoices,
    appointments,
    doctorsById,
  } = data;

  const age = calculateAge(patient.dob);
  const primary = doctorsById.get(patient.primaryDoctorId);

  const upcoming = appointments
    .filter((appointment) => isFuture(appointment.startsAt))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const past = appointments
    .filter((appointment) => !isFuture(appointment.startsAt))
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));

  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.total - invoice.amountPaid),
    0,
  );

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "records", label: "History", count: records.length },
    { value: "reports", label: "Reports", count: reports.length },
    { value: "prescriptions", label: "Prescriptions", count: prescriptions.length },
    { value: "appointments", label: "Appointments", count: appointments.length },
    { value: "billing", label: "Billing", count: invoices.length },
  ];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await patientsService.remove(patient.id);
      navigate("/patients", { replace: true });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: "Patients", to: "/patients" },
          { label: patient.name },
        ]}
      />

      <RecordHeader
        eyebrow={patient.mrn}
        name={patient.name}
        badges={
          <>
            <StatusBadge kind="patient" value={patient.status} />
            <StatusBadge kind="severity" value={patient.riskLevel} />
            {patient.allergies?.length > 0 && (
              <Badge tone="critical" icon="alertTriangle">
                {patient.allergies.length} allerg
                {patient.allergies.length === 1 ? "y" : "ies"}
              </Badge>
            )}
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "cake", text: `${age ?? "—"} years · ${humanize(patient.gender)}` },
              { icon: "droplet", text: orDash(patient.bloodGroup) },
              { icon: "phone", text: patient.phone },
              { icon: "mapPin", text: patient.city },
            ]}
          />
        }
        actions={
          <>
            <Button variant="outline" icon="calendarPlus" to={`/appointments/book?patientId=${patient.id}`}>
              Book
            </Button>
            <Button variant="outline" icon="ai" to={`/ai?patientId=${patient.id}`}>
              Summarise
            </Button>
            <Button variant="primary" icon="edit" onClick={() => setEditOpen(true)}>
              Edit
            </Button>

            <Dropdown
              trigger={({ toggle }) => (
                <Button variant="ghost" icon="more" onClick={toggle} aria-label="More actions" />
              )}
            >
              {({ close }) => (
                <>
                  <DropdownItem
                    icon="records"
                    onClick={() => {
                      close();
                      navigate(`/medical-records/new?patientId=${patient.id}`);
                    }}
                  >
                    New medical record
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
                  <DropdownItem
                    icon="upload"
                    onClick={() => {
                      close();
                      navigate(`/reports?patientId=${patient.id}&upload=1`);
                    }}
                  >
                    Upload report
                  </DropdownItem>
                  <DropdownItem icon="print" onClick={close}>
                    Print summary
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem
                    icon="trash"
                    danger
                    onClick={() => {
                      close();
                      setDeleteOpen(true);
                    }}
                  >
                    Delete record
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </>
        }
        facts={[
          { label: "Primary clinician", value: primary ? primary.name : "Unassigned" },
          { label: "Last seen", value: formatRelative(patient.lastVisitAt) },
          {
            label: "Next appointment",
            value: patient.nextAppointmentAt
              ? formatDateTime(patient.nextAppointmentAt)
              : "None booked",
          },
          { label: "Outstanding", value: formatCurrency(outstanding) },
          { label: "Registered", value: formatDate(patient.registeredAt) },
        ]}
      />

      {patient.allergies?.length > 0 && (
        <Banner
          tone="critical"
          title="Documented allergies"
          className="stack"
          icon="alertTriangle"
        >
          {patient.allergies.join(" · ")} — check before prescribing or administering.
        </Banner>
      )}

      <Tabs items={tabs} value={tab} onChange={setTab} className="stack" />

      <div style={{ marginTop: "var(--s-lg)" }}>
        {tab === "overview" && (
          <div className="col col--gap-lg">
            <Card surface="soft">
              <CardHead
                title="Latest observations"
                subtitle={
                  patient.vitals?.recordedAt
                    ? `Recorded ${formatRelative(patient.vitals.recordedAt)}`
                    : undefined
                }
              />
              <CardBody padding="tight">
                <VitalsStrip vitals={patient.vitals} showRecordedAt={false} />
              </CardBody>
            </Card>

            <div className="grid grid--split">
              <div className="col col--gap-lg">
                <Card surface="soft">
                  <CardHead title="Clinical summary" />
                  <CardBody>
                    <div className="col col--gap-lg">
                      <div>
                        <span className="deflist__label">Ongoing conditions</span>
                        {patient.conditions?.length > 0 ? (
                          <div className="row row--tight row--wrap" style={{ marginTop: 6 }}>
                            {patient.conditions.map((condition) => (
                              <Badge key={condition} tone="outline" size="lg">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="t-body-sm">No ongoing conditions recorded.</p>
                        )}
                      </div>

                      <div>
                        <span className="deflist__label">Allergies</span>
                        {patient.allergies?.length > 0 ? (
                          <div className="row row--tight row--wrap" style={{ marginTop: 6 }}>
                            {patient.allergies.map((allergy) => (
                              <Badge key={allergy} tone="critical" size="lg" icon="alertTriangle">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="t-body-sm">No known allergies recorded.</p>
                        )}
                      </div>

                      <div className="card__divider" />

                      <DefList
                        items={[
                          { label: "Height", value: `${patient.heightCm} cm` },
                          { label: "Weight", value: `${patient.weightKg} kg` },
                          { label: "BMI", value: patient.vitals?.bmi ?? "—" },
                          { label: "Blood group", value: orDash(patient.bloodGroup) },
                        ]}
                      />
                    </div>
                  </CardBody>
                </Card>

                <Card surface="soft">
                  <CardHead title="Recent history" subtitle={`${records.length} encounters`} />
                  <CardBody>
                    {records.length === 0 ? (
                      <EmptyState
                        size="inline"
                        icon="records"
                        title="No encounters recorded"
                        message="Clinical encounters appear here once documented."
                      />
                    ) : (
                      <Timeline
                        items={records.slice(0, 5).map((record) => ({
                          id: record.id,
                          tone:
                            record.severity === "critical"
                              ? "critical"
                              : record.severity === "urgent"
                                ? "accent"
                                : undefined,
                          title: record.diagnosis,
                          meta: formatDate(record.visitDate),
                          body: record.treatment,
                          footer: (
                            <Link
                              to={`/medical-records/${record.id}`}
                              className="text-link text-link--sm"
                              style={{ marginTop: "var(--s-xs)" }}
                            >
                              Open record
                              <Icon name="arrowRight" size={12} />
                            </Link>
                          ),
                        }))}
                      />
                    )}
                  </CardBody>
                  {records.length > 5 && (
                    <CardFoot>
                      <button
                        type="button"
                        className="text-link text-link--sm"
                        onClick={() => setTab("records")}
                      >
                        View all {records.length} encounters
                        <Icon name="arrowRight" size={13} />
                      </button>
                    </CardFoot>
                  )}
                </Card>
              </div>

              <div className="col col--gap-lg">
                <Card surface="soft">
                  <CardHead title="Contact and identity" />
                  <CardBody>
                    <DefList
                      columns={1}
                      items={[
                        { label: "Medical record no.", value: patient.mrn },
                        { label: "Date of birth", value: formatDate(patient.dob) },
                        { label: "Phone", value: patient.phone },
                        { label: "Email", value: orDash(patient.email) },
                        { label: "Address", value: `${patient.address}, ${patient.city}` },
                      ]}
                    />
                  </CardBody>
                </Card>

                <Card surface="soft">
                  <CardHead title="Next of kin" />
                  <CardBody>
                    {patient.emergencyContact?.name ? (
                      <DefList
                        columns={1}
                        items={[
                          { label: "Name", value: patient.emergencyContact.name },
                          { label: "Relationship", value: patient.emergencyContact.relation },
                          { label: "Phone", value: patient.emergencyContact.phone },
                        ]}
                      />
                    ) : (
                      <p className="t-body-sm">No emergency contact recorded.</p>
                    )}
                  </CardBody>
                </Card>

                <Card surface="soft">
                  <CardHead title="Insurance" />
                  <CardBody>
                    {patient.insuranceProvider && patient.insuranceProvider !== "—" ? (
                      <DefList
                        columns={1}
                        items={[
                          { label: "Provider", value: patient.insuranceProvider },
                          { label: "Policy number", value: orDash(patient.insuranceNumber) },
                        ]}
                      />
                    ) : (
                      <p className="t-body-sm">Self-funded — no policy on record.</p>
                    )}
                  </CardBody>
                </Card>

                {primary && (
                  <Card surface="soft">
                    <CardHead title="Primary clinician" />
                    <CardBody>
                      <Link to={`/doctors/${primary.id}`} className="col col--gap-xs">
                        <span className="t-title-sm t-ink">{primary.name}</span>
                        <span className="t-caption">{primary.specialisation}</span>
                        <span className="text-link text-link--sm" style={{ marginTop: 6 }}>
                          View profile
                          <Icon name="arrowRight" size={12} />
                        </span>
                      </Link>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "records" && (
          <TabSection
            title="Medical history"
            count={records.length}
            action={
              <Button
                variant="primary"
                icon="plus"
                to={`/medical-records/new?patientId=${patient.id}`}
              >
                New record
              </Button>
            }
            isEmpty={records.length === 0}
            empty={{
              icon: "records",
              title: "No medical records",
              message: "Document an encounter to start this patient's history.",
            }}
          >
            <div className="grid grid--2">
              {records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  doctor={doctorsById.get(record.doctorId)}
                  showPatient={false}
                />
              ))}
            </div>
          </TabSection>
        )}

        {tab === "reports" && (
          <TabSection
            title="Reports and files"
            count={reports.length}
            action={
              <Button
                variant="primary"
                icon="upload"
                to={`/reports?patientId=${patient.id}&upload=1`}
              >
                Upload report
              </Button>
            }
            isEmpty={reports.length === 0}
            empty={{
              icon: "reports",
              title: "No reports",
              message: "Laboratory results and imaging appear here once uploaded.",
            }}
          >
            <div className="grid grid--2">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </TabSection>
        )}

        {tab === "prescriptions" && (
          <TabSection
            title="Prescriptions"
            count={prescriptions.length}
            action={
              <Button
                variant="primary"
                icon="plus"
                to={`/prescriptions/new?patientId=${patient.id}`}
              >
                Write prescription
              </Button>
            }
            isEmpty={prescriptions.length === 0}
            empty={{
              icon: "prescriptions",
              title: "No prescriptions",
              message: "Medications prescribed to this patient appear here.",
            }}
          >
            <div className="col col--gap-lg">
              {prescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  doctor={doctorsById.get(prescription.doctorId)}
                />
              ))}
            </div>
          </TabSection>
        )}

        {tab === "appointments" && (
          <div className="col col--gap-lg">
            <Card surface="soft">
              <CardHead
                title="Upcoming"
                subtitle={`${upcoming.length} booked`}
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    icon="calendarPlus"
                    to={`/appointments/book?patientId=${patient.id}`}
                  >
                    Book
                  </Button>
                }
              />
              <CardBody padding="none">
                {upcoming.length === 0 ? (
                  <EmptyState
                    size="compact"
                    icon="appointments"
                    title="Nothing booked"
                    message="This patient has no future appointments."
                    actionLabel="Book appointment"
                    actionIcon="calendarPlus"
                    actionTo={`/appointments/book?patientId=${patient.id}`}
                  />
                ) : (
                  <div className="list">
                    {upcoming.map((appointment) => (
                      <AppointmentRow
                        key={appointment.id}
                        appointment={appointment}
                        patient={patient}
                        doctor={doctorsById.get(appointment.doctorId)}
                        perspective="patient"
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card surface="soft">
              <CardHead title="Past appointments" subtitle={`${past.length} in total`} />
              <CardBody padding="none">
                {past.length === 0 ? (
                  <EmptyState
                    size="compact"
                    icon="history"
                    title="No past appointments"
                    message="Attended and cancelled appointments are listed here."
                  />
                ) : (
                  <div className="list">
                    {past.map((appointment) => (
                      <AppointmentRow
                        key={appointment.id}
                        appointment={appointment}
                        patient={patient}
                        doctor={doctorsById.get(appointment.doctorId)}
                        perspective="patient"
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {tab === "billing" && (
          <TabSection
            title="Billing"
            count={invoices.length}
            meta={`${formatCurrency(outstanding)} outstanding`}
            isEmpty={invoices.length === 0}
            empty={{
              icon: "billing",
              title: "No invoices",
              message: "Invoices raised for this patient appear here.",
            }}
          >
            <div className="grid grid--2">
              {invoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          </TabSection>
        )}
      </div>

      {editOpen && (
        <PatientFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          patient={patient}
          doctors={data.doctors}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete patient record"
        message={`Delete the record for ${patient.name}?`}
        detail="This removes the patient from the directory. Clinical records, reports and invoices linked to this patient are retained for audit purposes."
        confirmLabel="Delete record"
      />
    </div>
  );
}

/** Small local wrapper so each tab's header and empty state stay consistent. */
function TabSection({ title, count, meta, action, isEmpty, empty, children }) {
  return (
    <section>
      <div className="section__head">
        <div className="section__title">
          <span className="stripe--mark" aria-hidden="true" />
          <h2 className="t-title-lg">{title}</h2>
          <span className="t-caption">{meta || `${count} total`}</span>
        </div>
        {action}
      </div>

      {isEmpty ? (
        <Card surface="soft">
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            message={empty.message}
            size="compact"
          />
        </Card>
      ) : (
        children
      )}
    </section>
  );
}

export default PatientDetail;
