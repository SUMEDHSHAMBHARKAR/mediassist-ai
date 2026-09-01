import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import SourceCard from "../../components/ai/SourceCard";
import StatusBadge from "../../components/domain/StatusBadge";
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
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import aiService from "../../services/aiService";
import { reportsService } from "../../services/clinicalService";
import patientsService from "../../services/patientsService";
import { formatDate } from "../../utils/format";

function ReportAnalysis() {
  useDocumentTitle("Report analysis");

  const [params, setParams] = useSearchParams();
  const reportId = params.get("reportId");

  const [analysis, setAnalysis] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState(0);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        reportsService.list().catch(() => []),
        patientsService.list().catch(() => []),
      ]).then(([rawReports, rawPatients]) => {
        const reportList = Array.isArray(rawReports) ? rawReports : rawReports?.items || [];
        const patientList = Array.isArray(rawPatients?.items) ? rawPatients.items : Array.isArray(rawPatients) ? rawPatients : [];
        return {
          reports: reportList,
          patientsById: new Map(patientList.map((patient) => [patient.id, patient])),
        };
      }),
    [],
  );

  const reportList = data?.reports || [];
  const report = reportList.find((entry) => String(entry.id) === String(reportId)) || null;
  const pId = report?.patient_id || report?.patientId;
  const patient = report ? data?.patientsById.get(pId) : null;

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

    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + 15));
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
              subtitle={`${reportList.length} report document${reportList.length === 1 ? "" : "s"} ready`}
            />
            <CardBody>
              <div className="col col--gap-md">
                <Select
                  label="Report"
                  options={reportList.map((entry) => ({
                    value: entry.id,
                    label: `${entry.filename || entry.fileName || `Report #${entry.id}`} · ${data?.patientsById?.get(entry.patient_id || entry.patientId)?.name || "Patient"}`,
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
                        { label: "Filename", value: report.filename || report.fileName || `Report #${report.id}` },
                        { label: "Type", value: report.file_type || report.type || "Document" },
                        { label: "Patient", value: patient?.name || `Patient #${pId}` },
                        { label: "Uploaded", value: formatDate(report.upload_date || report.uploadedAt) },
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
                    <span className="t-title-sm">Analysing report #{reportId}</span>
                  </div>

                  <Progress value={progress} label="Analysis progress" />

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
                  message="The AI service did not return a result. Ensure backend AI service is enabled."
                  onRetry={run}
                />
              </CardBody>
            </Card>
          )}

          {phase === "done" && analysis && (
            <>
              <Card surface="soft" stripe>
                <CardHead
                  title="Analysis Result"
                />
                <CardBody>
                  <div className="col col--gap-lg">
                    <p className="t-title-sm">{analysis.headline || analysis.content || "Analysis completed."}</p>

                    <Banner tone="warning" icon="alertTriangle">
                      Machine generated findings. Always confirm findings against original records.
                    </Banner>
                  </div>
                </CardBody>
              </Card>

              {analysis.findings?.length > 0 && (
                <section>
                  <SectionHead
                    title="Findings"
                    meta={`${analysis.findings.length} extracted`}
                  />

                  <div className="grid grid--2">
                    {analysis.findings.map((finding) => (
                      <Card
                        key={finding.id || finding.label}
                        surface="soft"
                      >
                        <CardBody padding="tight">
                          <div className="col col--gap-xs">
                            <div className="row row--between row--top">
                              <span className="t-label t-label--sm">{finding.label}</span>
                              <StatusBadge kind="severity" value={finding.severity || "routine"} />
                            </div>
                            <span className="t-title-lg t-tabular">{finding.value}</span>
                            <p className="t-caption">{finding.note}</p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
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
                    {report.filename || report.fileName || `Report #${report.id}`}
                  </Link>

                  {report.notes && (
                    <>
                      <div className="divider" />
                      <span className="deflist__label">Notes</span>
                      <p className="t-body-sm">{report.notes}</p>
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
                  <span className="t-caption">{patient.mobile_no}</span>
                </div>
              </CardBody>
            </Card>
          )}

          <Card surface="soft">
            <CardHead title="Citations" />
            <CardBody padding="tight">
              {phase !== "done" || !analysis?.sources?.length ? (
                <EmptyState
                  size="inline"
                  icon="database"
                  title="No citations yet"
                  message="Run an analysis to retrieve source document citations."
                />
              ) : (
                <div className="col col--gap-xs">
                  {analysis.sources.map((source, index) => (
                    <SourceCard key={source.id || index} source={source} index={index} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ReportAnalysis;
