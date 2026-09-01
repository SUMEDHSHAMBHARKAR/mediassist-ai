import { useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { GENDERS } from "../../constants/statuses";
import patientsService from "../../services/patientsService";
import { toDateInputValue } from "../../utils/format";

const EMPTY = {
  name: "",
  dob: "",
  gender: "Male",
  phone: "",
  address: "",
};

/**
 * PatientFormModal — create or edit a patient record using FastAPI schema:
 * { name, date_of_birth, mobile_no, address, gender }
 */
function PatientFormModal({ open, onClose, patient, onSaved }) {
  const isEdit = Boolean(patient);

  const [form, setForm] = useState(() =>
    patient
      ? {
          name: patient.name || "",
          dob: toDateInputValue(patient.date_of_birth || patient.dob),
          gender: patient.gender || "Male",
          phone: patient.mobile_no || patient.phone || "",
          address: patient.address || "",
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
    phone: touched && !form.phone.trim() ? "A mobile contact number is required." : null,
  };

  const isValid = form.name.trim() && form.dob && form.phone.trim();

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      date_of_birth: form.dob,
      mobile_no: form.phone.trim(),
      address: form.address.trim(),
      gender: form.gender,
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
      size="md"
      title={isEdit ? "Edit patient record" : "Register patient"}
      subtitle="Fill in patient profile details"
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
              Identity & Contact
            </legend>

            <Input
              label="Full name"
              icon="user"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              required
            />

            <div className="grid grid--2 grid--tight">
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
            </div>

            <Input
              label="Mobile phone number"
              type="tel"
              icon="phone"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              required
            />

            <Textarea
              label="Address"
              rows={2}
              value={form.address}
              onChange={set("address")}
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

export default PatientFormModal;
