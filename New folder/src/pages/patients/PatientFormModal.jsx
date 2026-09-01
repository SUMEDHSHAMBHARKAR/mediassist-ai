import { useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import {
  BLOOD_GROUPS,
  GENDERS,
  PATIENT_STATUS_META,
  statusOptions,
} from "../../constants/statuses";
import patientsService from "../../services/patientsService";
import { toDateInputValue } from "../../utils/format";

const EMPTY = {
  name: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  status: "active",
  primaryDoctorId: "",
  allergies: "",
  conditions: "",
  insuranceProvider: "",
  insuranceNumber: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
};

/**
 * PatientFormModal — create or edit a patient.
 *
 * One form for both modes: the fields are identical and duplicating them would
 * guarantee they drift. Submission goes through patientsService, which does not
 * persist yet — the modal reports that plainly instead of implying it saved.
 */
function PatientFormModal({ open, onClose, patient, doctors = [], onSaved }) {
  const isEdit = Boolean(patient);

  const [form, setForm] = useState(() =>
    patient
      ? {
          ...EMPTY,
          ...patient,
          dob: toDateInputValue(patient.dob),
          allergies: (patient.allergies || []).join(", "),
          conditions: (patient.conditions || []).join(", "),
          emergencyName: patient.emergencyContact?.name || "",
          emergencyRelation: patient.emergencyContact?.relation || "",
          emergencyPhone: patient.emergencyContact?.phone || "",
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const errors = {
    name: touched && !form.name.trim() ? "Enter the patient's full name." : null,
    dob: touched && !form.dob ? "Date of birth is required." : null,
    phone: touched && !form.phone.trim() ? "A contact number is required." : null,
  };

  const isValid = form.name.trim() && form.dob && form.phone.trim();

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      allergies: form.allergies
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      conditions: form.conditions
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      emergencyContact: {
        name: form.emergencyName,
        relation: form.emergencyRelation,
        phone: form.emergencyPhone,
      },
    };

    try {
      const result = isEdit
        ? await patientsService.update(patient.id, payload)
        : await patientsService.create(payload);

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
      title={isEdit ? "Edit patient record" : "Register patient"}
      subtitle={
        isEdit
          ? `${patient.mrn} · changes are recorded in the audit trail`
          : "A medical record number is assigned automatically"
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {isEdit ? "Save changes" : "Register patient"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="col col--gap-lg">
          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Identity
            </legend>

            <Input
              label="Full name"
              icon="user"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              required
            />

            <div className="grid grid--3 grid--tight">
              <Input
                label="Date of birth"
                type="date"
                value={form.dob}
                onChange={set("dob")}
                error={errors.dob}
                required
              />
              <Select
                label="Gender"
                options={GENDERS}
                placeholder="Select"
                value={form.gender}
                onChange={set("gender")}
              />
              <Select
                label="Blood group"
                options={BLOOD_GROUPS}
                placeholder="Unknown"
                value={form.bloodGroup}
                onChange={set("bloodGroup")}
              />
            </div>
          </fieldset>

          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Contact
            </legend>

            <div className="grid grid--2 grid--tight">
              <Input
                label="Phone"
                type="tel"
                icon="phone"
                value={form.phone}
                onChange={set("phone")}
                error={errors.phone}
                required
              />
              <Input
                label="Email"
                type="email"
                icon="mail"
                value={form.email}
                onChange={set("email")}
              />
            </div>

            <Textarea
              label="Address"
              rows={2}
              value={form.address}
              onChange={set("address")}
            />

            <div className="grid grid--2 grid--tight">
              <Input label="City" value={form.city} onChange={set("city")} />
              <Select
                label="Record status"
                options={statusOptions(PATIENT_STATUS_META)}
                value={form.status}
                onChange={set("status")}
              />
            </div>
          </fieldset>

          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Clinical
            </legend>

            <Select
              label="Primary clinician"
              options={doctors.map((doctor) => ({
                value: doctor.id,
                label: `${doctor.name} · ${doctor.specialisation}`,
              }))}
              placeholder="Unassigned"
              value={form.primaryDoctorId}
              onChange={set("primaryDoctorId")}
            />

            <Input
              label="Allergies"
              icon="alertTriangle"
              placeholder="Penicillin, Latex"
              hint="Comma separated. Shown prominently on the record."
              value={form.allergies}
              onChange={set("allergies")}
            />

            <Input
              label="Ongoing conditions"
              placeholder="Hypertension, Type 2 diabetes"
              hint="Comma separated"
              value={form.conditions}
              onChange={set("conditions")}
            />
          </fieldset>

          <fieldset className="col col--gap-md">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Insurance and next of kin
            </legend>

            <div className="grid grid--2 grid--tight">
              <Input
                label="Insurance provider"
                value={form.insuranceProvider}
                onChange={set("insuranceProvider")}
              />
              <Input
                label="Policy number"
                value={form.insuranceNumber}
                onChange={set("insuranceNumber")}
              />
            </div>

            <div className="grid grid--3 grid--tight">
              <Input
                label="Contact name"
                value={form.emergencyName}
                onChange={set("emergencyName")}
              />
              <Input
                label="Relationship"
                value={form.emergencyRelation}
                onChange={set("emergencyRelation")}
              />
              <Input
                label="Contact phone"
                type="tel"
                value={form.emergencyPhone}
                onChange={set("emergencyPhone")}
              />
            </div>
          </fieldset>

          {error && (
            <Banner tone="critical" title="Could not save">
              {error.message}
            </Banner>
          )}

          <Banner tone="accent" icon="info">
            The patient API is not connected yet, so this form validates and
            submits but does not persist the record.
          </Banner>
        </div>
      </form>
    </Modal>
  );
}

export default PatientFormModal;
