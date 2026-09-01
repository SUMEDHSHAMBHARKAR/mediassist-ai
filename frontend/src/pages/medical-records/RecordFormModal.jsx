import { useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { medicalRecordsService } from "../../services/clinicalService";
import { toDateInputValue } from "../../utils/format";

const EMPTY = {
  patientId: "",
  doctorId: "",
  visitDate: toDateInputValue(new Date()),
  diagnosis: "",
  chiefComplaint: "General Consultation",
  treatment: "",
  allergies: "",
  notes: "",
};

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
          patientId: record.patient_id || record.patientId || "",
          doctorId: record.doctor_id || record.doctorId || "",
          visitDate: toDateInputValue(record.visit_date || record.visitDate),
          diagnosis: record.diagnosis || "",
          chiefComplaint: record.chief_complaint || record.chiefComplaint || "General Consultation",
          treatment: record.treatment || "",
          allergies: record.allergies || "",
          notes: record.notes || "",
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
    diagnosis: touched && form.diagnosis.trim().length < 3 ? "Diagnosis must be at least 3 characters." : null,
    chiefComplaint: touched && form.chiefComplaint.trim().length < 3 ? "Chief complaint must be at least 3 characters." : null,
  };

  const isValid =
    form.patientId &&
    form.doctorId &&
    form.visitDate &&
    form.diagnosis.trim().length >= 3 &&
    form.chiefComplaint.trim().length >= 3;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSaving(true);
    setError(null);

    const payload = isEdit
      ? {
          chief_complaint: form.chiefComplaint.trim(),
          diagnosis: form.diagnosis.trim(),
          treatment: form.treatment.trim() || null,
          allergies: form.allergies.trim() || null,
          notes: form.notes.trim() || null,
        }
      : {
          patient_id: Number(form.patientId),
          doctor_id: Number(form.doctorId),
          visit_date: form.visitDate,
          chief_complaint: form.chiefComplaint.trim(),
          diagnosis: form.diagnosis.trim(),
          treatment: form.treatment.trim() || null,
          allergies: form.allergies.trim() || null,
          notes: form.notes.trim() || null,
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
      size="md"
      title={isEdit ? "Amend medical record" : "New medical record"}
      subtitle="Document the clinical encounter details"
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
              Encounter & Participants
            </legend>

            <div className="grid grid--2 grid--tight">
              <Select
                label="Patient"
                options={patients.map((p) => ({
                  value: p.id,
                  label: p.name,
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
                options={doctors.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
                placeholder="Select clinician"
                value={form.doctorId}
                onChange={set("doctorId")}
                error={errors.doctorId}
                disabled={isEdit}
                required
              />
            </div>

            <Input
              label="Encounter date"
              type="date"
              value={form.visitDate}
              onChange={set("visitDate")}
              error={errors.visitDate}
              disabled={isEdit}
              required
            />
          </fieldset>

          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Clinical Findings
            </legend>

            <Textarea
              label="Chief Complaint"
              rows={2}
              placeholder="Presenting complaint"
              value={form.chiefComplaint}
              onChange={set("chiefComplaint")}
              error={errors.chiefComplaint}
              required
            />

            <Input
              label="Diagnosis"
              value={form.diagnosis}
              onChange={set("diagnosis")}
              error={errors.diagnosis}
              required
            />

            <Textarea
              label="Treatment and Plan"
              rows={3}
              placeholder="Medications, procedure notes, recommendations"
              value={form.treatment}
              onChange={set("treatment")}
            />

            <Textarea
              label="Notes"
              rows={2}
              placeholder="Additional clinical observations"
              value={form.notes}
              onChange={set("notes")}
            />
          </fieldset>

          {error && (
            <Banner tone="critical" title="Could not save">
              {error.message}
            </Banner>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default RecordFormModal;
