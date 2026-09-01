import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { RxItem } from "../../components/domain/PrescriptionCard";
import { Identity } from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
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
    durationDays: "",
    instructions: "",
  };
}

/**
 * CreatePrescription — the multi-medication composer.
 *
 * A full page rather than a modal: a prescription can carry several medications
 * with four attributes each, and that does not fit a dialog without cramping.
 * The live preview on the right shows exactly what the patient will receive.
 */
function CreatePrescription() {
  useDocumentTitle("Write prescription");

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const [patientId, setPatientId] = useState(params.get("patientId") || "");
  const [doctorId, setDoctorId] = useState(user?.doctorId || "");
  const [validDays, setValidDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([blankItem()]);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([patientsService.list(), doctorsService.list()]).then(
        ([patients, doctors]) => ({ patients, doctors }),
      ),
    [],
  );

  const patient = useMemo(
    () => (data?.patients || []).find((entry) => entry.id === patientId) || null,
    [data, patientId],
  );
  const doctor = useMemo(
    () => (data?.doctors || []).find((entry) => entry.id === doctorId) || null,
    [data, doctorId],
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

  /**
   * Allergy cross-check. This is a name-substring comparison against the
   * patient's recorded allergies — a prompt to look, not a clinical decision
   * support engine. Real interaction checking belongs on the backend.
   */
  const allergyWarnings = useMemo(() => {
    if (!patient?.allergies?.length) return [];

    return items
      .filter((item) => item.name.trim())
      .flatMap((item) =>
        patient.allergies
          .filter((allergy) =>
            item.name.toLowerCase().includes(allergy.toLowerCase().slice(0, 5)),
          )
          .map((allergy) => ({ item: item.name, allergy })),
      );
  }, [items, patient]);

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
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + Number(validDays || 30));

      const result = await prescriptionsService.create({
        patient_id: Number(patientId) || patientId,
        doctor_id: Number(doctorId) || doctorId,
        medical_record_id: Number(params.get("recordId")) || 1,
        prescription_date: new Date().toISOString().split("T")[0],
        diagnosis: notes || "General clinical prescription",
        instructions: notes || null,
        follow_up_date: null,
        status: "active",
        prescription_items: items.map((item) => ({
          medicine_name: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.durationDays ? `${item.durationDays} days` : "30 days",
          route: item.route || "oral",
          notes: item.instructions || null,
        })),
        patientId,
        doctorId,
        recordId: params.get("recordId") || null,
        issuedAt: new Date().toISOString(),
        validUntil: validUntil.toISOString(),
        notes,
        items: items.map((item) => ({
          ...item,
          durationDays: Number(item.durationDays) || null,
        })),
      });
      setCreated(result);
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
                <h1 className="t-display-sm">Prescription issued</h1>
                <p className="t-body" style={{ marginTop: "var(--s-sm)" }}>
                  {items.length} medication{items.length === 1 ? "" : "s"} for{" "}
                  {patient.name}, prescribed by {doctor?.name}.
                </p>
              </div>

              <DefList
                items={[
                  { label: "Reference", value: created.code },
                  { label: "Patient", value: `${patient.name} · ${patient.mrn}` },
                  { label: "Prescriber", value: doctor?.name || "—" },
                  { label: "Medications", value: items.length },
                  { label: "Valid for", value: `${validDays} days` },
                ]}
              />

              <Banner tone="accent" icon="info">
                The prescriptions API is not connected yet, so this prescription is
                not persisted and will not appear in the list.
              </Banner>

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
                {patient && (
                  <Button variant="ghost" to={`/patients/${patient.id}`}>
                    Open patient record
                  </Button>
                )}
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
                    options={data.patients.map((entry) => ({
                      value: entry.id,
                      label: `${entry.name} · ${entry.mrn}`,
                    }))}
                    placeholder="Select patient"
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                    error={touched && !patientId ? "Select the patient." : null}
                    required
                  />
                  <Select
                    label="Prescriber"
                    options={data.doctors.map((entry) => ({
                      value: entry.id,
                      label: `${entry.name} · ${entry.specialisation}`,
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
                  hint="How long the prescription may be dispensed against"
                />
              </div>
            </CardBody>
          </Card>

          {patient?.allergies?.length > 0 && (
            <Banner tone="critical" title="Allergies on record" icon="alertTriangle">
              {patient.allergies.join(" · ")} — check every medication below before
              issuing.
            </Banner>
          )}

          {allergyWarnings.length > 0 && (
            <Banner tone="critical" title="Possible allergy conflict" icon="alertTriangle">
              {allergyWarnings
                .map((warning) => `${warning.item} resembles “${warning.allergy}”`)
                .join("; ")}
              . This is a name comparison only — confirm clinically before issuing.
            </Banner>
          )}

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
                            label="Medication"
                            placeholder="Amlodipine"
                            value={item.name}
                            onChange={(event) =>
                              updateItem(item.id, "name", event.target.value)
                            }
                            error={errors.name}
                            required
                          />
                          <Input
                            label="Strength"
                            placeholder="5 mg"
                            value={item.strength}
                            onChange={(event) =>
                              updateItem(item.id, "strength", event.target.value)
                            }
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

                        <div className="grid grid--4 grid--tight">
                          <Input
                            label="Dose"
                            placeholder="1 tablet"
                            value={item.dosage}
                            onChange={(event) =>
                              updateItem(item.id, "dosage", event.target.value)
                            }
                            error={errors.dosage}
                            required
                          />
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
                            placeholder="30"
                            value={item.durationDays}
                            onChange={(event) =>
                              updateItem(item.id, "durationDays", event.target.value)
                            }
                          />
                        </div>

                        <Input
                          label="Instructions"
                          placeholder="Morning, with or without food"
                          value={item.instructions}
                          onChange={(event) =>
                            updateItem(item.id, "instructions", event.target.value)
                          }
                          hint="Printed on the patient's copy"
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
            <CardHead title="Prescriber note" />
            <CardBody>
              <Textarea
                label="Note to the patient and dispenser"
                rows={3}
                placeholder="Monitoring requirements, what to report, when to review"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </CardBody>
          </Card>
        </div>

        {/* Live preview */}
        <Card surface="soft" stripe>
          <CardHead title="Preview" subtitle="What the patient receives" />
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
                <span className="deflist__label">Prescriber</span>
                <span className="t-data t-ink">{doctor?.name || "Not selected"}</span>
                {doctor && <span className="t-caption">{doctor.qualifications}</span>}
              </div>

              <div className="divider" />

              <div className="row row--between">
                <span className="deflist__label">Issued</span>
                <span className="t-data t-strong">{formatDate(new Date())}</span>
              </div>
              <div className="row row--between">
                <span className="deflist__label">Valid for</span>
                <span className="t-data t-strong">{validDays || 0} days</span>
              </div>

              <div className="divider" />

              <span className="deflist__label">
                Medications ({items.filter((item) => item.name.trim()).length})
              </span>

              {items.filter((item) => item.name.trim()).length === 0 ? (
                <p className="t-caption">
                  Add at least one medication to see the preview.
                </p>
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

              {notes && (
                <>
                  <div className="divider" />
                  <div>
                    <span className="deflist__label">Note</span>
                    <p className="t-body-sm" style={{ marginTop: 4 }}>
                      {notes}
                    </p>
                  </div>
                </>
              )}

              {allergyWarnings.length > 0 && (
                <Badge tone="critical" icon="alertTriangle" size="lg">
                  Allergy check required
                </Badge>
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

              {!isValid && (
                <p className="t-caption">
                  {!patientId
                    ? "Select a patient."
                    : !doctorId
                      ? "Select a prescriber."
                      : "Every medication needs a name and a dose."}
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

export default CreatePrescription;
