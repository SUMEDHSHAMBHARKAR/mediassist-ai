import { useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import billingService from "../../services/billingService";
import { formatCurrency } from "../../utils/format";

function InvoiceFormModal({ open, onClose, patients = [], defaultPatientId, onSaved }) {
  const [patientId, setPatientId] = useState(defaultPatientId || "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isValid = patientId && Number(amount) > 0;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSaving(true);
    setError(null);

    try {
      const result = await billingService.create({
        patient_id: Number(patientId),
        amount: Number(amount),
        payment_status: "Pending",
        payment_date: null,
        notes: notes.trim() || undefined,
      });

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
      title="Raise Invoice"
      subtitle="Issue a new billing record"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={!isValid}>
            Raise invoice {Number(amount) > 0 && `· ${formatCurrency(Number(amount))}`}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="col col--gap-lg">
          <Select
            label="Patient"
            options={patients.map((p) => ({
              value: p.id,
              label: `${p.name} · ${p.mobile_no}`,
            }))}
            placeholder="Select patient"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            error={touched && !patientId ? "Select the patient." : null}
            disabled={Boolean(defaultPatientId)}
            required
          />

          <Input
            label="Amount (₹)"
            type="number"
            min="1"
            placeholder="1500"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={touched && !(Number(amount) > 0) ? "Enter a valid amount." : null}
            required
          />

          <Textarea
            label="Notes / Description"
            rows={3}
            placeholder="Consultation fee, lab test charges, etc."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          {error && (
            <Banner tone="critical" title="Could not raise invoice">
              {error.message}
            </Banner>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default InvoiceFormModal;
