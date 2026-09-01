import { Link, useParams } from "react-router-dom";

import { RxItem } from "../../components/domain/PrescriptionCard";
import RecordHeader from "../../components/domain/RecordHeader";
import StatusBadge from "../../components/domain/StatusBadge";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import { ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { departmentLabel } from "../../constants/departments";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { medicalRecordsService, prescriptionsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { calculateAge, formatDate, formatDateTime, orDash } from "../../utils/format";

/** PrescriptionDetail — one prescription, printable, with its medication list. */
function PrescriptionDetail() {
  const { id } = useParams();
  const { role } = useAuth();

  const { data, loading, error, reload } = useAsyncData(
    () =>
      prescriptionsService.getById(id).then((prescription) =>
        Promise.all([
          patientsService.getById(prescription.patientId),
          doctorsService.getById(prescription.doctorId),
          prescription.recordId
            ? medicalRecordsService.getById(prescription.recordId).catch(() => null)
            : Promise.resolve(null),
        ]).then(([patient, doctor, record]) => ({
          prescription,
          patient,
          doctor,
          record,
        })),
      ),
    [id],
  );

  useDocumentTitle(data?.prescription ? data.prescription.code : "Prescription");

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

  const { prescription, patient, doctor, record } = data;
  const age = calculateAge(patient.dob);
  const expired = new Date(prescription.validUntil) < new Date();

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: "Prescriptions", to: "/prescriptions" },
          { label: prescription.code },
        ]}
      />

      <RecordHeader
        eyebrow="Prescription"
        name={prescription.code}
        square
        badges={
          <>
            <StatusBadge kind="prescription" value={prescription.status} size="lg" />
            <Badge tone="outline">
              {prescription.items.length} medication
              {prescription.items.length === 1 ? "" : "s"}
            </Badge>
            {expired && <Badge tone="warning">Validity expired</Badge>}
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "patients", text: patient.name },
              { icon: "doctors", text: doctor.name },
              { icon: "clock", text: `Issued ${formatDate(prescription.issuedAt)}` },
            ]}
          />
        }
        actions={
          <>
            <Button variant="outline" icon="print">
              Print
            </Button>
            <Button variant="outline" icon="download">
              Download PDF
            </Button>
            {role !== ROLES.PATIENT && (
              <Button
                variant="primary"
                icon="plus"
                to={`/prescriptions/new?patientId=${patient.id}`}
              >
                New prescription
              </Button>
            )}
          </>
        }
        facts={[
          { label: "Patient", value: `${patient.name} · ${patient.mrn}` },
          { label: "Age", value: age !== null ? `${age} years` : "—" },
          { label: "Prescriber", value: doctor.name },
          { label: "Issued", value: formatDateTime(prescription.issuedAt) },
          { label: "Valid until", value: formatDate(prescription.validUntil) },
        ]}
      />

      {patient.allergies?.length > 0 && (
        <Banner tone="critical" title="Documented allergies" icon="alertTriangle" className="stack">
          {patient.allergies.join(" · ")} — verify against every medication below.
        </Banner>
      )}

      {expired && prescription.status === "active" && (
        <Banner tone="warning" title="Validity has lapsed" className="stack">
          This prescription is still marked active but passed its valid-until date on{" "}
          {formatDate(prescription.validUntil)}. Reissue if the patient needs a
          further supply.
        </Banner>
      )}

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead
              title="Medications"
              subtitle={`${prescription.items.length} prescribed`}
            />
            <CardBody>
              <ul className="col col--gap-md">
                {prescription.items.map((item, index) => (
                  <RxItem key={item.id} item={item} index={index} />
                ))}
              </ul>
            </CardBody>
            <CardFoot>
              <span className="t-caption row row--tight">
                <Icon name="shieldCheck" size={13} />
                Prescribed by {doctor.name} · {doctor.qualifications}
              </span>
            </CardFoot>
          </Card>

          {prescription.notes && (
            <Card surface="soft">
              <CardHead title="Prescriber note" />
              <CardBody>
                <p className="t-body">{prescription.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="col col--gap-lg">
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
                  { label: "Age", value: age !== null ? `${age} years` : "—" },
                  { label: "Weight", value: `${patient.weightKg} kg` },
                  {
                    label: "Allergies",
                    value:
                      patient.allergies?.length > 0
                        ? patient.allergies.join(", ")
                        : "None recorded",
                  },
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
            <CardHead title="Prescriber" />
            <CardBody>
              <Link to={`/doctors/${doctor.id}`} className="col col--gap-xs">
                <span className="t-title-sm t-ink">{doctor.name}</span>
                <span className="t-caption">{doctor.specialisation}</span>
                <span className="t-label t-label--sm">
                  {departmentLabel(doctor.department)}
                </span>
                <span className="text-link text-link--sm" style={{ marginTop: 6 }}>
                  View profile
                  <Icon name="arrowRight" size={12} />
                </span>
              </Link>
            </CardBody>
          </Card>

          {record && (
            <Card surface="soft">
              <CardHead title="Linked encounter" />
              <CardBody>
                <Link to={`/medical-records/${record.id}`} className="col col--gap-xs">
                  <span className="t-data t-ink">{record.diagnosis}</span>
                  <span className="t-caption">{formatDate(record.visitDate)}</span>
                  <span className="text-link text-link--sm" style={{ marginTop: 6 }}>
                    Open record
                    <Icon name="arrowRight" size={12} />
                  </span>
                </Link>
              </CardBody>
            </Card>
          )}

          <Card surface="soft">
            <CardHead title="Validity" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Issued", value: formatDateTime(prescription.issuedAt) },
                  { label: "Valid until", value: formatDate(prescription.validUntil) },
                  { label: "Reference", value: prescription.code },
                  { label: "Linked record", value: orDash(prescription.recordId) },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionDetail;
