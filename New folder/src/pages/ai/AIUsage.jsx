import { Link } from "react-router-dom";

import BarChart from "../../components/charts/BarChart";
import BarList from "../../components/charts/BarList";
import ChartContainer from "../../components/charts/ChartContainer";
import Badge from "../../components/ui/Badge";
import Banner, { Progress } from "../../components/ui/Banner";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import PageHeader, { SectionHead } from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorState, Skeleton } from "../../components/ui/States";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import aiService from "../../services/aiService";
import { formatNumber, formatPercent, formatRelative } from "../../utils/format";

/** Quota row with a proportional bar that warns as the ceiling approaches. */
function Quota({ label, used, limit, unit }) {
  const ratio = limit > 0 ? (used / limit) * 100 : 0;

  return (
    <div className="col col--gap-xs">
      <div className="row row--between">
        <span className="t-label t-label--sm">{label}</span>
        <span className="t-data t-ink t-tabular">
          {formatNumber(used)}
          {unit ? ` ${unit}` : ""}{" "}
          <span className="t-muted">/ {formatNumber(limit)}</span>
        </span>
      </div>

      <Progress
        value={ratio}
        tone={ratio > 90 ? "critical" : ratio > 70 ? "warning" : "accent"}
        label={`${label} quota used`}
      />

      <span className="t-caption">
        {formatPercent(ratio, 1)} of the period allowance used ·{" "}
        {formatNumber(Math.max(0, limit - used))} remaining
      </span>
    </div>
  );
}

/**
 * AIUsage — quota, latency and feature breakdown for the AI service.
 *
 * Presented as an operational page rather than a billing page: the numbers that
 * matter are whether the service is close to its ceiling and how it is being used.
 */
function AIUsage() {
  useDocumentTitle("AI usage");

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([aiService.getUsage(), aiService.getStatus()]).then(
        ([usage, status]) => ({ usage, status }),
      ),
    [],
  );

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="AI" title="Usage" />
        <ErrorState
          title="Usage unavailable"
          message="AI usage figures could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  const usage = data?.usage;
  const status = data?.status;

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "AI Assistant", to: "/ai" }, { label: "Usage" }]} />

      <PageHeader
        eyebrow="AI"
        title="Usage and quota"
        lede={usage ? usage.period : "Consumption against the current allowance."}
        actions={
          <>
            <Button variant="outline" icon="refresh" onClick={reload}>
              Refresh
            </Button>
            <Button variant="primary" icon="ai" to="/ai">
              Open assistant
            </Button>
          </>
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
              label="Requests"
              value={formatNumber(usage.requests.used)}
              icon="ai"
              footnote={`of ${formatNumber(usage.requests.limit)} allowance`}
            />
            <StatCard
              label="Tokens"
              value={formatNumber(Math.round(usage.tokens.used / 1000))}
              unit="k"
              icon="cpu"
              footnote={`of ${formatNumber(usage.tokens.limit / 1000)}k allowance`}
            />
            <StatCard
              label="Retrieval queries"
              value={formatNumber(usage.retrievalQueries.used)}
              icon="database"
              footnote={`of ${formatNumber(usage.retrievalQueries.limit)} allowance`}
            />
            <StatCard
              label="Average latency"
              value={(usage.averageLatencyMs / 1000).toFixed(1)}
              unit="s"
              icon="clock"
              footnote="End to end, including retrieval"
            />
          </>
        )}
      </section>

      <div className="grid grid--split">
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Quota" subtitle={usage?.period} />
            <CardBody>
              {loading ? (
                <div className="col col--gap-lg">
                  <Skeleton variant="block" height={54} />
                  <Skeleton variant="block" height={54} />
                  <Skeleton variant="block" height={54} />
                </div>
              ) : (
                <div className="col col--gap-lg">
                  <Quota
                    label="Requests"
                    used={usage.requests.used}
                    limit={usage.requests.limit}
                  />
                  <Quota
                    label="Tokens"
                    used={usage.tokens.used}
                    limit={usage.tokens.limit}
                  />
                  <Quota
                    label="Retrieval queries"
                    used={usage.retrievalQueries.used}
                    limit={usage.retrievalQueries.limit}
                  />
                </div>
              )}
            </CardBody>
            <CardFoot>
              <span className="t-caption row row--tight">
                <Icon name="info" size={13} />
                Allowances reset at the start of each billing period
              </span>
            </CardFoot>
          </Card>

          <ChartContainer
            title="Requests per day"
            subtitle="Last 7 days"
            loading={loading}
          >
            {usage && <BarChart data={usage.dailySeries} highlightLast height={230} />}
          </ChartContainer>

          <ChartContainer
            title="Usage by feature"
            subtitle="Requests in the current period"
            loading={loading}
          >
            {usage && (
              <BarList
                data={usage.byFeature}
                valueFormatter={(value) => formatNumber(value)}
              />
            )}
          </ChartContainer>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Service" />
            <CardBody>
              {loading ? (
                <Skeleton variant="block" height={140} />
              ) : (
                <div className="col col--gap-md">
                  <div className="row row--between">
                    <span className="t-caption">Status</span>
                    <Badge tone={status.online ? "success" : "critical"} dot>
                      {status.online ? "Online" : "Offline"}
                    </Badge>
                  </div>

                  <DefList
                    columns={1}
                    items={[
                      { label: "Model", value: status.model },
                      { label: "Version", value: status.modelVersion },
                      { label: "Median latency", value: `${status.latencyMs} ms` },
                      {
                        label: "Retrieval",
                        value: status.retrieval.enabled ? "Enabled" : "Disabled",
                      },
                    ]}
                  />
                </div>
              )}
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Knowledge base" />
            <CardBody>
              {loading ? (
                <Skeleton variant="block" height={120} />
              ) : (
                <div className="col col--gap-md">
                  <div className="row row--between">
                    <span className="t-caption">Documents indexed</span>
                    <span className="t-title-sm t-tabular">
                      {formatNumber(status.retrieval.documentCount)}
                    </span>
                  </div>

                  <div className="row row--between">
                    <span className="t-caption">Last indexed</span>
                    <span className="t-data t-strong">
                      {formatRelative(status.retrieval.lastIndexedAt)}
                    </span>
                  </div>

                  <div className="divider" />

                  <div className="col col--gap-xs">
                    <span className="deflist__label">Collections</span>
                    <div className="row row--tight row--wrap">
                      {status.retrieval.collections.map((collection) => (
                        <Badge key={collection} tone="outline">
                          {collection}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card surface="soft">
            <CardHead title="Workflows" />
            <CardBody padding="tight">
              <div className="col col--gap-xs">
                <Button variant="surface" icon="ai" block to="/ai">
                  Assistant
                </Button>
                <Button variant="surface" icon="reports" block to="/ai/analysis">
                  Report analysis
                </Button>
              </div>
            </CardBody>
          </Card>

          <Banner tone="accent" icon="info">
            Figures come from a fixture. Connect GET /ai/usage to report real
            consumption.
          </Banner>
        </div>
      </div>

      <section className="section">
        <SectionHead title="How the modes differ" stripe />

        <div className="grid grid--3">
          {[
            {
              icon: "ai",
              title: "Assist",
              body: "Clinical reasoning from the model alone. Fast, no retrieval, no citations. Not appropriate for dosing or diagnosis.",
            },
            {
              icon: "database",
              title: "Grounded",
              body: "Answers assembled from retrieved documents only, with a citation on every claim. Slower, and the mode to prefer for anything clinical.",
            },
            {
              icon: "search",
              title: "Search",
              body: "Retrieval without generation. Returns the source documents and nothing else, which is the safest way to look something up.",
            },
          ].map((mode) => (
            <Card key={mode.title} surface="soft">
              <CardBody padding="tight">
                <div className="col col--gap-sm">
                  <span className="tile__icon" aria-hidden="true">
                    <Icon name={mode.icon} size={18} />
                  </span>
                  <span className="t-title-sm">{mode.title}</span>
                  <p className="t-body-sm">{mode.body}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <p className="t-caption" style={{ marginTop: "var(--s-lg)" }}>
        Need the assistant?{" "}
        <Link to="/ai" className="text-link text-link--sm">
          Open it here
        </Link>
      </p>
    </div>
  );
}

export default AIUsage;
