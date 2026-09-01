import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import BarChart from "../../components/charts/BarChart";
import BarList from "../../components/charts/BarList";
import ChartContainer from "../../components/charts/ChartContainer";
import DonutChart from "../../components/charts/DonutChart";
import LineChart from "../../components/charts/LineChart";
import StatusBadge from "../../components/domain/StatusBadge";
import { Identity } from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Banner, { Progress } from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DefList from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import PageHeader, { SectionHead } from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Select from "../../components/ui/Select";
import StatCard from "../../components/ui/StatCard";
import Table from "../../components/ui/Table";
import Tabs from "../../components/ui/Tabs";
import Toolbar from "../../components/ui/Toolbar";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/ui/States";
import { departmentLabel } from "../../constants/departments";
import { ROLES, ROLE_LABELS, ROLE_OPTIONS } from "../../constants/roles";
import { statusMeta } from "../../constants/statuses";
import { SERVICE_STATUS_META } from "../../mock/admin";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useTableControls from "../../hooks/useTableControls";
import adminService from "../../services/adminService";
import aiService from "../../services/aiService";
import dashboardService from "../../services/dashboardService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
} from "../../utils/format";

const ROLE_TONE = {
  [ROLES.ADMIN]: "critical",
  [ROLES.DOCTOR]: "accent",
  [ROLES.PATIENT]: "muted",
};

/**
 * Admin — the administration console.
 *
 * Tabbed rather than split across routes because every panel reads from the same
 * loaded snapshot; splitting would mean seven requests for one mental task.
 */
function Admin() {
  useDocumentTitle("Administration");

  const { role } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";

  const [pendingToggle, setPendingToggle] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        adminService.listUsers(),
        adminService.listAudit(),
        adminService.systemHealth(),
        dashboardService.overview(),
        patientsService.list(),
        doctorsService.list(),
        aiService.getUsage(),
      ]).then(([users, audit, services, metrics, patients, doctors, aiUsage]) => ({
        users,
        audit,
        services,
        metrics,
        patients,
        doctors,
        aiUsage,
      })),
    [],
  );

  const setTab = (value) => {
    const next = new URLSearchParams(params);
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);
    setParams(next, { replace: true });
  };

  const userControls = useTableControls(data?.users || [], {
    searchFields: ["name", "email", "id"],
    initialSort: { key: "lastActiveAt", direction: "desc" },
    initialFilters: { role: "all", active: "all" },
    sortAccessors: {
      name: (user) => user.name,
      lastActiveAt: (user) => user.lastActiveAt,
      createdAt: (user) => user.createdAt,
    },
    pageSize: 8,
  });

  const auditControls = useTableControls(data?.audit || [], {
    searchFields: ["actor", "action", "entity", "ip"],
    initialSort: { key: "at", direction: "desc" },
    initialFilters: { outcome: "all" },
    sortAccessors: { at: (entry) => entry.at },
    pageSize: 12,
  });

  // Administration is admin-only. This is a UI guard, not a security boundary —
  // the backend must enforce authorisation independently.
  if (role !== ROLES.ADMIN) {
    return (
      <div className="page">
        <PageHeader eyebrow="Administration" title="Restricted area" />
        <Card surface="soft">
          <EmptyState
            icon="lock"
            title="You do not have access"
            message="The administration console is limited to administrator accounts. Ask an administrator if you need access."
            actionLabel="Back to dashboard"
            actionIcon="dashboard"
            actionTo="/dashboard"
          />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Administration" title="Administration" />
        <ErrorState
          title="Console unavailable"
          message="Administration data could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const confirmToggle = async () => {
    setToggling(true);
    try {
      await adminService.setUserActive(pendingToggle.id, !pendingToggle.active);
      setNotice(
        `${pendingToggle.name} would be ${pendingToggle.active ? "deactivated" : "reactivated"}. User administration is not connected, so nothing changed.`,
      );
    } finally {
      setToggling(false);
      setPendingToggle(null);
    }
  };

  const userColumns = [
    {
      key: "name",
      header: "User",
      sortable: true,
      full: true,
      render: (user) => (
        <Identity name={user.name} meta={user.email} size="sm" square accent />
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge tone={ROLE_TONE[user.role]}>{ROLE_LABELS[user.role]}</Badge>
      ),
    },
    {
      key: "department",
      header: "Department",
      hideOn: "mobile",
      render: (user) =>
        user.department ? (
          <span className="t-label t-label--sm">{departmentLabel(user.department)}</span>
        ) : (
          <span className="t-muted">—</span>
        ),
    },
    {
      key: "mfaEnabled",
      header: "2FA",
      hideOn: "mobile",
      render: (user) =>
        user.mfaEnabled ? (
          <Badge tone="success" icon="shieldCheck">
            On
          </Badge>
        ) : (
          <Badge tone="warning" icon="alertTriangle">
            Off
          </Badge>
        ),
    },
    {
      key: "lastActiveAt",
      header: "Last active",
      sortable: true,
      hideOn: "mobile",
      render: (user) => (
        <span className="t-nowrap">{formatRelative(user.lastActiveAt)}</span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (user) => (
        <Badge tone={user.active ? "success" : "muted"} dot>
          {user.active ? "Active" : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      stackedLabel: "",
      render: (user) => (
        <Button
          size="sm"
          variant={user.active ? "ghost" : "outline"}
          onClick={() => setPendingToggle(user)}
        >
          {user.active ? "Disable" : "Enable"}
        </Button>
      ),
    },
  ];

  const auditColumns = [
    {
      key: "at",
      header: "When",
      sortable: true,
      render: (entry) => (
        <span className="t-mono t-muted t-nowrap">{formatDateTime(entry.at)}</span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      full: true,
      render: (entry) => (
        <div className="col col--gap-xxs">
          <span className="t-ink">{entry.actor}</span>
          <span className="t-caption">{entry.actorId || "unauthenticated"}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (entry) => <span className="t-mono t-strong">{entry.action}</span>,
    },
    {
      key: "entity",
      header: "Entity",
      hideOn: "mobile",
      render: (entry) => <span className="t-mono t-muted">{entry.entity}</span>,
    },
    {
      key: "ip",
      header: "Source",
      hideOn: "mobile",
      render: (entry) => <span className="t-mono t-muted">{entry.ip}</span>,
    },
    {
      key: "outcome",
      header: "Outcome",
      render: (entry) => (
        <Badge tone={entry.outcome === "success" ? "success" : "critical"}>
          {entry.outcome}
        </Badge>
      ),
    },
  ];

  const metrics = data?.metrics;
  const degraded = (data?.services || []).filter(
    (service) => service.status !== "operational",
  );
  const mfaGaps = (data?.users || []).filter(
    (user) => !user.mfaEnabled && user.role !== ROLES.PATIENT,
  );
  const failedAudit = (data?.audit || []).filter(
    (entry) => entry.outcome === "failure",
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Administration"
        title="Administration"
        lede="Accounts, analytics, audit trail and platform health."
        actions={
          <Button variant="outline" icon="refresh" onClick={reload}>
            Refresh
          </Button>
        }
      />

      {notice && (
        <Banner tone="accent" className="stack" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "users", label: "Users", count: data?.users?.length },
          { value: "clinicians", label: "Clinicians", count: data?.doctors?.length },
          { value: "patients", label: "Patients", count: data?.patients?.length },
          { value: "analytics", label: "Analytics" },
          { value: "audit", label: "Audit", count: data?.audit?.length },
          { value: "system", label: "System" },
        ]}
        className="stack"
      />

      <div style={{ marginTop: "var(--s-lg)" }}>
        {tab === "overview" && (
          <div className="col col--gap-lg">
            {degraded.length > 0 && (
              <Banner
                tone="warning"
                title={`${degraded.length} service${degraded.length === 1 ? "" : "s"} degraded`}
                action={
                  <Button size="sm" variant="outline" onClick={() => setTab("system")}>
                    Inspect
                  </Button>
                }
              >
                {degraded.map((service) => service.name).join(", ")}
              </Banner>
            )}

            {mfaGaps.length > 0 && (
              <Banner
                tone="critical"
                title={`${mfaGaps.length} staff accounts without two-factor authentication`}
                action={
                  <Button size="sm" variant="danger" onClick={() => setTab("users")}>
                    Review
                  </Button>
                }
              >
                Accounts with clinical record access should require a second factor:{" "}
                {mfaGaps.map((user) => user.name).join(", ")}.
              </Banner>
            )}

            <section className="grid grid--4">
              {loading ? (
                Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} variant="block" height={126} />
                ))
              ) : (
                <>
                  <StatCard
                    label="Total accounts"
                    value={data.users.length}
                    icon="patients"
                    footnote={`${data.users.filter((u) => u.active).length} active`}
                  />
                  <StatCard
                    label="Clinicians"
                    value={data.doctors.length}
                    icon="doctors"
                    footnote="Across 11 departments"
                    to="/doctors"
                  />
                  <StatCard
                    label="Patients"
                    value={formatNumber(metrics.stats.activePatients.value)}
                    icon="patients"
                    delta={metrics.stats.activePatients.delta}
                    deltaLabel="vs last month"
                    to="/patients"
                  />
                  <StatCard
                    label="Revenue this month"
                    value={formatCurrency(metrics.stats.revenueMonth.value, {
                      compact: true,
                    })}
                    icon="billing"
                    delta={metrics.stats.revenueMonth.delta}
                    deltaLabel="vs last month"
                  />
                  <StatCard
                    label="Audit events"
                    value={data.audit.length}
                    icon="shieldCheck"
                    footnote={`${failedAudit.length} failures`}
                  />
                  <StatCard
                    label="Services operational"
                    value={`${data.services.length - degraded.length}/${data.services.length}`}
                    icon="cpu"
                  />
                  <StatCard
                    label="AI requests"
                    value={formatNumber(data.aiUsage.requests.used)}
                    icon="ai"
                    footnote={`of ${formatNumber(data.aiUsage.requests.limit)} quota`}
                    to="/ai/usage"
                  />
                  <StatCard
                    label="Bed occupancy"
                    value={metrics.stats.occupancyRate.value}
                    unit="%"
                    icon="bed"
                    delta={metrics.stats.occupancyRate.delta}
                    deltaLabel="vs last week"
                  />
                </>
              )}
            </section>

            <div className="grid grid--split">
              <ChartContainer
                title="Appointments by month"
                subtitle="All departments"
                loading={loading}
              >
                {metrics && <BarChart data={metrics.appointmentsSeries} height={230} />}
              </ChartContainer>

              <ChartContainer
                title="Department load"
                subtitle="Active patients"
                loading={loading}
              >
                {metrics && (
                  <BarList
                    data={metrics.departmentLoad}
                    valueFormatter={(value) => formatNumber(value)}
                  />
                )}
              </ChartContainer>
            </div>
          </div>
        )}

        {tab === "users" && (
          <>
            <Toolbar
              search={userControls.search}
              onSearchChange={userControls.setSearch}
              searchPlaceholder="Search accounts by name, email or ID"
              filters={
                <>
                  <Select
                    size="sm"
                    options={[{ value: "all", label: "All roles" }, ...ROLE_OPTIONS]}
                    value={userControls.filters.role}
                    onChange={(event) => userControls.setFilter("role", event.target.value)}
                    aria-label="Filter by role"
                  />
                  <Select
                    size="sm"
                    options={[
                      { value: "all", label: "Any status" },
                      { value: "true", label: "Active" },
                      { value: "false", label: "Disabled" },
                    ]}
                    value={userControls.filters.active}
                    onChange={(event) =>
                      userControls.setFilter("active", event.target.value)
                    }
                    aria-label="Filter by account status"
                  />
                  {userControls.isFiltered && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="close"
                      onClick={userControls.resetFilters}
                    >
                      Clear
                    </Button>
                  )}
                </>
              }
            />

            {loading ? (
              <Card surface="soft">
                <CardBody>
                  <SkeletonRows rows={6} />
                </CardBody>
              </Card>
            ) : userControls.rows.length === 0 ? (
              <Card surface="soft">
                <EmptyState
                  icon="search"
                  title="No accounts match"
                  message="Try a different role or clear the filters."
                  secondary={
                    <Button variant="outline" icon="close" onClick={userControls.resetFilters}>
                      Clear filters
                    </Button>
                  }
                />
              </Card>
            ) : (
              <Card surface="soft">
                <Table
                  columns={userColumns}
                  rows={userControls.rows}
                  caption="Platform accounts"
                  sort={userControls.sort}
                  onSortChange={userControls.setSort}
                />
              </Card>
            )}

            {!loading && userControls.rows.length > 0 && (
              <Pagination
                page={userControls.page}
                pageCount={userControls.pageCount}
                pageSize={userControls.pageSize}
                total={userControls.filteredCount}
                onChange={userControls.setPage}
                itemLabel="accounts"
              />
            )}

            <Banner tone="accent" icon="info" className="stack">
              Role and permission changes are not implemented: the backend contract
              for user administration is not defined yet, and inventing one would put
              fake authorisation behaviour in the UI.
            </Banner>
          </>
        )}

        {tab === "clinicians" && (
          <Card surface="soft">
            <CardHead
              title="Clinician management"
              subtitle={`${data?.doctors?.length || 0} clinicians`}
              actions={
                <Button size="sm" variant="outline" to="/doctors" iconEnd="arrowRight">
                  Full directory
                </Button>
              }
            />
            <CardBody padding="none">
              {loading ? (
                <div style={{ padding: "var(--s-md)" }}>
                  <SkeletonRows rows={6} />
                </div>
              ) : (
                <div className="list">
                  {data.doctors.map((doctor) => (
                    <Link
                      key={doctor.id}
                      to={`/doctors/${doctor.id}`}
                      className="list__row list__row--link"
                    >
                      <Identity
                        name={doctor.name}
                        meta={`${doctor.specialisation} · ${departmentLabel(doctor.department)}`}
                        size="sm"
                        square
                        accent
                        status={doctor.status}
                      />
                      <span className="grow" />
                      <span className="t-caption hide-mobile t-nowrap">
                        {doctor.patientsUnderCare} patients
                      </span>
                      <Badge tone={doctor.acceptingNew ? "success" : "muted"}>
                        {doctor.acceptingNew ? "Open" : "Closed"}
                      </Badge>
                      <Icon name="chevronRight" size={14} className="t-muted" />
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {tab === "patients" && (
          <div className="col col--gap-lg">
            <section className="grid grid--4">
              {loading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} variant="block" height={110} />
                ))
              ) : (
                <>
                  <StatCard label="Total records" value={data.patients.length} icon="patients" />
                  <StatCard
                    label="Admitted"
                    value={data.patients.filter((p) => p.status === "admitted").length}
                    icon="bed"
                  />
                  <StatCard
                    label="High risk"
                    value={
                      data.patients.filter((p) =>
                        ["critical", "urgent"].includes(p.riskLevel),
                      ).length
                    }
                    icon="alertTriangle"
                  />
                  <StatCard
                    label="Inactive"
                    value={data.patients.filter((p) => p.status === "inactive").length}
                    icon="history"
                  />
                </>
              )}
            </section>

            <Card surface="soft">
              <CardHead
                title="Patient overview"
                subtitle="Highest clinical risk first"
                actions={
                  <Button size="sm" variant="outline" to="/patients" iconEnd="arrowRight">
                    Full directory
                  </Button>
                }
              />
              <CardBody padding="none">
                {loading ? (
                  <div style={{ padding: "var(--s-md)" }}>
                    <SkeletonRows rows={6} />
                  </div>
                ) : (
                  <div className="list">
                    {[...data.patients]
                      .sort(
                        (a, b) =>
                          ["routine", "moderate", "urgent", "critical"].indexOf(
                            b.riskLevel,
                          ) -
                          ["routine", "moderate", "urgent", "critical"].indexOf(
                            a.riskLevel,
                          ),
                      )
                      .slice(0, 10)
                      .map((patient) => (
                        <Link
                          key={patient.id}
                          to={`/patients/${patient.id}`}
                          className="list__row list__row--link"
                        >
                          <Identity
                            name={patient.name}
                            meta={patient.mrn}
                            size="sm"
                            square
                            accent
                          />
                          <span className="grow" />
                          <StatusBadge kind="patient" value={patient.status} />
                          <StatusBadge kind="severity" value={patient.riskLevel} />
                          <Icon name="chevronRight" size={14} className="t-muted" />
                        </Link>
                      ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {tab === "analytics" && (
          <div className="col col--gap-lg">
            <div className="grid grid--split">
              <ChartContainer
                title="Revenue"
                subtitle="Last 6 months"
                loading={loading}
              >
                {metrics && (
                  <LineChart
                    data={metrics.revenueSeries}
                    valueFormatter={(value) => formatCurrency(value, { compact: true })}
                    height={240}
                  />
                )}
              </ChartContainer>

              <ChartContainer
                title="Appointment outcomes"
                subtitle="Last 90 days"
                loading={loading}
              >
                {metrics && (
                  <DonutChart
                    data={metrics.appointmentOutcome}
                    centerValue={formatNumber(
                      metrics.appointmentOutcome.reduce((sum, e) => sum + e.value, 0),
                    )}
                    centerLabel="Total"
                  />
                )}
              </ChartContainer>
            </div>

            <div className="grid grid--split">
              <ChartContainer
                title="Weekly load"
                subtitle="Appointments per day"
                loading={loading}
              >
                {metrics && (
                  <BarChart data={metrics.weeklyLoad} highlightLast height={230} />
                )}
              </ChartContainer>

              <ChartContainer
                title="Revenue by payment method"
                subtitle="Current month"
                loading={loading}
              >
                {metrics && (
                  <BarList
                    data={metrics.revenueByMethod}
                    valueFormatter={(value) => formatCurrency(value, { compact: true })}
                  />
                )}
              </ChartContainer>
            </div>

            <ChartContainer
              title="AI usage"
              subtitle="Requests per day, last 7 days"
              loading={loading}
              footer={
                <CardFoot>
                  <Link to="/ai/usage" className="text-link text-link--sm">
                    Full AI usage report
                    <Icon name="arrowRight" size={13} />
                  </Link>
                </CardFoot>
              }
            >
              {data?.aiUsage && <BarChart data={data.aiUsage.dailySeries} height={210} />}
            </ChartContainer>
          </div>
        )}

        {tab === "audit" && (
          <>
            <Toolbar
              search={auditControls.search}
              onSearchChange={auditControls.setSearch}
              searchPlaceholder="Search by actor, action, entity or IP"
              filters={
                <>
                  <Select
                    size="sm"
                    options={[
                      { value: "all", label: "Any outcome" },
                      { value: "success", label: "Success" },
                      { value: "failure", label: "Failure" },
                    ]}
                    value={auditControls.filters.outcome}
                    onChange={(event) =>
                      auditControls.setFilter("outcome", event.target.value)
                    }
                    aria-label="Filter by outcome"
                  />
                  {auditControls.isFiltered && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="close"
                      onClick={auditControls.resetFilters}
                    >
                      Clear
                    </Button>
                  )}
                </>
              }
              trailing={
                <Button size="sm" variant="outline" icon="download">
                  Export
                </Button>
              }
            />

            {failedAudit.length > 0 && (
              <Banner
                tone="warning"
                title={`${failedAudit.length} failed events in this window`}
                className="stack"
              >
                Failed sign-ins and rejected uploads are retained for security
                review.
              </Banner>
            )}

            {loading ? (
              <Card surface="soft">
                <CardBody>
                  <SkeletonRows rows={8} />
                </CardBody>
              </Card>
            ) : auditControls.rows.length === 0 ? (
              <Card surface="soft">
                <EmptyState
                  icon="search"
                  title="No audit events match"
                  message="Try a different search or clear the outcome filter."
                  secondary={
                    <Button variant="outline" icon="close" onClick={auditControls.resetFilters}>
                      Clear filters
                    </Button>
                  }
                />
              </Card>
            ) : (
              <Card surface="soft">
                <Table
                  columns={auditColumns}
                  rows={auditControls.rows}
                  caption="Audit trail"
                  sort={auditControls.sort}
                  onSortChange={auditControls.setSort}
                />
              </Card>
            )}

            {!loading && auditControls.rows.length > 0 && (
              <Pagination
                page={auditControls.page}
                pageCount={auditControls.pageCount}
                pageSize={auditControls.pageSize}
                total={auditControls.filteredCount}
                onChange={auditControls.setPage}
                itemLabel="events"
              />
            )}
          </>
        )}

        {tab === "system" && (
          <div className="col col--gap-lg">
            <SectionHead
              title="Service health"
              meta={
                degraded.length === 0
                  ? "All services operational"
                  : `${degraded.length} degraded`
              }
            />

            {loading ? (
              <div className="grid grid--2">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} variant="block" height={140} />
                ))}
              </div>
            ) : (
              <div className="grid grid--2">
                {data.services.map((service) => {
                  const meta = statusMeta(SERVICE_STATUS_META, service.status);

                  return (
                    <Card
                      key={service.id}
                      surface="soft"
                      tone={service.status !== "operational" ? "critical" : undefined}
                    >
                      <CardBody padding="tight">
                        <div className="col col--gap-sm">
                          <div className="row row--between row--top">
                            <div className="col col--gap-xxs">
                              <span className="t-data t-ink">{service.name}</span>
                              <span className="t-caption">{service.detail}</span>
                            </div>
                            <Badge tone={meta.tone} dot>
                              {meta.label}
                            </Badge>
                          </div>

                          <div className="divider" />

                          <div className="row row--between">
                            <span className="t-caption">Uptime</span>
                            <span className="t-data t-ink t-tabular">
                              {formatPercent(service.uptime, 2)}
                            </span>
                          </div>
                          <Progress
                            value={service.uptime}
                            tone={service.uptime >= 99.9 ? "success" : "warning"}
                            label={`${service.name} uptime`}
                          />

                          <div className="row row--between">
                            <span className="t-caption">Median latency</span>
                            <span className="t-data t-ink t-tabular">
                              {service.latencyMs} ms
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card surface="soft">
              <CardHead title="AI and retrieval" subtitle="Quota for the current period" />
              <CardBody>
                {loading ? (
                  <SkeletonRows rows={3} />
                ) : (
                  <div className="col col--gap-md">
                    <QuotaRow
                      label="Requests"
                      used={data.aiUsage.requests.used}
                      limit={data.aiUsage.requests.limit}
                    />
                    <QuotaRow
                      label="Tokens"
                      used={data.aiUsage.tokens.used}
                      limit={data.aiUsage.tokens.limit}
                    />
                    <QuotaRow
                      label="Retrieval queries"
                      used={data.aiUsage.retrievalQueries.used}
                      limit={data.aiUsage.retrievalQueries.limit}
                    />
                  </div>
                )}
              </CardBody>
              <CardFoot>
                <Link to="/ai/usage" className="text-link text-link--sm">
                  Full AI usage report
                  <Icon name="arrowRight" size={13} />
                </Link>
              </CardFoot>
            </Card>

            <Card surface="soft">
              <CardHead title="Environment" />
              <CardBody>
                <DefList
                  items={[
                    { label: "Frontend", value: "React 19 · Vite" },
                    { label: "Backend", value: "FastAPI (connected)" },
                    { label: "Data source", value: "FastAPI / SQLite" },
                    { label: "AI service", value: "FastAPI AI Subsystem" },
                  ]}
                />
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        onClose={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
        loading={toggling}
        tone={pendingToggle?.active ? "danger" : "default"}
        title={pendingToggle?.active ? "Disable account" : "Enable account"}
        message={
          pendingToggle
            ? `${pendingToggle.active ? "Disable" : "Enable"} access for ${pendingToggle.name}?`
            : ""
        }
        detail={
          pendingToggle?.active
            ? "The user will be signed out and unable to sign in again until re-enabled. This is recorded in the audit trail."
            : "The user will be able to sign in again immediately."
        }
        confirmLabel={pendingToggle?.active ? "Disable account" : "Enable account"}
      />
    </div>
  );
}

/** Quota read-out with a proportional bar; warns as the limit approaches. */
function QuotaRow({ label, used, limit }) {
  const ratio = limit > 0 ? (used / limit) * 100 : 0;

  return (
    <div className="col col--gap-xs">
      <div className="row row--between">
        <span className="t-caption">{label}</span>
        <span className="t-data t-ink t-tabular">
          {formatNumber(used)}{" "}
          <span className="t-muted">/ {formatNumber(limit)}</span>
        </span>
      </div>
      <Progress
        value={ratio}
        tone={ratio > 90 ? "critical" : ratio > 70 ? "warning" : "accent"}
        label={`${label} quota used`}
      />
    </div>
  );
}

export default Admin;
