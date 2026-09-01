import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import SourceCard from "../../components/ai/SourceCard";
import StatusBadge from "../../components/domain/StatusBadge";
import Badge from "../../components/ui/Badge";
import Banner, { Progress } from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import PageHeader, { SectionHead } from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
} from "../../components/ui/States";
import { REPORT_STATUS, REPORT_TYPES, optionLabel } from "../../constants/statuses";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import aiService from "../../services/aiService";
import { reportsService } from "../../services/clinicalService";
import patientsService from "../../services/patientsService";
import { formatDateTime, formatPercent } from "../../utils/format";

/**
 * ReportAnalysis — the AI report-analysis workflow.
 *
 * Four states in one page: nothing selected, analysing, complete, failed. The
 * analysis is presented as structured findings plus citations rather than a wall
 * of prose, so a clinician can check each claim against its source.
 */
function ReportAnalysis() {
  useDocumentTitle("Report analysis");

  const [params, setParams] = useSearchParams();
  const reportId = params.get("reportId");

  const [analysis, setAnalysis] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState(0);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([reportsService.list(), patientsService.list()]).then(
        ([reports, patients]) => ({
          reports: reports.filter((report) => report.status === REPORT_STATUS.READY),
          patientsById: new Map(patients.map((patient) => [patient.id, patient])),
        }),
      ),
    [],
  );

  const report = (data?.reports || []).find((entry) => entry.id === reportId) || null;
  const patient = report ? data?.patientsById.get(report.patientId) : null;

  const selectReport = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set("reportId", id);
    else next.delete("reportId");
    setParams(next, { replace: true });

    setAnalysis(null);
    setPhase("idle");
    setProgress(0);
  };

  const run = async () => {
    if (!reportId) return;

    setPhase("running");
    setProgress(0);
    setAnalysis(null);

    // Staged progress so the long-running workflow reads as work, not a hang.
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + 9));
    }, 150);

    try {
      const result = await aiService.analyseReport(reportId);
      window.clearInterval(timer);
      setProgress(100);
      setAnalysis(result);
      setPhase("done");
    } catch {
      window.clearInterval(timer);
      setPhase("error");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingState label="Loading reports" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title="Cannot open analysis"
          message="The report archive could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: "AI Assistant", to: "/ai" },
          { label: "Report analysis" },
        ]}
      />

      <PageHeader
        eyebrow="AI workflow"
        title="Report analysis"
        lede="Extract structured findings from a report and cross-reference them against clinical guidance."
        actions={
          <Button variant="ghost" icon="ai" to="/ai">
            Open assistant
          </Button>
        }
      />

      <div className="grid grid--split">
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead
              title="Select a report"
              subtitle={`${data.reports.length} ready for analysis`}
            />
            <CardBody>
              <div className="col col--gap-md">
                <Select
                  label="Report"
                  options={data.reports.map((entry) => ({
                    value: entry.id,
                    label: `${entry.title} · ${data.patientsById.get(entry.patientId)?.name || "Unknown"}`,
                  }))}
                  placeholder="Choose a report"
                  value={reportId || ""}
                  onChange={(event) => selectReport(event.target.value)}
                />

                {report && (
                  <>
                    <div className="divider" />
                    <DefList
                      items={[
                        { label: "Report", value: report.title },
                        { label: "Type", value: optionLabel(REPORT_TYPES, report.type) },
                        { label: "Patient", value: patient?.name || "—" },
                        { label: "Uploaded", value: formatDateTime(report.uploadedAt) },
                      ]}
                    />

                    <div className="row row--tight row--wrap">
                      <Button
                        variant="primary"
                        icon="ai"
                        onClick={run}
                        loading={phase === "running"}
                      >
                        {phase === "done" ? "Re-run analysis" : "Analyse report"}
                      </Button>
                      <Button variant="outline" to={`/reports/${report.id}`}>
                        Open report
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {phase === "idle" && !report && (
            <Card surface="soft">
              <EmptyState
                icon="reports"
                title="No report selected"
                message="Pick a report above to extract structured findings and citations from it."
                secondary={
                  <Button variant="outline" to="/reports">
                    Browse reports
                  </Button>
                }
              />
            </Card>
          )}

          {phase === "running" && (
            <Card surface="soft" stripe>
              <CardBody>
                <div className="col col--gap-md">
                  <div className="row row--tight">
                    <span className="spinner" aria-hidden="true" />
                    <span className="t-title-sm">Analysing {report?.title}</span>
                  </div>

                  <Progress value={progress} label="Analysis progress" />

                  <ol className="col col--gap-xs">
                    {[
                      { label: "Reading the document", at: 10 },
                      { label: "Extracting values and ranges", at: 35 },
                      { label: "Retrieving relevant guidance", at: 60 },
                      { label: "Composing findings", at: 85 },
                    ].map((step) => (
                      <li className="row row--tight t-caption" key={step.label}>
                        <Icon
                          name={progress >= step.at ? "checkCircle" : "clock"}
                          size={13}
                          className={progress >= step.at ? "t-success" : "t-muted"}
                        />
                        {step.label}
                      </li>
                    ))}
                  </ol>

                  <Skeleton variant="block" height={80} />
                </div>
              </CardBody>
            </Card>
          )}

          {phase === "error" && (
            <Card surface="soft" tone="critical">
              <CardBody>
                <ErrorState
                  size="compact"
                  title="Analysis failed"
                  message="The AI service did not return a result. Nothing has been attached to the report."
                  onRetry={run}
                />
              </CardBody>
            </Card>
          )}

          {phase === "done" && analysis && (
            <>
              <Card surface="soft" stripe>
                <CardHead
                  title="Analysis"
                  subtitle={`Completed ${formatDateTime(analysis.completedAt)}`}
                  actions={
                    <Badge tone="accent" icon="ai">
                      {formatPercent(analysis.confidence * 100)} confidence
                    </Badge>
                  }
                />
                <CardBody>
                  <div className="col col--gap-lg">
                    <p className="t-title-sm">{analysis.headline}</p>

                    <Banner tone="warning" icon="alertTriangle">
                      Machine generated. Confirm every value against the source
                      document before it informs a clinical decision.
                    </Banner>
                  </div>
                </CardBody>
              </Card>

              <section>
                <SectionHead
                  title="Findings"
                  meta={`${analysis.findings.length} extracted`}
                />

                <div className="grid grid--2">
                  {analysis.findings.map((finding) => (
                    <Card
                      key={finding.id}
                      surface="soft"
                      tone={
                        ["urgent", "critical"].includes(finding.severity)
                          ? "critical"
                          : undefined
                      }
                    >
                      <CardBody padding="tight">
                        <div className="col col--gap-xs">
                          <div className="row row--between row--top">
                            <span className="t-label t-label--sm">{finding.label}</span>
                            <StatusBadge kind="severity" value={finding.severity} />
                          </div>
                          <span className="t-title-lg t-tabular">{finding.value}</span>
                          <p className="t-caption">{finding.note}</p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </section>

              <Card surface="soft">
                <CardHead title="Suggested next steps" />
                <CardBody>
                  <ol className="col col--gap-sm">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li className="row row--top row--loose" key={recommendation}>
                        <span
                          className="source__index"
                          aria-hidden="true"
                          style={{ marginTop: 2 }}
                        >
                          {index + 1}
                        </span>
                        <span className="t-body-sm t-strong">{recommendation}</span>
                      </li>
                    ))}
                  </ol>
                </CardBody>
                <CardFoot>
                  <span className="t-caption row row--tight">
                    <Icon name="alertTriangle" size={13} className="t-warning" />
                    Suggestions only — clinical judgement remains with the clinician
                  </span>
                </CardFoot>
              </Card>
            </>
          )}
        </div>

        {/* Rail */}
        <div className="col col--gap-lg">
          {report && (
            <Card surface="soft">
              <CardHead title="Source report" />
              <CardBody>
                <div className="col col--gap-sm">
                  <Link to={`/reports/${report.id}`} className="t-data t-ink">
                    {report.title}
                  </Link>
                  <span className="t-caption">{report.fileName}</span>

                  {report.summary && (
                    <>
                      <div className="divider" />
                      <span className="deflist__label">Existing summary</span>
                      <p className="t-body-sm">{report.summary}</p>
                    </>
                  )}
                </div>
              </CardBody>
              <CardFoot>
                <Link to={`/reports/${report.id}`} className="text-link text-link--sm">
                  Open report
                  <Icon name="arrowRight" size={13} />
                </Link>
              </CardFoot>
            </Card>
          )}

          {patient && (
            <Card surface="soft">
              <CardHead title="Patient" />
              <CardBody>
                <div className="col col--gap-sm">
                  <Link to={`/patients/${patient.id}`} className="t-data t-ink">
                    {patient.name}
                  </Link>
                  <span className="t-caption">{patient.mrn}</span>

                  {patient.allergies?.length > 0 && (
                    <Badge tone="critical" icon="alertTriangle">
                      {patient.allergies.join(", ")}
                    </Badge>
                  )}

                  {patient.conditions?.length > 0 && (
                    <div className="row row--tight row--wrap">
                      {patient.conditions.map((condition) => (
                        <Badge key={condition} tone="outline">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          <Card surface="soft">
            <CardHead title="Citations" />
            <CardBody padding="tight">
              {phase !== "done" || !analysis ? (
                <EmptyState
                  size="inline"
                  icon="database"
                  title="No citations yet"
                  message="Run an analysis and the documents it drew on appear here."
                />
              ) : (
                <div className="col col--gap-xs">
                  {analysis.sources.map((source, index) => (
                    <SourceCard key={source.id} source={source} index={index} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Banner tone="accent" icon="info">
            The AI service is not connected. Findings shown here come from a fixture
            so the workflow can be reviewed end to end.
          </Banner>
        </div>
      </div>
    </div>
  );
}

export default ReportAnalysis;
