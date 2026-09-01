import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AppointmentRow } from "../../components/domain/AppointmentCard";
import InvoiceCard from "../../components/domain/InvoiceCard";
import PrescriptionCard from "../../components/domain/PrescriptionCard";
import RecordCard from "../../components/domain/RecordCard";
import RecordHeader from "../../components/domain/RecordHeader";
import ReportCard from "../../components/domain/ReportCard";
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
  humanize,
} from "../../utils/format";
import PatientFormModal from "./PatientFormModal";

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
        medicalRecordsService.listByPatient(id).catch(() => []),
        reportsService.listByPatient(id).catch(() => []),
        prescriptionsService.listByPatient(id).catch(() => []),
        billingService.listByPatient(id).catch(() => []),
        appointmentsService.listForPatient(id).catch(() => []),
        doctorsService.list().catch(() => []),
      ]).then(
        ([patient, rawRecords, rawReports, rawPrescriptions, rawInvoices, rawAppointments, rawDoctors]) => {
          const records = Array.isArray(rawRecords) ? rawRecords : rawRecords?.items || [];
          const reports = Array.isArray(rawReports) ? rawReports : rawReports?.items || [];
          const prescriptions = Array.isArray(rawPrescriptions) ? rawPrescriptions : rawPrescriptions?.items || [];
          const invoices = Array.isArray(rawInvoices) ? rawInvoices : rawInvoices?.items || [];
          const appointments = Array.isArray(rawAppointments) ? rawAppointments : rawAppointments?.items || [];
          const doctors = Array.isArray(rawDoctors) ? rawDoctors : rawDoctors?.items || [];

          return {
            patient,
            records,
            reports,
            prescriptions,
            invoices,
            appointments,
            doctors,
            doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
          };
        },
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

  const age = calculateAge(patient.date_of_birth || patient.dob);

  const upcoming = appointments
    .filter((appointment) => isFuture(appointment.appointment_date || appointment.startsAt))
    .sort((a, b) => new Date(a.appointment_date || a.startsAt) - new Date(b.appointment_date || b.startsAt));
  const past = appointments
    .filter((appointment) => !isFuture(appointment.appointment_date || appointment.startsAt))
    .sort((a, b) => new Date(b.appointment_date || b.startsAt) - new Date(a.appointment_date || a.startsAt));

  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Math.max(0, (invoice.amount || invoice.total || 0) - (invoice.amountPaid || 0)),
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
        eyebrow={`ID #${patient.id}`}
        name={patient.name}
        meta={
          <MetaRow
            items={[
              { icon: "cake", text: `${age ?? "—"} years · ${humanize(patient.gender || "")}` },
              { icon: "phone", text: patient.mobile_no || "—" },
              { icon: "mapPin", text: patient.address || "—" },
            ]}
          />
        }
        actions={
          <>
            <Button variant="outline" icon="calendarPlus" to={`/appointments/book?patientId=${patient.id}`}>
              Book
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
          { label: "Patient ID", value: `#${patient.id}` },
          { label: "User ID", value: `#${patient.user_id}` },
          { label: "Date of Birth", value: formatDate(patient.date_of_birth) },
          { label: "Outstanding", value: formatCurrency(outstanding) },
        ]}
      />

      <Tabs items={tabs} value={tab} onChange={setTab} className="stack" />

      <div style={{ marginTop: "var(--s-lg)" }}>
        {tab === "overview" && (
          <div className="col col--gap-lg">
            <div className="grid grid--split">
              <div className="col col--gap-lg">
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
                          title: record.diagnosis || "Medical Record",
                          meta: formatDate(record.record_date || record.visitDate),
                          body: record.treatment_plan || record.treatment || record.notes,
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
                        { label: "Patient ID", value: `#${patient.id}` },
                        { label: "Date of birth", value: formatDate(patient.date_of_birth) },
                        { label: "Phone", value: patient.mobile_no },
                        { label: "Gender", value: patient.gender },
                        { label: "Address", value: patient.address },
                      ]}
                    />
                  </CardBody>
                </Card>
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
                  doctor={doctorsById.get(record.doctor_id || record.doctorId)}
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
                  doctor={doctorsById.get(prescription.doctor_id || prescription.doctorId)}
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
                        doctor={doctorsById.get(appointment.doctor_id || appointment.doctorId)}
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
                        doctor={doctorsById.get(appointment.doctor_id || appointment.doctorId)}
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
          onSaved={() => reload()}
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
