import { useMemo, useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import IconButton from "../../components/ui/IconButton";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import billingService from "../../services/billingService";
import { calculateInvoiceTotals } from "../../mock/billing";
import { formatCurrency } from "../../utils/format";

let lineSeq = 0;

function blankLine() {
  lineSeq += 1;
  return { id: `line-${lineSeq}`, description: "", quantity: "1", unitPrice: "" };
}

/**
 * InvoiceFormModal — raise an invoice from line items.
 *
 * Totals recompute from the lines on every keystroke via the same helper the
 * fixtures use, so the preview can never disagree with the stored arithmetic.
 */
function InvoiceFormModal({ open, onClose, patients = [], doctors = [], defaultPatientId, onSaved }) {
  const [patientId, setPatientId] = useState(defaultPatientId || "");
  const [doctorId, setDoctorId] = useState("");
  const [taxRate, setTaxRate] = useState("5");
  const [discount, setDiscount] = useState("0");
  const [dueDays, setDueDays] = useState("14");
  const [lines, setLines] = useState([blankLine()]);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totals = useMemo(
    () =>
      calculateInvoiceTotals(
        lines.map((line) => ({
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0,
        })),
        { taxRate: Number(taxRate) || 0, discount: Number(discount) || 0 },
      ),
    [lines, taxRate, discount],
  );

  const updateLine = (id, key, value) =>
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [key]: value } : line)),
    );

  const removeLine = (id) =>
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.id !== id),
    );

  const isValid =
    patientId &&
    lines.every((line) => line.description.trim() && Number(line.unitPrice) > 0);

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSaving(true);
    setError(null);

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + Number(dueDays || 14));

    try {
      const result = await billingService.create({
        appointment_id: 1,
        medicine_charge: Math.round(totals.subtotal * 0.4),
        test_charge: Math.round(totals.subtotal * 0.4),
        other_charge: Math.round(totals.subtotal * 0.2),
        payment_method: null,
        patientId,
        doctorId: doctorId || null,
        issuedAt: new Date().toISOString(),
        dueAt: dueAt.toISOString(),
        status: "pending",
        method: null,
        items: lines.map((line) => ({
          ...line,
          quantity: Number(line.quantity) || 1,
          unitPrice: Number(line.unitPrice) || 0,
        })),
        ...totals,
        amountPaid: 0,
        insuranceClaim: null,
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
      size="lg"
      title="Raise invoice"
      subtitle="Add each charge as a line item"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={!isValid}>
            Raise invoice · {formatCurrency(totals.total)}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="col col--gap-lg">
          <div className="grid grid--2 grid--tight">
            <Select
              label="Patient"
              options={patients.map((patient) => ({
                value: patient.id,
                label: `${patient.name} · ${patient.mrn}`,
              }))}
              placeholder="Select patient"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              error={touched && !patientId ? "Select the patient." : null}
              disabled={Boolean(defaultPatientId)}
              required
            />
            <Select
              label="Attending clinician"
              options={doctors.map((doctor) => ({
                value: doctor.id,
                label: doctor.name,
              }))}
              placeholder="Not linked"
              value={doctorId}
              onChange={(event) => setDoctorId(event.target.value)}
            />
          </div>

          <fieldset className="col col--gap-sm">
            <legend className="t-label t-label--sm" style={{ marginBottom: "var(--s-xs)" }}>
              Charges
            </legend>

            {lines.map((line, index) => (
              <div className="rx-item" key={line.id}>
                <div className="rx-item__head">
                  <span className="t-label t-label--sm t-label--ink">
                    Line {index + 1}
                  </span>
                  <IconButton
                    icon="trash"
                    label={`Remove line ${index + 1}`}
                    size="sm"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                  />
                </div>

                <div className="grid grid--tight" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
                  <Input
                    label="Description"
                    placeholder="Cardiology consultation"
                    value={line.description}
                    onChange={(event) =>
                      updateLine(line.id, "description", event.target.value)
                    }
                    error={
                      touched && !line.description.trim() ? "Required" : null
                    }
                    required
                  />
                  <Input
                    label="Qty"
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.id, "quantity", event.target.value)
                    }
                  />
                  <Input
                    label="Unit price"
                    type="number"
                    min="0"
                    placeholder="1200"
                    value={line.unitPrice}
                    onChange={(event) =>
                      updateLine(line.id, "unitPrice", event.target.value)
                    }
                    error={
                      touched && !(Number(line.unitPrice) > 0) ? "Required" : null
                    }
                    required
                  />
                </div>

                <p className="t-caption" style={{ marginTop: "var(--s-xs)" }}>
                  Line total:{" "}
                  <span className="t-ink">
                    {formatCurrency(
                      (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
                    )}
                  </span>
                </p>
              </div>
            ))}

            <Button
              variant="outline"
              icon="plus"
              onClick={() => setLines([...lines, blankLine()])}
            >
              Add line
            </Button>
          </fieldset>

          <div className="grid grid--3 grid--tight">
            <Input
              label="Tax rate (%)"
              type="number"
              min="0"
              max="30"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
            />
            <Input
              label="Discount"
              type="number"
              min="0"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
            <Input
              label="Payment terms (days)"
              type="number"
              min="0"
              value={dueDays}
              onChange={(event) => setDueDays(event.target.value)}
            />
          </div>

          <div className="card card--elevated">
            <div className="card__body card__body--tight col col--gap-xs">
              <div className="row row--between">
                <span className="t-caption">Subtotal</span>
                <span className="t-data t-strong t-tabular">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="row row--between">
                <span className="t-caption">Tax ({totals.taxRate}%)</span>
                <span className="t-data t-strong t-tabular">
                  {formatCurrency(totals.tax)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="row row--between">
                  <span className="t-caption">Discount</span>
                  <span className="t-data t-tabular t-success">
                    −{formatCurrency(totals.discount)}
                  </span>
                </div>
              )}
              <div className="divider" />
              <div className="row row--between">
                <span className="t-label t-label--sm t-label--ink">Total</span>
                <span className="t-title-lg t-tabular">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <Banner tone="critical" title="Could not raise invoice">
              {error.message}
            </Banner>
          )}

          <Banner tone="accent" icon="info">
            The billing API is not connected yet. This form validates and computes
            totals but does not persist the invoice.
          </Banner>
        </div>
      </form>
    </Modal>
  );
}

export default InvoiceFormModal;
