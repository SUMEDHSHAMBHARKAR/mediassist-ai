import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import InvoiceCard from "../../components/domain/InvoiceCard";
import StatusBadge from "../../components/domain/StatusBadge";
import { Identity } from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import Table from "../../components/ui/Table";
import { Segmented } from "../../components/ui/Tabs";
import Toolbar from "../../components/ui/Toolbar";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import billingService from "../../services/billingService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { sumBy } from "../../utils/collection";
import { formatCurrency, formatDate } from "../../utils/format";
import InvoiceFormModal from "./InvoiceFormModal";

function Billing() {
  useDocumentTitle("Billing");

  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [params] = useSearchParams();

  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        role === ROLES.PATIENT
          ? billingService.listByPatient(user?.patientId || user?.id)
          : billingService.list(),
        patientsService.list().catch(() => []),
        doctorsService.list().catch(() => []),
      ]).then(([rawInvoices, rawPatients, rawDoctors]) => {
        const invoiceList = Array.isArray(rawInvoices) ? rawInvoices : rawInvoices?.items || [];
        const patientList = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
        const doctorList = Array.isArray(rawDoctors?.items) ? rawDoctors.items : Array.isArray(rawDoctors) ? rawDoctors : [];

        return {
          invoices: invoiceList,
          patients: patientList,
          doctors: doctorList,
          patientsById: new Map(patientList.map((patient) => [patient.id, patient])),
        };
      }),
    [role, user?.patientId, user?.id],
  );

  const controls = useTableControls(data?.invoices || [], {
    searchFields: [
      "notes",
      "payment_status",
      (invoice) => data?.patientsById.get(invoice.patient_id || invoice.patientId)?.name,
    ],
    initialSort: { key: "id", direction: "desc" },
    initialFilters: {
      status: params.get("status") || "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      amount: (invoice) => invoice.amount || invoice.total || 0,
      payment_date: (invoice) => invoice.payment_date || invoice.issuedAt,
    },
    pageSize: 10,
  });

  const invoices = data?.invoices || [];

  const totalBilled = sumBy(invoices, (inv) => inv.amount || inv.total || 0);
  const paidInvoices = invoices.filter(
    (inv) => (inv.payment_status || inv.status || "").toLowerCase() === "paid",
  );
  const totalCollected = sumBy(paidInvoices, (inv) => inv.amount || inv.total || 0);

  const columns = [
    {
      key: "id",
      header: "Invoice Ref",
      render: (invoice) => <span className="t-mono t-ink">#{invoice.id}</span>,
    },
    {
      key: "patient_id",
      header: "Patient",
      full: true,
      render: (invoice) => {
        const pId = invoice.patient_id || invoice.patientId;
        const patient = data?.patientsById.get(pId);
        return (
          <Identity
            name={patient?.name || `Patient #${pId}`}
            meta={patient?.mobile_no}
            size="sm"
            square
            accent
          />
        );
      },
    },
    {
      key: "payment_date",
      header: "Date",
      sortable: true,
      hideOn: "mobile",
      render: (invoice) => (
        <span className="t-nowrap">{formatDate(invoice.payment_date || invoice.issuedAt)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (invoice) => formatCurrency(invoice.amount || invoice.total || 0),
    },
    {
      key: "payment_status",
      header: "Status",
      render: (invoice) => (
        <StatusBadge kind="payment" value={invoice.payment_status || invoice.status || "Pending"} />
      ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      stackedLabel: "",
      render: () => <Icon name="chevronRight" size={14} className="t-muted" />,
    },
  ];

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Operations" title="Billing" />
        <ErrorState
          title="Billing unavailable"
          message="Invoices could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Operations"
        title="Billing"
        lede={
          role === ROLES.PATIENT
            ? "Your invoices, payments and balances."
            : "Invoices raised, collected revenue and payment records."
        }
        actions={
          role !== ROLES.PATIENT && (
            <Button variant="primary" icon="plus" onClick={() => setFormOpen(true)}>
              Raise invoice
            </Button>
          )
        }
      />

      <section className="grid grid--3" style={{ marginBottom: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} variant="block" height={126} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Billed"
              value={formatCurrency(totalBilled)}
              icon="billing"
              footnote={`${invoices.length} total invoices`}
            />
            <StatCard
              label="Collected Revenue"
              value={formatCurrency(totalCollected)}
              icon="checkCircle"
              footnote={`${paidInvoices.length} paid invoices`}
            />
            <StatCard
              label="Pending Records"
              value={invoices.length - paidInvoices.length}
              icon="creditCard"
            />
          </>
        )}
      </section>

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by invoice ref or patient"
        filters={
          <>
            {controls.isFiltered && (
              <Button size="sm" variant="ghost" icon="close" onClick={controls.resetFilters}>
                Clear
              </Button>
            )}
          </>
        }
        trailing={
          <Segmented
            value={view}
            onChange={setView}
            items={[
              { value: "table", label: "List", icon: "list" },
              { value: "cards", label: "Cards", icon: "grid" },
            ]}
          />
        }
      />

      {loading ? (
        <Card surface="soft">
          <CardBody>
            <SkeletonRows rows={6} />
          </CardBody>
        </Card>
      ) : controls.rows.length === 0 ? (
        <Card surface="soft">
          <EmptyState
            icon="billing"
            title="No invoices"
            message={
              role === ROLES.PATIENT
                ? "Invoices raised for your care will appear here."
                : "Raise an invoice to bill for a consultation or procedure."
            }
            actionLabel={role === ROLES.PATIENT ? undefined : "Raise invoice"}
            actionIcon="plus"
            action={() => setFormOpen(true)}
          />
        </Card>
      ) : view === "table" ? (
        <Card surface="soft">
          <Table
            columns={columns}
            rows={controls.rows}
            caption="Invoices"
            sort={controls.sort}
            onSortChange={controls.setSort}
            onRowClick={(invoice) => navigate(`/billing/${invoice.id}`)}
          />
        </Card>
      ) : (
        <div className="grid grid--3">
          {controls.rows.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              patient={data?.patientsById?.get(invoice.patient_id || invoice.patientId)}
            />
          ))}
        </div>
      )}

      {!loading && controls.rows.length > 0 && (
        <Pagination
          page={controls.page}
          pageCount={controls.pageCount}
          pageSize={controls.pageSize}
          total={controls.filteredCount}
          onChange={controls.setPage}
          itemLabel="invoices"
        />
      )}

      {formOpen && (
        <InvoiceFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          patients={data?.patients || []}
          doctors={data?.doctors || []}
          defaultPatientId={params.get("patientId") || undefined}
          onSaved={() => reload()}
        />
      )}
    </div>
  );
}

export default Billing;
