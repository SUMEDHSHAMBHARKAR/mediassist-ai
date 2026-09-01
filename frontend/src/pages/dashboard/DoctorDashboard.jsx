import { Link } from "react-router-dom";

import BarChart from "../../components/charts/BarChart";
import BarList from "../../components/charts/BarList";
import ChartContainer from "../../components/charts/ChartContainer";
import DonutChart from "../../components/charts/DonutChart";
import ActivityFeed from "../../components/domain/ActivityFeed";
import { AppointmentRow } from "../../components/domain/AppointmentCard";
import QuickActions from "../../components/domain/QuickActions";
import StatusBadge from "../../components/domain/StatusBadge";
import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader, { SectionHead } from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/ui/States";
import { ROLES } from "../../constants/roles";
import { ACTIVE_APPOINTMENT_STATUSES } from "../../constants/statuses";
import useAsyncData from "../../hooks/useAsyncData";
import appointmentsService from "../../services/appointmentsService";
import dashboardService from "../../services/dashboardService";
import patientsService from "../../services/patientsService";
import { formatNumber } from "../../utils/format";

const QUICK_ACTIONS = [
  {
    label: "Book appointment",
    sub: "Find a slot",
    icon: "calendarPlus",
    to: "/appointments/book",
  },
  {
    label: "New record",
    sub: "Document an encounter",
    icon: "records",
    to: "/medical-records?new=1",
  },
  {
    label: "Write prescription",
    sub: "Add medications",
    icon: "prescriptions",
    to: "/prescriptions/new",
  },
  {
    label: "Ask the assistant",
    sub: "Grounded in your data",
    icon: "ai",
    to: "/ai",
  },
];

/**
 * DoctorDashboard — the clinician's operating view.
 *
 * Ordered by what a clinician acts on first: patients needing attention, then
 * today's schedule, then trends.
 */
function DoctorDashboard({ user }) {
  const doctorId = user?.doctorId;

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        dashboardService.forRole(ROLES.DOCTOR),
        appointmentsService.listToday(),
        patientsService.list(),
        dashboardService.activity(6),
      ]).then(([metrics, today, patients, activity]) => ({
        metrics,
        today,
        patients,
        activity,
      })),
    [doctorId],
  );

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title="Dashboard unavailable"
          message="Your clinical summary could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const metrics = data?.metrics;
  const patientsById = new Map((data?.patients || []).map((p) => [p.id, p]));

  const schedule = (data?.today || [])
    .filter((appointment) => appointment.doctorId === doctorId)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const remaining = schedule.filter((appointment) =>
    ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status),
  );

  // Patients whose latest recorded risk needs review, most severe first.
  const needsAttention = (data?.patients || [])
    .filter((patient) => ["critical", "urgent"].includes(patient.riskLevel))
    .sort((a) => (a.riskLevel === "critical" ? -1 : 1))
    .slice(0, 4);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinician workspace"
        title={`Good day, ${(user?.name || "").replace(/^Dr\.\s*/, "")}`}
        lede="Your schedule, the patients who need review, and how the week is tracking."
        actions={
          <>
            <Button variant="outline" icon="appointments" to="/appointments">
              Full schedule
            </Button>
            <Button variant="primary" icon="calendarPlus" to="/appointments/book">
              Book
            </Button>
          </>
        }
      />

      {needsAttention.length > 0 && (
        <Banner
          tone="critical"
          title={`${needsAttention.length} patients flagged for review`}
          className="stack"
          action={
            <Button size="sm" variant="danger" to="/patients?risk=critical">
              Review
            </Button>
          }
        >
          Observations outside expected range were recorded for{" "}
          {needsAttention.map((patient) => patient.name).join(", ")}.
        </Banner>
      )}

      <section className="grid grid--4" style={{ marginTop: "var(--s-lg)" }}>
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="block" height={126} />
          ))
        ) : (
          <>
            <StatCard
              label="Appointments today"
              value={schedule.length}
              icon="appointments"
              delta={metrics.stats.appointmentsToday.delta}
              deltaLabel="vs last week"
            />
            <StatCard
              label="Patients under care"
              value={formatNumber(metrics.stats.patientsUnderCare.value)}
              icon="patients"
              delta={metrics.stats.patientsUnderCare.delta}
              deltaLabel="vs last month"
            />
            <StatCard
              label="Reports awaiting review"
              value={metrics.stats.pendingReports.value}
              icon="reports"
              delta={metrics.stats.pendingReports.delta}
              deltaLabel="vs last week"
            />
            <StatCard
              label="Prescriptions this week"
              value={metrics.stats.prescriptionsWeek.value}
              icon="prescriptions"
              delta={metrics.stats.prescriptionsWeek.delta}
              deltaLabel="vs last week"
            />
          </>
        )}
      </section>

      <section className="section grid grid--split">
        <Card surface="soft">
          <CardHead
            title="Today's schedule"
            subtitle={
              loading
                ? "Loading"
                : `${remaining.length} of ${schedule.length} still to see`
            }
            actions={
              <Button size="sm" variant="ghost" to="/appointments?view=today" iconEnd="arrowRight">
                All
              </Button>
            }
          />

          <CardBody padding="none">
            {loading ? (
              <div style={{ padding: "var(--s-md)" }}>
                <SkeletonRows rows={4} />
              </div>
            ) : schedule.length === 0 ? (
              <EmptyState
                size="compact"
                icon="appointments"
                title="No appointments today"
                message="Your clinic list is clear. Upcoming appointments appear here on the day."
                actionLabel="Open schedule"
                actionIcon="appointments"
                actionTo="/appointments"
              />
            ) : (
              <div className="list">
                {schedule.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    patient={patientsById.get(appointment.patientId)}
                    perspective="doctor"
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Quick actions" />
            <CardBody padding="tight">
              <QuickActions actions={QUICK_ACTIONS} columns={1} />
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead
              title="Needs review"
              subtitle={`${needsAttention.length} flagged`}
            />
            <CardBody padding="none">
              {loading ? (
                <div style={{ padding: "var(--s-md)" }}>
                  <SkeletonRows rows={3} />
                </div>
              ) : needsAttention.length === 0 ? (
                <EmptyState
                  size="inline"
                  icon="checkCircle"
                  title="Nothing flagged"
                  message="No patients are currently outside expected range."
                />
              ) : (
                <div className="list">
                  {needsAttention.map((patient) => (
                    <Link
                      className="list__row list__row--link"
                      to={`/patients/${patient.id}`}
                      key={patient.id}
                    >
                      <div className="grow col col--gap-xxs">
                        <span className="t-data t-ink">{patient.name}</span>
                        <span className="t-caption">
                          BP {patient.vitals.bloodPressure} · HR{" "}
                          {patient.vitals.heartRate}
                        </span>
                      </div>
                      <StatusBadge kind="severity" value={patient.riskLevel} />
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="section">
        <SectionHead title="This week" meta="Consultation volume and outcomes" />

        <div className="grid grid--split">
          <ChartContainer
            title="Consultations per day"
            subtitle="Completed and scheduled"
            loading={loading}
          >
            {metrics && (
              <BarChart data={metrics.weeklyConsults} highlightLast height={230} />
            )}
          </ChartContainer>

          <ChartContainer title="Outcomes" subtitle="Last 90 days" loading={loading}>
            {metrics && (
              <DonutChart
                data={metrics.outcomeSplit}
                centerValue={metrics.outcomeSplit.reduce((sum, e) => sum + e.value, 0)}
                centerLabel="Encounters"
              />
            )}
          </ChartContainer>
        </div>
      </section>

      <section className="section grid grid--split">
        <ChartContainer
          title="Case mix"
          subtitle="Most frequent presenting conditions"
          loading={loading}
        >
          {metrics && (
            <BarList
              data={metrics.caseMix}
              valueFormatter={(value) => `${value} patients`}
            />
          )}
        </ChartContainer>

        <Card surface="soft">
          <CardHead title="Recent activity" />
          <CardBody>
            {loading ? (
              <SkeletonRows rows={5} />
            ) : (
              <ActivityFeed items={data.activity} />
            )}
          </CardBody>
          <CardFoot>
            <span className="t-caption row row--tight">
              <Icon name="shieldCheck" size={13} />
              Every action is recorded in the audit trail
            </span>
          </CardFoot>
        </Card>
      </section>
    </div>
  );
}

export default DoctorDashboard;
