import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import BarList from "../../components/charts/BarList";
import ChartContainer from "../../components/charts/ChartContainer";
import InvoiceCard from "../../components/domain/InvoiceCard";
import StatusBadge from "../../components/domain/StatusBadge";
import { Identity } from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card, { CardBody } from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
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
import {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_META,
  optionLabel,
  statusOptions,
} from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import billingService from "../../services/billingService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { groupBy, sumBy } from "../../utils/collection";
import { formatCurrency, formatDate } from "../../utils/format";
import InvoiceFormModal from "./InvoiceFormModal";

/**
 * Billing — the invoice index.
 *
 * Outstanding balance leads, because it is the only figure that implies action.
 * Collected revenue is shown alongside it for context, not as the headline.
 */
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
          ? billingService.listByPatient(user.patientId)
          : billingService.list(),
        patientsService.list(),
        doctorsService.list(),
      ]).then(([invoices, patients, doctors]) => ({
        invoices,
        patients,
        doctors,
        patientsById: new Map(patients.map((patient) => [patient.id, patient])),
      })),
    [role, user?.patientId],
  );

  const controls = useTableControls(data?.invoices || [], {
    searchFields: [
      "invoiceNo",
      (invoice) => data?.patientsById.get(invoice.patientId)?.name,
      (invoice) => invoice.items.map((item) => item.description).join(" "),
    ],
    initialSort: { key: "issuedAt", direction: "desc" },
    initialFilters: {
      status: params.get("status") || "all",
      method: "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      issuedAt: (invoice) => invoice.issuedAt,
      dueAt: (invoice) => invoice.dueAt,
      total: (invoice) => invoice.total,
      outstanding: (invoice) => invoice.total - invoice.amountPaid,
    },
    pageSize: 10,
  });

  const invoices = data?.invoices || [];

  const outstanding = sumBy(invoices, (invoice) =>
    Math.max(0, invoice.total - invoice.amountPaid),
  );
  const collected = sumBy(invoices, "amountPaid");
  const overdue = invoices.filter(
    (invoice) => invoice.status === PAYMENT_STATUS.OVERDUE,
  );

  const byMethod = [...groupBy(
    invoices.filter((invoice) => invoice.method),
    "method",
  ).entries()].map(([method, list]) => ({
    label: optionLabel(PAYMENT_METHODS, method),
    value: sumBy(list, "amountPaid"),
  }));

  const columns = [
    {
      key: "invoiceNo",
      header: "Invoice",
      render: (invoice) => <span className="t-mono t-ink">{invoice.invoiceNo}</span>,
    },
    {
      key: "patientId",
      header: "Patient",
      full: true,
      render: (invoice) => {
        const patient = data?.patientsById.get(invoice.patientId);
        return (
          <Identity
            name={patient?.name || "Unknown"}
            meta={patient?.mrn}
            size="sm"
            square
            accent
          />
        );
      },
    },
    {
      key: "issuedAt",
      header: "Issued",
      sortable: true,
      hideOn: "mobile",
      render: (invoice) => (
        <span className="t-nowrap">{formatDate(invoice.issuedAt)}</span>
      ),
    },
    {
      key: "dueAt",
      header: "Due",
      sortable: true,
      hideOn: "mobile",
      render: (invoice) => (
        <span
          className={
            invoice.status === PAYMENT_STATUS.OVERDUE
              ? "t-critical t-nowrap"
              : "t-nowrap"
          }
        >
          {formatDate(invoice.dueAt)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      align: "right",
      render: (invoice) => formatCurrency(invoice.total),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      sortable: true,
      align: "right",
      render: (invoice) => {
        const value = Math.max(0, invoice.total - invoice.amountPaid);
        return (
          <span className={value > 0 ? "t-ink" : "t-success"}>
            {formatCurrency(value)}
          </span>
        );
      },
    },
    {
      key: "method",
      header: "Method",
      hideOn: "mobile",
      render: (invoice) =>
        invoice.method ? (
          optionLabel(PAYMENT_METHODS, invoice.method)
        ) : (
          <span className="t-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (invoice) => <StatusBadge kind="payment" value={invoice.status} />,
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
            ? "Your invoices, what has been paid and what is still due."
            : "Invoices raised, collected revenue and outstanding balances."
        }
        actions={
          role !== ROLES.PATIENT && (
            <>
              <Button variant="outline" icon="download">
                Export
              </Button>
              <Button variant="primary" icon="plus" onClick={() => setFormOpen(true)}>
                Raise invoice
              </Button>
            </>
          )
        }
      />

      <section className="grid grid--4" style={{ marginBottom: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="block" height={126} />
          ))
        ) : (
          <>
            <StatCard
              label="Outstanding"
              value={formatCurrency(outstanding)}
              icon="billing"
              footnote={`${invoices.filter((i) => i.total - i.amountPaid > 0).length} invoices`}
            />
            <StatCard
              label="Collected"
              value={formatCurrency(collected)}
              icon="checkCircle"
              footnote="Across all listed invoices"
            />
            <StatCard
              label="Overdue"
              value={overdue.length}
              icon="alertTriangle"
              footnote={formatCurrency(
                sumBy(overdue, (invoice) => invoice.total - invoice.amountPaid),
              )}
            />
            <StatCard
              label="Invoices"
              value={invoices.length}
              icon="creditCard"
              footnote={`${invoices.filter((i) => i.status === PAYMENT_STATUS.PAID).length} settled`}
            />
          </>
        )}
      </section>

      {overdue.length > 0 && role !== ROLES.PATIENT && (
        <div className="banner banner--critical stack">
          <span className="banner__icon" aria-hidden="true">
            <Icon name="alertTriangle" size={16} />
          </span>
          <div className="grow">
            <span className="banner__title">
              {overdue.length} invoice{overdue.length === 1 ? "" : "s"} overdue
            </span>
            <div>
              {formatCurrency(
                sumBy(overdue, (invoice) => invoice.total - invoice.amountPaid),
              )}{" "}
              past its payment terms.
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => controls.setFilter("status", PAYMENT_STATUS.OVERDUE)}
          >
            Show overdue
          </Button>
        </div>
      )}

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by invoice number, patient or charge"
        filters={
          <>
            <Select
              size="sm"
              options={[
                { value: "all", label: "All statuses" },
                ...statusOptions(PAYMENT_STATUS_META),
              ]}
              value={controls.filters.status}
              onChange={(event) => controls.setFilter("status", event.target.value)}
              aria-label="Filter by status"
            />
            <Select
              size="sm"
              options={[{ value: "all", label: "All methods" }, ...PAYMENT_METHODS]}
              value={controls.filters.method}
              onChange={(event) => controls.setFilter("method", event.target.value)}
              aria-label="Filter by payment method"
            />
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
          {controls.isFiltered ? (
            <EmptyState
              icon="search"
              title="No invoices match"
              message="Nothing found for the current search and filters."
              secondary={
                <Button variant="outline" icon="close" onClick={controls.resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
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
          )}
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
              patient={data.patientsById.get(invoice.patientId)}
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

      {!loading && byMethod.length > 0 && role !== ROLES.PATIENT && (
        <section className="section">
          <ChartContainer
            title="Collected by payment method"
            subtitle="Across the invoices listed above"
          >
            <BarList
              data={byMethod}
              valueFormatter={(value) => formatCurrency(value)}
            />
          </ChartContainer>
        </section>
      )}

      {formOpen && (
        <InvoiceFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          patients={data?.patients || []}
          doctors={data?.doctors || []}
          defaultPatientId={params.get("patientId") || undefined}
        />
      )}
    </div>
  );
}

export default Billing;
