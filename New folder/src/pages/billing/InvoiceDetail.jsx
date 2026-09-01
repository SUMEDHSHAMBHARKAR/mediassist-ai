import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import StatusBadge from "../../components/domain/StatusBadge";
import Badge from "../../components/ui/Badge";
import Banner, { Progress } from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Table from "../../components/ui/Table";
import { ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  optionLabel,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import appointmentsService from "../../services/appointmentsService";
import billingService from "../../services/billingService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatCurrency, formatDate, formatDateTime, orDash } from "../../utils/format";

const CLAIM_TONE = { approved: "success", rejected: "critical", submitted: "warning" };

/**
 * InvoiceDetail — a single invoice with its line items and payment state.
 *
 * The line-item table is the document; the rail carries payment, insurance and
 * the records this invoice relates to.
 */
function InvoiceDetail() {
  const { id } = useParams();
  const { role } = useAuth();

  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState(null);
  const [payment, setPayment] = useState({ amount: "", method: "card" });

  const { data, loading, error, reload, setData } = useAsyncData(
    () =>
      billingService.getById(id).then((invoice) =>
        Promise.all([
          patientsService.getById(invoice.patientId),
          invoice.doctorId ? doctorsService.getById(invoice.doctorId) : Promise.resolve(null),
          invoice.appointmentId
            ? appointmentsService.getById(invoice.appointmentId).catch(() => null)
            : Promise.resolve(null),
        ]).then(([patient, doctor, appointment]) => ({
          invoice,
          patient,
          doctor,
          appointment,
        })),
      ),
    [id],
  );

  useDocumentTitle(data?.invoice ? data.invoice.invoiceNo : "Invoice");

  if (loading) {
    return (
      <div className="page">
        <Skeleton variant="block" height={180} />
        <div style={{ marginTop: "var(--s-lg)" }}>
          <LoadingState label="Loading invoice" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Breadcrumb items={[{ label: "Billing", to: "/billing" }, { label: "Not found" }]} />
        <ErrorState title="Invoice unavailable" message={error.message} onRetry={reload} />
      </div>
    );
  }

  const { invoice, patient, doctor, appointment } = data;
  const outstanding = Math.max(0, invoice.total - invoice.amountPaid);
  const paidRatio = invoice.total > 0 ? (invoice.amountPaid / invoice.total) * 100 : 0;

  const recordPayment = async () => {
    const amount = Number(payment.amount) || outstanding;
    setPaying(true);

    try {
      await billingService.recordPayment(invoice.id, {
        amount,
        method: payment.method,
      });

      const nextPaid = invoice.amountPaid + amount;
      setData({
        ...data,
        invoice: {
          ...invoice,
          amountPaid: nextPaid,
          method: payment.method,
          status:
            nextPaid >= invoice.total ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL,
        },
      });
      setNotice(
        `${formatCurrency(amount)} recorded against this invoice. No payment was actually taken — the billing API is not connected.`,
      );
      setPayOpen(false);
      setPayment({ amount: "", method: "card" });
    } finally {
      setPaying(false);
    }
  };

  const columns = [
    {
      key: "description",
      header: "Description",
      full: true,
      render: (line) => <span className="t-ink">{line.description}</span>,
    },
    {
      key: "quantity",
      header: "Qty",
      align: "right",
      render: (line) => line.quantity,
    },
    {
      key: "unitPrice",
      header: "Unit price",
      align: "right",
      render: (line) => formatCurrency(line.unitPrice),
    },
    {
      key: "lineTotal",
      header: "Amount",
      align: "right",
      render: (line) => (
        <span className="t-ink">{formatCurrency(line.quantity * line.unitPrice)}</span>
      ),
    },
  ];

  return (
    <div className="page">
      <Breadcrumb
        items={[{ label: "Billing", to: "/billing" }, { label: invoice.invoiceNo }]}
      />

      <RecordHeader
        eyebrow="Invoice"
        name={invoice.invoiceNo}
        square
        badges={
          <>
            <StatusBadge kind="payment" value={invoice.status} size="lg" />
            {invoice.method && (
              <Badge tone="outline" icon="creditCard">
                {optionLabel(PAYMENT_METHODS, invoice.method)}
              </Badge>
            )}
            {invoice.insuranceClaim && (
              <Badge tone={CLAIM_TONE[invoice.insuranceClaim.status] || "muted"}>
                Claim {invoice.insuranceClaim.status}
              </Badge>
            )}
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: "patients", text: patient.name },
              { icon: "billing", text: `Issued ${formatDate(invoice.issuedAt)}` },
              { icon: "clock", text: `Due ${formatDate(invoice.dueAt)}` },
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
            {outstanding > 0 && (
              <Button variant="primary" icon="creditCard" onClick={() => setPayOpen(true)}>
                {role === ROLES.PATIENT ? "Pay now" : "Record payment"}
              </Button>
            )}
          </>
        }
        facts={[
          { label: "Patient", value: `${patient.name} · ${patient.mrn}` },
          { label: "Attending", value: orDash(doctor?.name) },
          { label: "Total", value: formatCurrency(invoice.total) },
          { label: "Paid", value: formatCurrency(invoice.amountPaid) },
          { label: "Outstanding", value: formatCurrency(outstanding) },
        ]}
      />

      {notice && (
        <Banner tone="success" className="stack" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      )}

      {invoice.status === PAYMENT_STATUS.OVERDUE && (
        <Banner tone="critical" title="Payment overdue" className="stack">
          This invoice passed its payment terms on {formatDate(invoice.dueAt)}.
          {invoice.insuranceClaim?.status === "rejected" &&
            " The insurance claim was rejected, so the balance sits with the patient."}
        </Banner>
      )}

      {invoice.note && (
        <Banner tone="warning" title="Note" className="stack">
          {invoice.note}
        </Banner>
      )}

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <Card surface="soft">
          <CardHead
            title="Charges"
            subtitle={`${invoice.items.length} line item${invoice.items.length === 1 ? "" : "s"}`}
          />
          <CardBody padding="none">
            <Table
              columns={columns}
              rows={invoice.items}
              caption="Invoice line items"
              responsive
            />
          </CardBody>

          <div className="card__body card__body--tight col col--gap-xs">
            <div className="row row--between">
              <span className="t-caption">Subtotal</span>
              <span className="t-data t-strong t-tabular">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div className="row row--between">
              <span className="t-caption">Tax ({invoice.taxRate}%)</span>
              <span className="t-data t-strong t-tabular">
                {formatCurrency(invoice.tax)}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="row row--between">
                <span className="t-caption">Discount</span>
                <span className="t-data t-tabular t-success">
                  −{formatCurrency(invoice.discount)}
                </span>
              </div>
            )}
            {invoice.amountPaid > 0 && (
              <div className="row row--between">
                <span className="t-caption">Paid</span>
                <span className="t-data t-tabular t-success">
                  −{formatCurrency(invoice.amountPaid)}
                </span>
              </div>
            )}
          </div>

          <div className="invoice-total">
            <span className="t-label t-label--ink">
              {outstanding > 0 ? "Outstanding" : "Settled"}
            </span>
            <span className="invoice-total__value">
              {formatCurrency(outstanding > 0 ? outstanding : invoice.total)}
            </span>
          </div>

          <CardFoot>
            <span className="t-caption row row--tight">
              <Icon name="info" size={13} />
              Amounts in INR, inclusive of tax where shown
            </span>
          </CardFoot>
        </Card>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Payment" />
            <CardBody>
              <div className="col col--gap-md">
                {invoice.amountPaid > 0 && outstanding > 0 && (
                  <div className="col col--gap-xs">
                    <Progress value={paidRatio} tone="warning" label="Amount paid" />
                    <span className="t-caption">
                      {formatCurrency(invoice.amountPaid)} of{" "}
                      {formatCurrency(invoice.total)} received
                    </span>
                  </div>
                )}

                <DefList
                  columns={1}
                  items={[
                    { label: "Status", value: <StatusBadge kind="payment" value={invoice.status} /> },
                    {
                      label: "Method",
                      value: invoice.method
                        ? optionLabel(PAYMENT_METHODS, invoice.method)
                        : "Not recorded",
                    },
                    { label: "Issued", value: formatDateTime(invoice.issuedAt) },
                    { label: "Due", value: formatDate(invoice.dueAt) },
                  ]}
                />

                {outstanding > 0 && (
                  <Button variant="primary" icon="creditCard" block onClick={() => setPayOpen(true)}>
                    {role === ROLES.PATIENT ? "Pay now" : "Record payment"}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {invoice.insuranceClaim && (
            <Card surface="soft">
              <CardHead title="Insurance claim" />
              <CardBody>
                <DefList
                  columns={1}
                  items={[
                    { label: "Provider", value: invoice.insuranceClaim.provider },
                    {
                      label: "Status",
                      value: (
                        <Badge tone={CLAIM_TONE[invoice.insuranceClaim.status] || "muted"}>
                          {invoice.insuranceClaim.status}
                        </Badge>
                      ),
                    },
                    {
                      label: "Approved amount",
                      value: formatCurrency(invoice.insuranceClaim.amount),
                    },
                    { label: "Policy", value: orDash(patient.insuranceNumber) },
                  ]}
                />
              </CardBody>
            </Card>
          )}

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
                  { label: "Phone", value: patient.phone },
                  { label: "Address", value: `${patient.address}, ${patient.city}` },
                ]}
              />
            </CardBody>
          </Card>

          {appointment && (
            <Card surface="soft">
              <CardHead title="Related appointment" />
              <CardBody>
                <Link to={`/appointments/${appointment.id}`} className="col col--gap-xs">
                  <span className="t-data t-ink">{appointment.reason}</span>
                  <span className="t-caption">{formatDateTime(appointment.startsAt)}</span>
                  <span className="text-link text-link--sm" style={{ marginTop: 6 }}>
                    Open appointment
                    <Icon name="arrowRight" size={12} />
                  </span>
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        size="sm"
        title={role === ROLES.PATIENT ? "Pay invoice" : "Record payment"}
        subtitle={`${invoice.invoiceNo} · ${formatCurrency(outstanding)} outstanding`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)} disabled={paying}>
              Cancel
            </Button>
            <Button variant="primary" onClick={recordPayment} loading={paying}>
              {role === ROLES.PATIENT ? "Pay" : "Record"}{" "}
              {formatCurrency(Number(payment.amount) || outstanding)}
            </Button>
          </>
        }
      >
        <div className="col col--gap-md">
          <Banner tone="warning" icon="alertTriangle">
            No payment provider is connected. This records the amount locally so the
            paid and part-paid states can be reviewed; no money moves.
          </Banner>

          <Input
            label="Amount"
            type="number"
            min="1"
            max={outstanding}
            placeholder={String(outstanding)}
            value={payment.amount}
            onChange={(event) => setPayment({ ...payment, amount: event.target.value })}
            hint={`Leave blank to settle the full ${formatCurrency(outstanding)}`}
          />

          <Select
            label="Method"
            options={PAYMENT_METHODS}
            value={payment.method}
            onChange={(event) => setPayment({ ...payment, method: event.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}

export default InvoiceDetail;
