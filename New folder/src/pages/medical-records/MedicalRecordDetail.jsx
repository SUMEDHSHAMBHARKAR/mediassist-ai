import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import ReportCard from "../../components/domain/ReportCard";
import StatusBadge from "../../components/domain/StatusBadge";
import VitalsStrip from "../../components/domain/VitalsStrip";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import { EmptyState, ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { departmentLabel } from "../../constants/departments";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import {
  medicalRecordsService,
  prescriptionsService,
  reportsService,
} from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { calculateAge, formatDate, formatDateTime, orDash } from "../../utils/format";
import RecordFormModal from "./RecordFormModal";

/**
 * MedicalRecordDetail — one encounter in full.
 *
 * The narrative (complaint, diagnosis, treatment, notes) is the primary column;
 * observations, attachments and linked prescriptions sit in the rail.
 */
function MedicalRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      medicalRecordsService.getById(id).then((record) =>
        Promise.all([
          patientsService.getById(record.patientId),
          doctorsService.getById(record.doctorId),
          reportsService.listByPatient(record.patientId),
          prescriptionsService.listByPatient(record.patientId),
          patientsService.list(),
          doctorsService.list(),
        ]).then(([patient, doctor, reports, prescriptions, patients, doctors]) => ({
          record,
          patient,
          doctor,
          reports: reports.filter((report) => report.recordId === record.id),
          prescriptions: prescriptions.filter(
            (prescription) => prescription.recordId === record.id,
          ),
          patients,
          doctors,
        })),
      ),
    [id],
  );

  useDocumentTitle(data?.record ? data.record.diagnosis : "Medical record");

  if (loading) {
    return (
      <div className="page">
        <Skeleton variant="block" height={180} />
        <div style={{ marginTop: "var(--s-lg)" }}>
          <LoadingState label="Loading record" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: "Medical records", to: "/medical-records" },
            { label: "Not found" },
          ]}
        />
        <ErrorState title="Record unavailable" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { record, patient, doctor, reports, prescriptions } = data;
  const age = calculateAge(patient.dob);
  const canEdit = role !== ROLES.PATIENT;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await medicalRecordsService.remove(record.id);
      navigate("/medical-records", { replace: true });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: "Medical records", to: "/medical-records" },
          { label: formatDate(record.visitDate) },
        ]}
      />

      <RecordHeader
        eyebrow={`Encounter · ${formatDate(record.visitDate)}`}
        name={record.diagnosis}
        square
        badges={
          <>
            <StatusBadge kind="severity" value={record.severity} size="lg" />
            {record.icdCode && <Badge tone="outline">{record.icdCode}</Badge>}
            {record.attachmentCount > 0 && (
              <Badge tone="muted" icon="paperclip">
                {record.attachmentCount} attachment
                {record.attachmentCount === 1 ? "" : "s"}
              </Badge>
            )}
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "patients", text: patient.name },
              { icon: "doctors", text: doctor.name },
              { icon: "department", text: departmentLabel(doctor.department) },
            ]}
          />
        }
        actions={
          canEdit ? (
            <>
              <Button variant="outline" icon="print">
                Print
              </Button>
              <Button
                variant="outline"
                icon="ai"
                to={`/ai?recordId=${record.id}&patientId=${patient.id}`}
              >
                Summarise
              </Button>
              <Button variant="primary" icon="edit" onClick={() => setEditOpen(true)}>
                Amend
              </Button>
              <Button
                variant="danger"
                icon="trash"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete record"
              />
            </>
          ) : (
            <Button variant="outline" icon="print">
              Print
            </Button>
          )
        }
        facts={[
          { label: "Patient", value: `${patient.name} · ${patient.mrn}` },
          { label: "Age at visit", value: age !== null ? `${age} years` : "—" },
          { label: "Clinician", value: doctor.name },
          {
            label: "Follow-up",
            value: record.followUpDate ? formatDate(record.followUpDate) : "None",
          },
          { label: "Recorded", value: formatDateTime(record.visitDate) },
        ]}
      />

      {patient.allergies?.length > 0 && (
        <Banner tone="critical" title="Documented allergies" icon="alertTriangle" className="stack">
          {patient.allergies.join(" · ")}
        </Banner>
      )}

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Clinical narrative" />
            <CardBody>
              <div className="col col--gap-lg">
                <section>
                  <span className="deflist__label">Presenting complaint</span>
                  <p className="t-body" style={{ marginTop: 4 }}>
                    {orDash(record.chiefComplaint)}
                  </p>
                </section>

                <div className="card__divider" />

                <section>
                  <span className="deflist__label">Diagnosis</span>
                  <p className="t-title-sm" style={{ marginTop: 4 }}>
                    {record.diagnosis}
                  </p>
                  {record.icdCode && (
                    <p className="t-mono t-muted" style={{ marginTop: 4 }}>
                      {record.icdCode}
                    </p>
                  )}
                </section>

                <div className="card__divider" />

                <section>
                  <span className="deflist__label">Treatment and plan</span>
                  <p className="t-body" style={{ marginTop: 4 }}>
                    {orDash(record.treatment)}
                  </p>
                </section>

                <div className="card__divider" />

                <section>
                  <span className="deflist__label">Clinical notes</span>
                  <p className="t-body" style={{ marginTop: 4 }}>
                    {orDash(record.notes)}
                  </p>
                </section>
              </div>
            </CardBody>
            <CardFoot>
              <span className="t-caption row row--tight">
                <Icon name="shieldCheck" size={13} />
                Recorded by {doctor.name} on {formatDate(record.visitDate)}
              </span>
            </CardFoot>
          </Card>

          <Card surface="soft">
            <CardHead
              title="Linked reports"
              subtitle={`${reports.length} attached to this encounter`}
            />
            <CardBody>
              {reports.length === 0 ? (
                <EmptyState
                  size="inline"
                  icon="reports"
                  title="No linked reports"
                  message="Reports uploaded against this encounter appear here."
                />
              ) : (
                <div className="grid grid--tight" style={{ gridTemplateColumns: "1fr" }}>
                  {reports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Observations at visit" />
            <CardBody padding="tight">
              <VitalsStrip vitals={record.vitals} showRecordedAt={false} />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead
              title="Patient"
              actions={
                <Button size="sm" variant="ghost" to={`/patients/${patient.id}`} iconEnd="arrowRight">
                  Record
                </Button>
              }
            />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Name", value: patient.name },
                  { label: "MRN", value: patient.mrn },
                  { label: "Blood group", value: orDash(patient.bloodGroup) },
                  {
                    label: "Conditions",
                    value:
                      patient.conditions?.length > 0
                        ? patient.conditions.join(", ")
                        : "None recorded",
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Prescriptions from this visit" />
            <CardBody padding="none">
              {prescriptions.length === 0 ? (
                <EmptyState
                  size="inline"
                  icon="prescriptions"
                  title="None issued"
                  message="No prescription was written at this encounter."
                />
              ) : (
                <div className="list">
                  {prescriptions.map((prescription) => (
                    <Link
                      key={prescription.id}
                      to={`/prescriptions/${prescription.id}`}
                      className="list__row list__row--link"
                    >
                      <div className="grow col col--gap-xxs">
                        <span className="t-data t-ink t-tabular">{prescription.code}</span>
                        <span className="t-caption">
                          {prescription.items.length} medication
                          {prescription.items.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <StatusBadge kind="prescription" value={prescription.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
            {canEdit && (
              <CardFoot>
                <Link
                  to={`/prescriptions/new?patientId=${patient.id}&recordId=${record.id}`}
                  className="text-link text-link--sm"
                >
                  Write prescription
                  <Icon name="arrowRight" size={13} />
                </Link>
              </CardFoot>
            )}
          </Card>
        </div>
      </div>

      {editOpen && (
        <RecordFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          record={record}
          patients={data.patients}
          doctors={data.doctors}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete medical record"
        message={`Delete the encounter dated ${formatDate(record.visitDate)}?`}
        detail="Deleting a clinical record is irreversible and is recorded in the audit trail. Prefer an amendment if the record is inaccurate."
        confirmLabel="Delete record"
      />
    </div>
  );
}

export default MedicalRecordDetail;
