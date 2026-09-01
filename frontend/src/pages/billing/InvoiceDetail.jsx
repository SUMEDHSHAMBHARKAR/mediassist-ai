import { useState } from "react";
import { useParams } from "react-router-dom";

import RecordHeader from "../../components/domain/RecordHeader";
import StatusBadge from "../../components/domain/StatusBadge";
import Banner from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardHead } from "../../components/ui/Card";
import DefList, { MetaRow } from "../../components/ui/DefList";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import { ErrorState, LoadingState, Skeleton } from "../../components/ui/States";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import billingService from "../../services/billingService";
import patientsService from "../../services/patientsService";
import { formatCurrency, formatDate } from "../../utils/format";

const PAYMENT_STATUS_OPTIONS = [
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
  { value: "Cancelled", label: "Cancelled" },
];

function InvoiceDetail() {
  const { id } = useParams();

  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Paid");

  const { data, loading, error, reload, setData } = useAsyncData(
    () =>
      billingService.getById(id).then((invoice) => {
        const pId = invoice.patient_id || invoice.patientId;
        return patientsService.getById(pId).then((patient) => ({
          invoice,
          patient,
        }));
      }),
    [id],
  );

  useDocumentTitle(data?.invoice ? `Invoice #${data.invoice.id}` : "Invoice");

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

  const { invoice, patient } = data;
  const amount = invoice.amount || invoice.total || 0;
  const status = invoice.payment_status || invoice.status || "Pending";
  const dateVal = invoice.payment_date || invoice.issuedAt;

  const recordPayment = async () => {
    setPaying(true);
    try {
      await billingService.updateStatus(invoice.id, selectedStatus);

      setData({
        ...data,
        invoice: {
          ...invoice,
          payment_status: selectedStatus,
          status: selectedStatus,
        },
      });
      setNotice(`Invoice #${invoice.id} status updated to ${selectedStatus}.`);
      setPayOpen(false);
    } catch (err) {
      alert(err?.message || "Failed to update payment status.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page">
      <Breadcrumb
        items={[{ label: "Billing", to: "/billing" }, { label: `Invoice #${invoice.id}` }]}
      />

      <RecordHeader
        eyebrow={`Invoice #${invoice.id}`}
        name={`Invoice #${invoice.id}`}
        square
        badges={
          <StatusBadge kind="payment" value={status} size="lg" />
        }
        meta={
          <MetaRow
            items={[
              { icon: "patients", text: patient.name },
              { icon: "billing", text: `Date: ${formatDate(dateVal)}` },
            ]}
          />
        }
        actions={
          <Button variant="primary" icon="creditCard" onClick={() => setPayOpen(true)}>
            Update Status
          </Button>
        }
        facts={[
          { label: "Patient", value: patient.name },
          { label: "Total Amount", value: formatCurrency(amount) },
          { label: "Status", value: status },
          { label: "Date", value: formatDate(dateVal) },
        ]}
      />

      {notice && (
        <Banner tone="success" className="stack" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      )}

      <div className="grid grid--split" style={{ marginTop: "var(--s-lg)" }}>
        <Card surface="soft">
          <CardHead title="Invoice Summary" />
          <CardBody>
            <DefList
              columns={1}
              items={[
                { label: "Invoice Reference", value: `#${invoice.id}` },
                { label: "Total Amount", value: formatCurrency(amount) },
                { label: "Payment Status", value: status },
                { label: "Description / Notes", value: invoice.notes || "Standard billing charge" },
              ]}
            />
          </CardBody>
        </Card>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Patient Information" />
            <CardBody>
              <DefList
                columns={1}
                items={[
                  { label: "Name", value: patient.name },
                  { label: "Phone", value: patient.mobile_no },
                  { label: "Gender", value: patient.gender },
                  { label: "Address", value: patient.address },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        size="sm"
        title="Update Payment Status"
        subtitle={`Invoice #${invoice.id} · ${formatCurrency(amount)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)} disabled={paying}>
              Cancel
            </Button>
            <Button variant="primary" onClick={recordPayment} loading={paying}>
              Save Status
            </Button>
          </>
        }
      >
        <div className="col col--gap-md">
          <Select
            label="Payment Status"
            options={PAYMENT_STATUS_OPTIONS}
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

export default InvoiceDetail;
