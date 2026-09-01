import { useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import {
  SEVERITY_META,
  statusOptions,
} from "../../constants/statuses";
import { medicalRecordsService } from "../../services/clinicalService";
import { toDateInputValue } from "../../utils/format";

const EMPTY = {
  patientId: "",
  doctorId: "",
  visitDate: toDateInputValue(new Date()),
  diagnosis: "",
  icdCode: "",
  severity: "routine",
  chiefComplaint: "",
  treatment: "",
  notes: "",
  followUpDate: "",
  bloodPressure: "",
  heartRate: "",
  temperature: "",
  spo2: "",
  weightKg: "",
};

/**
 * RecordFormModal — document or amend a clinical encounter.
 *
 * Observations are captured alongside the narrative because a record without
 * vitals is rarely useful for later review.
 */
function RecordFormModal({
  open,
  onClose,
  record,
  patients = [],
  doctors = [],
  defaultPatientId,
  onSaved,
}) {
  const isEdit = Boolean(record);

  const [form, setForm] = useState(() =>
    record
      ? {
          ...EMPTY,
          ...record,
          visitDate: toDateInputValue(record.visitDate),
          followUpDate: toDateInputValue(record.followUpDate),
          bloodPressure: record.vitals?.bloodPressure || "",
          heartRate: record.vitals?.heartRate || "",
          temperature: record.vitals?.temperature || "",
          spo2: record.vitals?.spo2 || "",
          weightKg: record.vitals?.weightKg || "",
        }
      : { ...EMPTY, patientId: defaultPatientId || "" },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const errors = {
    patientId: touched && !form.patientId ? "Select the patient." : null,
    doctorId: touched && !form.doctorId ? "Select the treating clinician." : null,
    visitDate: touched && !form.visitDate ? "Enter the encounter date." : null,
    diagnosis: touched && !form.diagnosis.trim() ? "A diagnosis is required." : null,
  };

  const isValid =
    form.patientId && form.doctorId && form.visitDate && form.diagnosis.trim();

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSaving(true);
    setError(null);

    const payload = {
      patient_id: Number(form.patientId) || form.patientId,
      doctor_id: Number(form.doctorId) || form.doctorId,
      visit_date: form.visitDate,
      chief_complaint: form.chiefComplaint || "General consultation",
      patientId: form.patientId,
      doctorId: form.doctorId,
      visitDate: form.visitDate,
      diagnosis: form.diagnosis,
      icdCode: form.icdCode,
      severity: form.severity,
      chiefComplaint: form.chiefComplaint,
      treatment: form.treatment,
      allergies: form.allergies || null,
      notes: form.notes,
      followUpDate: form.followUpDate
        ? new Date(form.followUpDate).toISOString()
        : null,
      vitals: {
        bloodPressure: form.bloodPressure,
        heartRate: Number(form.heartRate) || null,
        temperature: Number(form.temperature) || null,
        spo2: Number(form.spo2) || null,
        weightKg: Number(form.weightKg) || null,
      },
    };

    try {
      const result = isEdit
        ? await medicalRecordsService.update(record.id, payload)
        : await medicalRecordsService.create(payload);

      onSaved?.(result);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Amend medical record" : "New medical record"}
      subtitle={
        isEdit
          ? "Amendments are versioned and recorded in the audit trail"
          : "Document the encounter, diagnosis and plan"
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {isEdit ? "Save amendment" : "Save record"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="col col--gap-lg">
          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Encounter
            </legend>

            <div className="grid grid--2 grid--tight">
              <Select
                label="Patient"
                options={patients.map((patient) => ({
                  value: patient.id,
                  label: `${patient.name} · ${patient.mrn}`,
                }))}
                placeholder="Select patient"
                value={form.patientId}
                onChange={set("patientId")}
                error={errors.patientId}
                disabled={Boolean(defaultPatientId) || isEdit}
                required
              />
              <Select
                label="Treating clinician"
                options={doctors.map((doctor) => ({
                  value: doctor.id,
                  label: `${doctor.name} · ${doctor.specialisation}`,
                }))}
                placeholder="Select clinician"
                value={form.doctorId}
                onChange={set("doctorId")}
                error={errors.doctorId}
                required
              />
            </div>

            <div className="grid grid--3 grid--tight">
              <Input
                label="Encounter date"
                type="date"
                value={form.visitDate}
                onChange={set("visitDate")}
                error={errors.visitDate}
                required
              />
              <Select
                label="Severity"
                options={statusOptions(SEVERITY_META)}
                value={form.severity}
                onChange={set("severity")}
              />
              <Input
                label="Follow-up date"
                type="date"
                value={form.followUpDate}
                onChange={set("followUpDate")}
                hint="Leave blank if none"
              />
            </div>
          </fieldset>

          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Clinical detail
            </legend>

            <Textarea
              label="Presenting complaint"
              rows={2}
              placeholder="What the patient reported"
              value={form.chiefComplaint}
              onChange={set("chiefComplaint")}
            />

            <div className="grid grid--2 grid--tight">
              <Input
                label="Diagnosis"
                value={form.diagnosis}
                onChange={set("diagnosis")}
                error={errors.diagnosis}
                required
              />
              <Input
                label="ICD code"
                placeholder="I10 · E11.9"
                value={form.icdCode}
                onChange={set("icdCode")}
                hint="Separate multiple codes with ·"
              />
            </div>

            <Textarea
              label="Treatment and plan"
              rows={3}
              placeholder="Medication changes, procedures, referrals"
              value={form.treatment}
              onChange={set("treatment")}
            />

            <Textarea
              label="Clinical notes"
              rows={3}
              placeholder="Reasoning, discussion with the patient, safety netting"
              value={form.notes}
              onChange={set("notes")}
            />
          </fieldset>

          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Observations
            </legend>

            <div className="grid grid--3 grid--tight">
              <Input
                label="Blood pressure"
                placeholder="120/80"
                value={form.bloodPressure}
                onChange={set("bloodPressure")}
              />
              <Input
                label="Heart rate"
                type="number"
                placeholder="72"
                value={form.heartRate}
                onChange={set("heartRate")}
              />
              <Input
                label="Temperature"
                type="number"
                step="0.1"
                placeholder="36.8"
                value={form.temperature}
                onChange={set("temperature")}
              />
              <Input
                label="SpO₂"
                type="number"
                placeholder="98"
                value={form.spo2}
                onChange={set("spo2")}
              />
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                placeholder="70"
                value={form.weightKg}
                onChange={set("weightKg")}
              />
            </div>
          </fieldset>

          {error && (
            <Banner tone="critical" title="Could not save">
              {error.message}
            </Banner>
          )}

          <Banner tone="accent" icon="info">
            The medical records API is not connected yet. This form validates and
            submits but does not persist the record.
          </Banner>
        </div>
      </form>
    </Modal>
  );
}

export default RecordFormModal;
