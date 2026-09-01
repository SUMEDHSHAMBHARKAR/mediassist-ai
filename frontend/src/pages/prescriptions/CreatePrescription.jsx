import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { RxItem } from "../../components/domain/PrescriptionCard";
import { Identity } from "../../components/ui/Avatar";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import IconButton from "../../components/ui/IconButton";
import Input from "../../components/ui/Input";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { ErrorState, LoadingState } from "../../components/ui/States";
import {
  DOSAGE_FREQUENCIES,
  DOSAGE_ROUTES,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { prescriptionsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatDate } from "../../utils/format";

const FORMS = [
  { value: "Tablet", label: "Tablet" },
  { value: "Capsule", label: "Capsule" },
  { value: "Suspension", label: "Suspension" },
  { value: "Injection", label: "Injection" },
  { value: "Inhaler", label: "Inhaler" },
  { value: "Cream", label: "Cream" },
  { value: "Ointment", label: "Ointment" },
  { value: "Drops", label: "Drops" },
  { value: "Pen", label: "Pen" },
];

let itemSeq = 0;

function blankItem() {
  itemSeq += 1;
  return {
    id: `draft-${itemSeq}`,
    name: "",
    strength: "",
    form: "Tablet",
    dosage: "",
    frequency: "once_daily",
    route: "oral",
    durationDays: "30",
    instructions: "",
  };
}

function CreatePrescription() {
  useDocumentTitle("Write prescription");

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const [patientId, setPatientId] = useState(params.get("patientId") || "");
  const [doctorId, setDoctorId] = useState(user?.doctorId || user?.id || "");
  const [validDays, setValidDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([blankItem()]);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

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

  const updateItem = (id, key, value) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );

  const removeItem = (id) =>
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    );

  const itemErrors = (item) => ({
    name: touched && !item.name.trim() ? "Medication name is required." : null,
    dosage: touched && !item.dosage.trim() ? "Enter a dose." : null,
  });

  const isValid =
    patientId &&
    doctorId &&
    items.length > 0 &&
    items.every((item) => item.name.trim() && item.dosage.trim());

  if (loading) {
    return (
      <div className="page">
        <LoadingState label="Preparing prescription" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title="Cannot open the composer"
          message="Patients and clinicians could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const submit = async () => {
    setTouched(true);
    if (!isValid) return;

    setSaving(true);
    try {
      const result = await prescriptionsService.create({
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        medical_record_id: Number(params.get("recordId")) || 1,
        prescription_date: new Date().toISOString().split("T")[0],
        diagnosis: notes.trim().length >= 3 ? notes.trim() : "General Consultation",
        instructions: notes.trim() || null,
        follow_up_date: null,
        status: "active",
        prescription_items: items.map((item) => ({
          medicine_name: item.name.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency || "once_daily",
          duration: item.durationDays ? `${item.durationDays} days` : "30 days",
          route: item.route || "oral",
          notes: item.instructions.trim() || null,
        })),
      });
      setCreated(result);
    } catch (err) {
      alert(err?.message || "Failed to create prescription.");
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: "Prescriptions", to: "/prescriptions" },
            { label: "Issued" },
          ]}
        />

        <Card surface="soft" stripe>
          <CardBody>
            <div className="col col--gap-lg" style={{ maxWidth: 620 }}>
              <span className="state__icon" aria-hidden="true" style={{ margin: 0 }}>
                <Icon name="checkCircle" size={22} />
              </span>

              <div>
                <h1 className="t-display-sm">Prescription Issued</h1>
                <p className="t-body" style={{ marginTop: "var(--s-sm)" }}>
                  Prescription ID #{created.id} issued successfully for {patient?.name || `Patient #${created.patient_id}`}.
                </p>
              </div>

              <DefList
                items={[
                  { label: "Prescription ID", value: `#${created.id}` },
                  { label: "Patient", value: patient?.name || `#${created.patient_id}` },
                  { label: "Prescriber", value: doctor?.name || `#${created.doctor_id}` },
                  { label: "Diagnosis", value: created.diagnosis },
                  { label: "Medications", value: created.prescription_items?.length || items.length },
                ]}
              />

              <div className="row row--tight row--wrap">
                <Button variant="primary" to="/prescriptions" icon="prescriptions">
                  Back to prescriptions
                </Button>
                <Button
                  variant="outline"
                  icon="plus"
                  onClick={() => {
                    setCreated(null);
                    setItems([blankItem()]);
                    setNotes("");
                    setTouched(false);
                  }}
                >
                  Write another
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <Breadcrumb
        items={[{ label: "Prescriptions", to: "/prescriptions" }, { label: "New" }]}
      />

      <PageHeader
        eyebrow="Prescribing"
        title="Write prescription"
        lede="Add each medication with its dose, frequency, route and duration."
        actions={
          <Button variant="ghost" icon="arrowLeft" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="grid grid--split">
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Prescription details" />
            <CardBody>
              <div className="col col--gap-md">
                <div className="grid grid--2 grid--tight">
                  <Select
                    label="Patient"
                    options={patientList.map((entry) => ({
                      value: entry.id,
                      label: `${entry.name} · ${entry.mobile_no}`,
                    }))}
                    placeholder="Select patient"
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                    error={touched && !patientId ? "Select the patient." : null}
                    required
                  />
                  <Select
                    label="Prescriber"
                    options={doctorList.map((entry) => ({
                      value: entry.id,
                      label: `${entry.name} · ${entry.qualification || "MD"}`,
                    }))}
                    placeholder="Select prescriber"
                    value={doctorId}
                    onChange={(event) => setDoctorId(event.target.value)}
                    error={touched && !doctorId ? "Select the prescriber." : null}
                    required
                  />
                </div>

                <Input
                  label="Valid for (days)"
                  type="number"
                  min="1"
                  max="365"
                  value={validDays}
                  onChange={(event) => setValidDays(event.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead
              title="Medications"
              subtitle={`${items.length} item${items.length === 1 ? "" : "s"}`}
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  icon="plus"
                  onClick={() => setItems([...items, blankItem()])}
                >
                  Add medication
                </Button>
              }
            />
            <CardBody>
              <div className="col col--gap-md">
                {items.map((item, index) => {
                  const errors = itemErrors(item);

                  return (
                    <fieldset className="rx-item" key={item.id}>
                      <div className="rx-item__head">
                        <legend className="t-label t-label--sm t-label--ink">
                          Medication {index + 1}
                        </legend>
                        <IconButton
                          icon="trash"
                          label={`Remove medication ${index + 1}`}
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        />
                      </div>

                      <div className="col col--gap-sm">
                        <div className="grid grid--3 grid--tight">
                          <Input
                            label="Medication Name"
                            placeholder="Amoxicillin"
                            value={item.name}
                            onChange={(event) =>
                              updateItem(item.id, "name", event.target.value)
                            }
                            error={errors.name}
                            required
                          />
                          <Input
                            label="Strength / Dosage"
                            placeholder="500mg"
                            value={item.dosage}
                            onChange={(event) =>
                              updateItem(item.id, "dosage", event.target.value)
                            }
                            error={errors.dosage}
                            required
                          />
                          <Select
                            label="Form"
                            options={FORMS}
                            value={item.form}
                            onChange={(event) =>
                              updateItem(item.id, "form", event.target.value)
                            }
                          />
                        </div>

                        <div className="grid grid--3 grid--tight">
                          <Select
                            label="Frequency"
                            options={DOSAGE_FREQUENCIES}
                            value={item.frequency}
                            onChange={(event) =>
                              updateItem(item.id, "frequency", event.target.value)
                            }
                          />
                          <Select
                            label="Route"
                            options={DOSAGE_ROUTES}
                            value={item.route}
                            onChange={(event) =>
                              updateItem(item.id, "route", event.target.value)
                            }
                          />
                          <Input
                            label="Duration (days)"
                            type="number"
                            min="1"
                            placeholder="7"
                            value={item.durationDays}
                            onChange={(event) =>
                              updateItem(item.id, "durationDays", event.target.value)
                            }
                          />
                        </div>

                        <Input
                          label="Instructions"
                          placeholder="Take after meals"
                          value={item.instructions}
                          onChange={(event) =>
                            updateItem(item.id, "instructions", event.target.value)
                          }
                        />
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </CardBody>
            <CardFoot>
              <Button
                variant="ghost"
                icon="plus"
                onClick={() => setItems([...items, blankItem()])}
              >
                Add another medication
              </Button>
            </CardFoot>
          </Card>

          <Card surface="soft">
            <CardHead title="Diagnosis & Notes" />
            <CardBody>
              <Textarea
                label="Diagnosis & Prescriber Notes"
                rows={3}
                placeholder="Diagnosis and instructions for dispenser/patient"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </CardBody>
          </Card>
        </div>

        {/* Live preview */}
        <Card surface="soft" stripe>
          <CardHead title="Preview" subtitle="Prescription Summary" />
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
                <span className="deflist__label">Prescriber</span>
                <span className="t-data t-ink">{doctor?.name || "Not selected"}</span>
              </div>

              <div className="divider" />

              <div className="row row--between">
                <span className="deflist__label">Date</span>
                <span className="t-data t-strong">{formatDate(new Date())}</span>
              </div>

              <div className="divider" />

              <span className="deflist__label">
                Medications ({items.filter((item) => item.name.trim()).length})
              </span>

              {items.filter((item) => item.name.trim()).length === 0 ? (
                <p className="t-caption">Add at least one medication to preview.</p>
              ) : (
                <ul className="col col--gap-xs">
                  {items
                    .filter((item) => item.name.trim())
                    .map((item, index) => (
                      <RxItem
                        key={item.id}
                        item={{
                          ...item,
                          durationDays: Number(item.durationDays) || null,
                        }}
                        index={index}
                      />
                    ))}
                </ul>
              )}

              <Button
                variant="primary"
                block
                icon="check"
                loading={saving}
                disabled={!isValid}
                onClick={submit}
              >
                Issue prescription
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default CreatePrescription;
