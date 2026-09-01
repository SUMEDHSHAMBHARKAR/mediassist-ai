import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import { ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import {
  medicalRecordsService,
} from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { calculateAge, formatDate, orDash } from "../../utils/format";
import RecordFormModal from "./RecordFormModal";

function MedicalRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      medicalRecordsService.getById(id).then((record) => {
        const pId = record.patient_id || record.patientId;
        const dId = record.doctor_id || record.doctorId;
        return Promise.all([
          patientsService.getById(pId),
          doctorsService.getById(dId),
          patientsService.list().catch(() => []),
          doctorsService.list().catch(() => []),
        ]).then(([patient, doctor, rawPatients, rawDoctors]) => {
          const patientList = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
          const doctorList = Array.isArray(rawDoctors?.items) ? rawDoctors.items : Array.isArray(rawDoctors) ? rawDoctors : [];

          return {
            record,
            patient,
            doctor,
            patients: patientList,
            doctors: doctorList,
          };
        });
      }),
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

  const { record, patient, doctor } = data;
  const visitDate = record.visit_date || record.visitDate;
  const age = calculateAge(patient.date_of_birth || patient.dob);
  const canEdit = role !== ROLES.PATIENT;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await medicalRecordsService.remove(record.id);
      navigate("/medical-records", { replace: true });
    } catch (err) {
      alert(err?.message || "Could not delete record.");
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
          { label: formatDate(visitDate) },
        ]}
      />

      <RecordHeader
        eyebrow={`Encounter · ${formatDate(visitDate)}`}
        name={record.diagnosis}
        square
        meta={
          <MetaRow
            items={[
              { icon: "patients", text: patient.name },
              { icon: "doctors", text: doctor.name },
            ]}
          />
        }
        actions={
          canEdit && (
            <>
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
          )
        }
        facts={[
          { label: "Patient", value: patient.name },
          { label: "Patient Phone", value: patient.mobile_no },
          { label: "Age at visit", value: age !== null ? `${age} years` : "—" },
          { label: "Clinician", value: doctor.name },
          { label: "Encounter Date", value: formatDate(visitDate) },
        ]}
      />

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Clinical narrative" />
            <CardBody>
              <div className="col col--gap-lg">
                <section>
                  <span className="deflist__label">Presenting complaint</span>
                  <p className="t-body" style={{ marginTop: 4 }}>
                    {orDash(record.chief_complaint || record.chiefComplaint)}
                  </p>
                </section>

                <div className="card__divider" />

                <section>
                  <span className="deflist__label">Diagnosis</span>
                  <p className="t-title-sm" style={{ marginTop: 4 }}>
                    {record.diagnosis}
                  </p>
                </section>

                <div className="card__divider" />

                <section>
                  <span className="deflist__label">Treatment and plan</span>
                  <p className="t-body" style={{ marginTop: 4 }}>
                    {orDash(record.treatment)}
                  </p>
                </section>

                {record.notes && (
                  <>
                    <div className="card__divider" />
                    <section>
                      <span className="deflist__label">Clinical notes</span>
                      <p className="t-body" style={{ marginTop: 4 }}>
                        {record.notes}
                      </p>
                    </section>
                  </>
                )}
              </div>
            </CardBody>
            <CardFoot>
              <span className="t-caption row row--tight">
                <Icon name="shieldCheck" size={13} />
                Recorded by {doctor.name} on {formatDate(visitDate)}
              </span>
            </CardFoot>
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Patient Information" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Name", value: patient.name },
                  { label: "Mobile", value: patient.mobile_no },
                  { label: "Gender", value: patient.gender },
                  { label: "Address", value: patient.address },
                ]}
              />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Clinician Information" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Doctor Name", value: doctor.name },
                  { label: "Qualifications", value: doctor.qualification || "MD" },
                  { label: "Room", value: doctor.room_number ? `Room ${doctor.room_number}` : "Main Clinic" },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      {editOpen && (
        <RecordFormModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            reload();
          }}
          record={record}
          patients={data.patients}
          doctors={data.doctors}
          onSaved={() => reload()}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete medical record"
        message={`Delete the encounter dated ${formatDate(visitDate)}?`}
        detail="Deleting a clinical record is irreversible."
        confirmLabel="Delete record"
      />
    </div>
  );
}

export default MedicalRecordDetail;
