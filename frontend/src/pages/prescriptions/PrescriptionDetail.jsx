import { Link, useParams } from "react";

import RecordHeader from "../../components/domain/RecordHeader";
import StatusBadge from "../../components/domain/StatusBadge";
import Badge from "../../components/ui/Badge";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import { ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { prescriptionsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { calculateAge, formatDate } from "../../utils/format";

function PrescriptionDetail() {
  const { id } = useParams();
  const { role } = useAuth();

  const { data, loading, error, reload } = useAsyncData(
    () =>
      prescriptionsService.getById(id).then((prescription) => {
        const pId = prescription.patient_id || prescription.patientId;
        const dId = prescription.doctor_id || prescription.doctorId;
        return Promise.all([
          patientsService.getById(pId),
          doctorsService.getById(dId),
        ]).then(([patient, doctor]) => ({
          prescription,
          patient,
          doctor,
        }));
      }),
    [id],
  );

  useDocumentTitle(data?.prescription ? `Prescription #${data.prescription.id}` : "Prescription");

  if (loading) {
    return (
      <div className="page">
        <Skeleton variant="block" height={180} />
        <div style={{ marginTop: "var(--s-lg)" }}>
          <LoadingState label="Loading prescription" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Breadcrumb
          items={[{ label: "Prescriptions", to: "/prescriptions" }, { label: "Not found" }]}
        />
        <ErrorState title="Prescription unavailable" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { prescription, patient, doctor } = data;
  const items = prescription.prescription_items || prescription.items || [];
  const rxDate = prescription.prescription_date || prescription.created_at || prescription.issuedAt;
  const age = calculateAge(patient.date_of_birth || patient.dob);

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: "Prescriptions", to: "/prescriptions" },
          { label: `Ref #${prescription.id}` },
        ]}
      />

      <RecordHeader
        eyebrow="Prescription"
        name={`Ref #${prescription.id}`}
        square
        badges={
          <>
            <StatusBadge kind="prescription" value={prescription.status || "active"} size="lg" />
            <Badge tone="outline">
              {items.length} medication{items.length === 1 ? "" : "s"}
            </Badge>
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "patients", text: patient.name },
              { icon: "doctors", text: doctor.name },
              { icon: "clock", text: `Issued ${formatDate(rxDate)}` },
            ]}
          />
        }
        actions={
          role !== ROLES.PATIENT && (
            <Button
              variant="primary"
              icon="plus"
              to={`/prescriptions/new?patientId=${patient.id}`}
            >
              New prescription
            </Button>
          )
        }
        facts={[
          { label: "Patient", value: patient.name },
          { label: "Patient Mobile", value: patient.mobile_no },
          { label: "Age", value: age !== null ? `${age} years` : "—" },
          { label: "Prescriber", value: doctor.name },
          { label: "Diagnosis", value: prescription.diagnosis },
          { label: "Issued Date", value: formatDate(rxDate) },
        ]}
      />

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead
              title="Prescribed Medications"
              subtitle={`${items.length} item${items.length === 1 ? "" : "s"}`}
            />
            <CardBody>
              <div className="list">
                {items.map((item, index) => (
                  <div key={item.id || index} className="list__row col col--gap-xxs">
                    <div className="row row--between">
                      <span className="t-data t-ink t-strong">
                        {item.medicine_name || item.name}
                      </span>
                      <span className="t-label t-label--sm">
                        {item.dosage}
                      </span>
                    </div>
                    <div className="row row--between t-caption t-muted">
                      <span>Frequency: {item.frequency}</span>
                      <span>Duration: {item.duration || `${item.durationDays || 30} days`}</span>
                    </div>
                    {item.notes && (
                      <span className="t-caption t-ink" style={{ marginTop: 2 }}>
                        Instructions: {item.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
            <CardFoot>
              <span className="t-caption row row--tight">
                <Icon name="shieldCheck" size={13} />
                Prescribed by {doctor.name} ({doctor.qualification || "MD"})
              </span>
            </CardFoot>
          </Card>

          {prescription.instructions && (
            <Card surface="soft">
              <CardHead title="Instructions & Notes" />
              <CardBody>
                <p className="t-body">{prescription.instructions}</p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Patient Information" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Name", value: patient.name },
                  { label: "Phone", value: patient.mobile_no },
                  { label: "Gender", value: patient.gender },
                  { label: "Address", value: patient.address },
                ]}
              />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Prescriber" />
            <CardBody>
              <Link to={`/doctors/${doctor.id}`} className="col col--gap-xs">
                <span className="t-title-sm t-ink">{doctor.name}</span>
                <span className="t-caption">{doctor.qualification || "Specialist"}</span>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionDetail;
