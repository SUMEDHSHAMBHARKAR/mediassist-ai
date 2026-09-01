import { Link } from "react-router-dom";

import ChartContainer from "../../components/charts/ChartContainer";
import LineChart from "../../components/charts/LineChart";
import AppointmentCard from "../../components/domain/AppointmentCard";
import QuickActions from "../../components/domain/QuickActions";
import { RxItem } from "../../components/domain/PrescriptionCard";
import StatusBadge from "../../components/domain/StatusBadge";
import VitalsStrip from "../../components/domain/VitalsStrip";
import Banner, { Progress } from "../../components/ui/Banner";
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
import { ACTIVE_APPOINTMENT_STATUSES, RX_STATUS } from "../../constants/statuses";
import useAsyncData from "../../hooks/useAsyncData";
import appointmentsService from "../../services/appointmentsService";
import billingService from "../../services/billingService";
import { prescriptionsService, reportsService } from "../../services/clinicalService";
import dashboardService from "../../services/dashboardService";
import doctorsService from "../../services/doctorsService";
import patientsService from "../../services/patientsService";
import { isFuture } from "../../utils/collection";
import { formatCurrency, formatDate } from "../../utils/format";

const QUICK_ACTIONS = [
  { label: "Book an appointment", sub: "Choose a clinician and slot", icon: "calendarPlus", to: "/appointments/book" },
  { label: "My reports", sub: "Results and imaging", icon: "reports", to: "/reports" },
  { label: "My prescriptions", sub: "Current medications", icon: "prescriptions", to: "/prescriptions" },
  { label: "Pay a bill", sub: "Outstanding invoices", icon: "billing", to: "/billing" },
];

/**
 * PatientDashboard — the patient's own view.
 *
 * Deliberately narrower than the clinician view: what is coming up, what to
 * take, what to read, what to pay. No population-level analytics.
 */
function PatientDashboard({ user }) {
  const patientId = user?.patientId;

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        dashboardService.forRole("patient"),
        patientsService.getProfile(patientId),
        appointmentsService.listForPatient(patientId),
        prescriptionsService.listByPatient(patientId),
        reportsService.listByPatient(patientId),
        billingService.listByPatient(patientId),
        doctorsService.list(),
      ]).then(([metrics, patient, appointments, prescriptions, reports, invoices, doctors]) => ({
        metrics,
        patient,
        appointments,
        prescriptions,
        reports,
        invoices,
        doctorsById: new Map(doctors.map((doctor) => [doctor.id, doctor])),
      })),
    [patientId],
  );

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title="Dashboard unavailable"
          message="Your health summary could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const patient = data?.patient;

  const upcoming = (data?.appointments || [])
    .filter(
      (appointment) =>
        isFuture(appointment.startsAt) &&
        ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status),
    )
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const nextAppointment = upcoming[0];

  const activeRx = (data?.prescriptions || []).filter(
    (prescription) => prescription.status === RX_STATUS.ACTIVE,
  );
  const currentMedications = activeRx.flatMap((prescription) => prescription.items);

  const readyReports = (data?.reports || []).filter(
    (report) => report.status === "ready",
  );

  const outstanding = (data?.invoices || []).reduce(
    (sum, invoice) => sum + Math.max(0, invoice.total - invoice.amountPaid),
    0,
  );
  const unpaid = (data?.invoices || []).filter(
    (invoice) => invoice.total - invoice.amountPaid > 0,
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Your health"
        title={`Hello, ${(patient?.name || user?.name || "").split(" ")[0]}`}
        lede="Your appointments, medications, results and balance in one place."
        actions={
          <Button variant="primary" icon="calendarPlus" to="/appointments/book">
            Book appointment
          </Button>
        }
      />

      {patient?.status === "admitted" && (
        <Banner tone="warning" title="You are currently admitted" className="stack">
          Your care team is updating this record during your stay. Contact the ward
          for anything urgent rather than using this app.
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
              label="Upcoming appointments"
              value={upcoming.length}
              icon="appointments"
              footnote={
                nextAppointment ? `Next ${formatDate(nextAppointment.startsAt)}` : "None booked"
              }
              to="/appointments"
            />
            <StatCard
              label="Active medications"
              value={currentMedications.length}
              icon="prescriptions"
              footnote={`${activeRx.length} prescription${activeRx.length === 1 ? "" : "s"}`}
              to="/prescriptions"
            />
            <StatCard
              label="Reports available"
              value={readyReports.length}
              icon="reports"
              footnote="Ready to view"
              to="/reports"
            />
            <StatCard
              label="Outstanding balance"
              value={formatCurrency(outstanding)}
              icon="billing"
              footnote={`${unpaid.length} unpaid invoice${unpaid.length === 1 ? "" : "s"}`}
              to="/billing"
            />
          </>
        )}
      </section>

      <section className="section grid grid--split">
        <div className="col col--gap-lg">
          <div>
            <SectionHead
              title="Next appointment"
              actions={
                <Button size="sm" variant="ghost" to="/appointments" iconEnd="arrowRight">
                  All
                </Button>
              }
            />

            {loading ? (
              <Skeleton variant="block" height={200} />
            ) : nextAppointment ? (
              <AppointmentCard
                appointment={nextAppointment}
                patient={patient}
                doctor={data.doctorsById.get(nextAppointment.doctorId)}
                perspective="patient"
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    to={`/appointments/${nextAppointment.id}`}
                  >
                    Manage
                  </Button>
                }
              />
            ) : (
              <Card surface="soft">
                <EmptyState
                  size="compact"
                  icon="appointments"
                  title="No appointments booked"
                  message="Choose a clinician and a time that suits you."
                  actionLabel="Book appointment"
                  actionIcon="calendarPlus"
                  actionTo="/appointments/book"
                />
              </Card>
            )}
          </div>

          <Card surface="soft">
            <CardHead
              title="Current medications"
              subtitle={
                loading ? "Loading" : `${currentMedications.length} active`
              }
              actions={
                <Button size="sm" variant="ghost" to="/prescriptions" iconEnd="arrowRight">
                  All
                </Button>
              }
            />
            <CardBody>
              {loading ? (
                <SkeletonRows rows={3} />
              ) : currentMedications.length === 0 ? (
                <EmptyState
                  size="inline"
                  icon="prescriptions"
                  title="No active medications"
                  message="Prescriptions issued by your care team appear here."
                />
              ) : (
                <ul className="col col--gap-xs">
                  {currentMedications.slice(0, 4).map((item) => (
                    <RxItem key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </CardBody>
            {currentMedications.length > 4 && (
              <CardFoot>
                <Link to="/prescriptions" className="text-link text-link--sm">
                  View all {currentMedications.length} medications
                  <Icon name="arrowRight" size={13} />
                </Link>
              </CardFoot>
            )}
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Latest observations" />
            <CardBody padding="tight">
              {loading ? (
                <Skeleton variant="block" height={96} />
              ) : (
                <VitalsStrip vitals={patient?.vitals} />
              )}
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Care team" />
            <CardBody padding="none">
              {loading ? (
                <div style={{ padding: "var(--s-md)" }}>
                  <SkeletonRows rows={2} />
                </div>
              ) : (
                <div className="list">
                  {(() => {
                    const primary = data.doctorsById.get(patient?.primaryDoctorId);
                    return primary ? (
                      <Link
                        to={`/doctors/${primary.id}`}
                        className="list__row list__row--link"
                      >
                        <div className="grow col col--gap-xxs">
                          <span className="t-data t-ink">{primary.name}</span>
                          <span className="t-caption">{primary.specialisation}</span>
                        </div>
                        <Icon name="chevronRight" size={14} className="t-muted" />
                      </Link>
                    ) : (
                      <div style={{ padding: "var(--s-md)" }}>
                        <p className="t-caption">No primary clinician assigned.</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardBody>
            <CardFoot>
              <Link to="/doctors" className="text-link text-link--sm">
                Find a clinician
                <Icon name="arrowRight" size={13} />
              </Link>
            </CardFoot>
          </Card>

          <Card surface="soft">
            <CardHead title="Quick actions" />
            <CardBody padding="tight">
              <QuickActions actions={QUICK_ACTIONS} columns={1} />
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="section grid grid--split">
        <ChartContainer
          title="Blood pressure trend"
          subtitle="Systolic, last 6 months"
          loading={loading}
        >
          {data?.metrics && (
            <LineChart
              data={data.metrics.vitalsTrend.systolic}
              valueFormatter={(value) => `${value} mmHg`}
              height={230}
            />
          )}
        </ChartContainer>

        <Card surface="soft">
          <CardHead title="Medication adherence" subtitle="Last 30 days" />
          <CardBody>
            {loading ? (
              <Skeleton variant="block" height={120} />
            ) : (
              <div className="col col--gap-md">
                <div className="row row--between">
                  <span className="stat__value">{data.metrics.adherence}%</span>
                  <StatusBadge
                    kind="severity"
                    value={data.metrics.adherence >= 80 ? "routine" : "urgent"}
                  />
                </div>
                <Progress
                  value={data.metrics.adherence}
                  tone={data.metrics.adherence >= 80 ? "success" : "warning"}
                  label="Medication adherence"
                />
                <p className="t-body-sm">
                  Doses recorded as taken against doses prescribed. Talk to your
                  clinician before changing anything.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

export default PatientDashboard;
