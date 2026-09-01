import { useState } from "react";
import { Link } from "react-router-dom";

import BarChart from "../../components/charts/BarChart";
import BarList from "../../components/charts/BarList";
import ChartContainer from "../../components/charts/ChartContainer";
import DonutChart from "../../components/charts/DonutChart";
import LineChart from "../../components/charts/LineChart";
import ActivityFeed from "../../components/domain/ActivityFeed";
import QuickActions from "../../components/domain/QuickActions";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader, { SectionHead } from "../../components/ui/PageHeader";
import { Segmented } from "../../components/ui/Tabs";
import StatCard from "../../components/ui/StatCard";
import {
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/ui/States";
import { SERVICE_STATUS_META } from "../../mock/admin";
import useAsyncData from "../../hooks/useAsyncData";
import adminService from "../../services/adminService";
import dashboardService from "../../services/dashboardService";
import { statusMeta } from "../../constants/statuses";
import { formatCurrency, formatNumber, formatPercent } from "../../utils/format";

const QUICK_ACTIONS = [
  { label: "User management", sub: "Accounts and roles", icon: "patients", to: "/admin?tab=users" },
  { label: "Audit log", sub: "Every recorded action", icon: "shieldCheck", to: "/admin?tab=audit" },
  { label: "Analytics", sub: "Volume and revenue", icon: "analytics", to: "/admin?tab=analytics" },
  { label: "AI usage", sub: "Quota and latency", icon: "ai", to: "/ai/usage" },
];

/**
 * AdminDashboard — operational overview for the whole organisation.
 *
 * Leads with the numbers an administrator is accountable for, then service
 * health, then the trends behind them.
 */
function AdminDashboard() {
  const [revenueView, setRevenueView] = useState("monthly");

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        dashboardService.overview(),
        adminService.systemHealth(),
        dashboardService.activity(7),
      ]).then(([metrics, services, activity]) => ({ metrics, services, activity })),
    [],
  );

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title="Overview unavailable"
          message="Organisation metrics could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const metrics = data?.metrics;
  const degraded = (data?.services || []).filter(
    (service) => service.status !== "operational",
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Administration"
        title="Organisation overview"
        lede="Capacity, revenue and platform health across all departments."
        actions={
          <>
            <Button variant="outline" icon="analytics" to="/admin?tab=analytics">
              Analytics
            </Button>
            <Button variant="primary" icon="admin" to="/admin">
              Administration
            </Button>
          </>
        }
      />

      {degraded.length > 0 && (
        <div className="banner banner--warning stack">
          <span className="banner__icon" aria-hidden="true">
            <Icon name="alertTriangle" size={16} />
          </span>
          <div className="grow">
            <span className="banner__title">
              {degraded.length} service{degraded.length === 1 ? "" : "s"} degraded
            </span>
            <div>
              {degraded.map((service) => `${service.name} (${service.detail})`).join(" · ")}
            </div>
          </div>
          <Button size="sm" variant="outline" to="/admin?tab=system">
            Inspect
          </Button>
        </div>
      )}

      <section className="grid grid--4" style={{ marginTop: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} variant="block" height={126} />
          ))
        ) : (
          <>
            <StatCard
              label="Active patients"
              value={formatNumber(metrics.stats.activePatients.value)}
              icon="patients"
              delta={metrics.stats.activePatients.delta}
              deltaLabel="vs last month"
              to="/patients"
            />
            <StatCard
              label="Appointments today"
              value={metrics.stats.appointmentsToday.value}
              icon="appointments"
              delta={metrics.stats.appointmentsToday.delta}
              deltaLabel="vs yesterday"
              to="/appointments?view=today"
            />
            <StatCard
              label="Bed occupancy"
              value={metrics.stats.occupancyRate.value}
              unit="%"
              icon="bed"
              delta={metrics.stats.occupancyRate.delta}
              deltaLabel="vs last week"
            />
            <StatCard
              label="Revenue this month"
              value={formatCurrency(metrics.stats.revenueMonth.value, { compact: true })}
              icon="billing"
              delta={metrics.stats.revenueMonth.delta}
              deltaLabel="vs last month"
            />
            <StatCard
              label="Pending invoices"
              value={metrics.stats.pendingInvoices.value}
              icon="creditCard"
              delta={metrics.stats.pendingInvoices.delta}
              deltaLabel="vs last month"
              to="/billing?status=pending"
            />
            <StatCard
              label="Average wait"
              value={metrics.stats.avgWaitMinutes.value}
              unit="min"
              icon="clock"
              delta={metrics.stats.avgWaitMinutes.delta}
              deltaLabel="vs last month"
            />
            <StatCard
              label="Clinicians on duty"
              value={12}
              icon="doctors"
              footnote="Across 11 departments"
              to="/doctors"
            />
            <StatCard
              label="AI requests today"
              value={formatNumber(412)}
              icon="ai"
              footnote="Grounded and assist modes"
              to="/ai/usage"
            />
          </>
        )}
      </section>

      <section className="section">
        <SectionHead
          title="Volume and revenue"
          actions={
            <Segmented
              value={revenueView}
              onChange={setRevenueView}
              items={[
                { value: "monthly", label: "Monthly" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
          }
        />

        <div className="grid grid--split">
          <ChartContainer
            title={revenueView === "monthly" ? "Revenue by month" : "Load by day"}
            subtitle={
              revenueView === "monthly" ? "Last 6 months" : "Appointments, last 7 days"
            }
            loading={loading}
          >
            {metrics &&
              (revenueView === "monthly" ? (
                <LineChart
                  data={metrics.revenueSeries}
                  valueFormatter={(value) => formatCurrency(value, { compact: true })}
                  height={240}
                />
              ) : (
                <BarChart
                  data={metrics.weeklyLoad}
                  highlightLast
                  height={240}
                  valueFormatter={(value) => `${value} appointments`}
                />
              ))}
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
      </section>

      <section className="section grid grid--split">
        <ChartContainer
          title="Appointments by month"
          subtitle="Completed across all departments"
          loading={loading}
        >
          {metrics && <BarChart data={metrics.appointmentsSeries} height={230} />}
        </ChartContainer>

        <ChartContainer
          title="Department load"
          subtitle="Active patients per department"
          loading={loading}
        >
          {metrics && (
            <BarList
              data={metrics.departmentLoad}
              valueFormatter={(value) => formatNumber(value)}
            />
          )}
        </ChartContainer>
      </section>

      <section className="section grid grid--split">
        <Card surface="soft">
          <CardHead
            title="Platform health"
            subtitle={
              loading
                ? "Loading"
                : degraded.length === 0
                  ? "All services operational"
                  : `${degraded.length} degraded`
            }
          />
          <CardBody padding="none">
            {loading ? (
              <div style={{ padding: "var(--s-md)" }}>
                <SkeletonRows rows={4} />
              </div>
            ) : (
              <div className="list">
                {data.services.map((service) => {
                  const meta = statusMeta(SERVICE_STATUS_META, service.status);

                  return (
                    <div className="list__row" key={service.id}>
                      <div className="grow col col--gap-xxs">
                        <span className="t-data t-ink">{service.name}</span>
                        <span className="t-caption">{service.detail}</span>
                      </div>
                      <span className="t-caption t-tabular hide-mobile">
                        {service.latencyMs} ms
                      </span>
                      <span className="t-caption t-tabular hide-mobile">
                        {formatPercent(service.uptime, 2)}
                      </span>
                      <Badge tone={meta.tone} dot>
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
          <CardFoot>
            <Link to="/admin?tab=system" className="text-link text-link--sm">
              System overview
              <Icon name="arrowRight" size={13} />
            </Link>
          </CardFoot>
        </Card>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Quick actions" />
            <CardBody padding="tight">
              <QuickActions actions={QUICK_ACTIONS} columns={1} />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Recent activity" />
            <CardBody>
              {loading ? <SkeletonRows rows={5} /> : <ActivityFeed items={data.activity} />}
            </CardBody>
            <CardFoot>
              <Link to="/admin?tab=audit" className="text-link text-link--sm">
                Full audit log
                <Icon name="arrowRight" size={13} />
              </Link>
            </CardFoot>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
