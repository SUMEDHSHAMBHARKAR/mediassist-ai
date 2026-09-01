import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import PrescriptionCard from "../../components/domain/PrescriptionCard";
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
import { RX_STATUS, RX_STATUS_META, statusOptions } from "../../constants/statuses";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import { prescriptionsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatDate, truncate } from "../../utils/format";

/**
 * Prescriptions — the prescribing index.
 *
 * A prescription is a container of medication items, so the list surfaces the
 * item count and the leading medication rather than a single "drug" column.
 */
function Prescriptions() {
  useDocumentTitle("Prescriptions");

  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [params] = useSearchParams();

  const [view, setView] = useState("table");

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        role === ROLES.PATIENT
          ? prescriptionsService.listByPatient(user.patientId)
          : role === ROLES.DOCTOR
            ? prescriptionsService.listByDoctor(user.doctorId)
            : prescriptionsService.list(),
        patientsService.list(),
        doctorsService.list(),
      ]).then(([prescriptions, patients, doctors]) => ({
        prescriptions,
        patients,
        doctors,
        patientsById: new Map(patients.map((patient) => [patient.id, patient])),
        doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
      })),
    [role, user?.patientId, user?.doctorId],
  );

  const controls = useTableControls(data?.prescriptions || [], {
    searchFields: [
      "code",
      "notes",
      (prescription) => prescription.items.map((item) => item.name).join(" "),
      (prescription) => data?.patientsById.get(prescription.patientId)?.name,
    ],
    initialSort: { key: "issuedAt", direction: "desc" },
    initialFilters: {
      status: params.get("status") || "all",
      doctorId: params.get("doctorId") || "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      issuedAt: (prescription) => prescription.issuedAt,
      validUntil: (prescription) => prescription.validUntil,
      items: (prescription) => prescription.items.length,
    },
    pageSize: 10,
  });

  const counts = (data?.prescriptions || []).reduce((acc, prescription) => {
    acc[prescription.status] = (acc[prescription.status] || 0) + 1;
    return acc;
  }, {});

  const columns = [
    {
      key: "code",
      header: "Reference",
      render: (prescription) => (
        <span className="t-mono t-ink">{prescription.code}</span>
      ),
    },
    {
      key: "patientId",
      header: "Patient",
      full: true,
      render: (prescription) => {
        const patient = data?.patientsById.get(prescription.patientId);
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
      key: "items",
      header: "Medications",
      sortable: true,
      render: (prescription) => (
        <div className="col col--gap-xxs">
          <span className="t-ink">
            {truncate(prescription.items[0]?.name || "—", 34)}
            {prescription.items.length > 1 && (
              <span className="t-muted"> +{prescription.items.length - 1} more</span>
            )}
          </span>
          <span className="t-caption">
            {prescription.items.length} item
            {prescription.items.length === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      key: "doctorId",
      header: "Prescriber",
      hideOn: "mobile",
      render: (prescription) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 160 }}>
          {data?.doctorsById.get(prescription.doctorId)?.name || "—"}
        </span>
      ),
    },
    {
      key: "issuedAt",
      header: "Issued",
      sortable: true,
      hideOn: "mobile",
      render: (prescription) => (
        <span className="t-nowrap">{formatDate(prescription.issuedAt)}</span>
      ),
    },
    {
      key: "validUntil",
      header: "Valid to",
      sortable: true,
      hideOn: "mobile",
      render: (prescription) => (
        <span className="t-nowrap">{formatDate(prescription.validUntil)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (prescription) => (
        <StatusBadge kind="prescription" value={prescription.status} />
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
        <PageHeader eyebrow="Clinical" title="Prescriptions" />
        <ErrorState
          title="Prescriptions unavailable"
          message="Prescribing records could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinical"
        title="Prescriptions"
        lede={
          role === ROLES.PATIENT
            ? "Medications prescribed to you, with dosage and duration."
            : "Prescriptions issued, with their medication lists and validity."
        }
        actions={
          role !== ROLES.PATIENT && (
            <Button variant="primary" icon="plus" to="/prescriptions/new">
              Write prescription
            </Button>
          )
        }
      />

      <section className="grid grid--4" style={{ marginBottom: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="block" height={110} />
          ))
        ) : (
          <>
            <StatCard
              label="Active"
              value={counts[RX_STATUS.ACTIVE] || 0}
              icon="prescriptions"
            />
            <StatCard
              label="Completed"
              value={counts[RX_STATUS.COMPLETED] || 0}
              icon="checkCircle"
            />
            <StatCard
              label="Discontinued"
              value={counts[RX_STATUS.DISCONTINUED] || 0}
              icon="xCircle"
            />
            <StatCard
              label="Total medications"
              value={(data?.prescriptions || []).reduce(
                (sum, prescription) => sum + prescription.items.length,
                0,
              )}
              icon="layers"
            />
          </>
        )}
      </section>

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by reference, medication or patient"
        filters={
          <>
            <Select
              size="sm"
              options={[
                { value: "all", label: "All statuses" },
                ...statusOptions(RX_STATUS_META),
              ]}
              value={controls.filters.status}
              onChange={(event) => controls.setFilter("status", event.target.value)}
              aria-label="Filter by status"
            />
            {role === ROLES.ADMIN && (
              <Select
                size="sm"
                options={[
                  { value: "all", label: "All prescribers" },
                  ...(data?.doctors || []).map((doctor) => ({
                    value: doctor.id,
                    label: doctor.name,
                  })),
                ]}
                value={controls.filters.doctorId}
                onChange={(event) => controls.setFilter("doctorId", event.target.value)}
                aria-label="Filter by prescriber"
              />
            )}
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
              { value: "cards", label: "Detail", icon: "grid" },
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
              title="No prescriptions match"
              message="Nothing found for the current search and filters."
              secondary={
                <Button variant="outline" icon="close" onClick={controls.resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="prescriptions"
              title="No prescriptions"
              message={
                role === ROLES.PATIENT
                  ? "Medications prescribed by your care team will appear here."
                  : "Write a prescription to add medications for a patient."
              }
              actionLabel={role === ROLES.PATIENT ? undefined : "Write prescription"}
              actionIcon="plus"
              actionTo="/prescriptions/new"
            />
          )}
        </Card>
      ) : view === "table" ? (
        <Card surface="soft">
          <Table
            columns={columns}
            rows={controls.rows}
            caption="Prescriptions"
            sort={controls.sort}
            onSortChange={controls.setSort}
            onRowClick={(prescription) => navigate(`/prescriptions/${prescription.id}`)}
          />
        </Card>
      ) : (
        <div className="col col--gap-lg">
          {controls.rows.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              patient={data.patientsById.get(prescription.patientId)}
              doctor={data.doctorsById.get(prescription.doctorId)}
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
          itemLabel="prescriptions"
        />
      )}
    </div>
  );
}

export default Prescriptions;
