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
import { prescriptionsService } from "../../services/clinicalService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { formatDate, truncate } from "../../utils/format";

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
          ? prescriptionsService.listByPatient(user?.patientId || user?.id)
          : role === ROLES.DOCTOR
            ? prescriptionsService.listByDoctor(user?.doctorId || user?.id)
            : prescriptionsService.list(),
        patientsService.list().catch(() => []),
        doctorsService.list().catch(() => []),
      ]).then(([rawPrescriptions, rawPatients, rawDoctors]) => {
        const prescriptionList = Array.isArray(rawPrescriptions) ? rawPrescriptions : rawPrescriptions?.items || [];
        const patientList = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
        const doctorList = Array.isArray(rawDoctors?.items) ? rawDoctors.items : Array.isArray(rawDoctors) ? rawDoctors : [];

        return {
          prescriptions: prescriptionList,
          patients: patientList,
          doctors: doctorList,
          patientsById: new Map(patientList.map((patient) => [patient.id, patient])),
          doctorsById: new Map(doctorList.map((doctor) => [doctor.id, doctor])),
        };
      }),
    [role, user?.patientId, user?.doctorId, user?.id],
  );

  const controls = useTableControls(data?.prescriptions || [], {
    searchFields: [
      "diagnosis",
      "status",
      (rx) => (rx.prescription_items || rx.items || []).map((item) => item.medicine_name || item.name).join(" "),
      (rx) => data?.patientsById.get(rx.patient_id || rx.patientId)?.name,
    ],
    initialSort: { key: "prescription_date", direction: "desc" },
    initialFilters: {
      status: params.get("status") || "all",
      doctorId: params.get("doctorId") || "all",
      patientId: params.get("patientId") || "all",
    },
    sortAccessors: {
      prescription_date: (rx) => rx.prescription_date || rx.created_at || rx.issuedAt,
    },
    pageSize: 10,
  });

  const columns = [
    {
      key: "id",
      header: "Reference",
      render: (rx) => (
        <span className="t-mono t-ink">#{rx.id}</span>
      ),
    },
    {
      key: "patient_id",
      header: "Patient",
      full: true,
      render: (rx) => {
        const patient = data?.patientsById.get(rx.patient_id || rx.patientId);
        return (
          <Identity
            name={patient?.name || `Patient #${rx.patient_id || rx.patientId}`}
            meta={patient?.mobile_no}
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
      render: (rx) => {
        const itemList = rx.prescription_items || rx.items || [];
        const leadMed = itemList[0]?.medicine_name || itemList[0]?.name || "Medication";
        return (
          <div className="col col--gap-xxs">
            <span className="t-ink">
              {truncate(leadMed, 34)}
              {itemList.length > 1 && (
                <span className="t-muted"> +{itemList.length - 1} more</span>
              )}
            </span>
            <span className="t-caption">
              {itemList.length} item{itemList.length === 1 ? "" : "s"}
            </span>
          </div>
        );
      },
    },
    {
      key: "doctor_id",
      header: "Prescriber",
      hideOn: "mobile",
      render: (rx) => (
        <span className="t-truncate" style={{ display: "block", maxWidth: 160 }}>
          {data?.doctorsById.get(rx.doctor_id || rx.doctorId)?.name || `Doctor #${rx.doctor_id || rx.doctorId}`}
        </span>
      ),
    },
    {
      key: "prescription_date",
      header: "Prescribed Date",
      sortable: true,
      hideOn: "mobile",
      render: (rx) => (
        <span className="t-nowrap">{formatDate(rx.prescription_date || rx.created_at || rx.issuedAt)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (rx) => (
        <StatusBadge kind="prescription" value={rx.status || "active"} />
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

  const allRx = data?.prescriptions || [];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinical"
        title="Prescriptions"
        lede={
          role === ROLES.PATIENT
            ? "Medications prescribed to you, with dosage and duration."
            : "Prescriptions issued across patients."
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
              label="Active Prescriptions"
              value={allRx.filter((r) => (r.status || "").toLowerCase() === "active").length}
              icon="prescriptions"
            />
            <StatCard
              label="Completed"
              value={allRx.filter((r) => (r.status || "").toLowerCase() === "completed").length}
              icon="checkCircle"
            />
            <StatCard
              label="Total Prescriptions"
              value={allRx.length}
              icon="layers"
            />
            <StatCard
              label="Total Items"
              value={allRx.reduce((acc, r) => acc + (r.prescription_items || r.items || []).length, 0)}
              icon="layers"
            />
          </>
        )}
      </section>

      <Toolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by reference, medication or diagnosis"
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
        </Card>
      ) : view === "table" ? (
        <Card surface="soft">
          <Table
            columns={columns}
            rows={controls.rows}
            caption="Prescriptions"
            sort={controls.sort}
            onSortChange={controls.setSort}
            onRowClick={(rx) => navigate(`/prescriptions/${rx.id}`)}
          />
        </Card>
      ) : (
        <div className="col col--gap-lg">
          {controls.rows.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              prescription={rx}
              patient={data?.patientsById?.get(rx.patient_id || rx.patientId)}
              doctor={data?.doctorsById?.get(rx.doctor_id || rx.doctorId)}
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
