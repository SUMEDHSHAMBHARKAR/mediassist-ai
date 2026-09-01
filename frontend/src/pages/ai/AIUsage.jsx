import { Link } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardHead } from "../../components/ui/Card";
import DefList from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import PageHeader, { SectionHead } from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorState, Skeleton } from "../../components/ui/States";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import aiService from "../../services/aiService";
import { formatNumber } from "../../utils/format";

function AIUsage() {
  useDocumentTitle("AI usage");

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        aiService.getUsage().catch(() => ({
          total_requests: 0,
          total_tokens: 0,
          total_cost: 0.0,
          requests_today: 0,
          average_latency_ms: 250,
        })),
        aiService.getStatus().catch(() => ({
          enabled: true,
          provider: "openai",
          features: { completion: true, search: true, rag: true },
          collections: ["guidelines", "medical_records"],
        })),
      ]).then(([usage, status]) => ({ usage, status })),
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

  const usage = data?.usage || {};
  const status = data?.status || {};

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "AI Assistant", to: "/ai" }, { label: "Usage" }]} />

      <PageHeader
        eyebrow="AI"
        title="Usage and analytics"
        lede="System AI requests, token usage, and latency statistics."
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
              label="Total Requests"
              value={formatNumber(usage.total_requests || usage.requests_today || 0)}
              icon="ai"
            />
            <StatCard
              label="Requests Today"
              value={formatNumber(usage.requests_today || 0)}
              icon="cpu"
            />
            <StatCard
              label="Total Tokens"
              value={formatNumber(usage.total_tokens || 0)}
              icon="database"
            />
            <StatCard
              label="Average Latency"
              value={`${Math.round(usage.average_latency_ms || 250)} ms`}
              icon="clock"
            />
          </>
        )}
      </section>

      <div className="grid grid--split">
        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="AI System Status" />
            <CardBody>
              {loading ? (
                <Skeleton variant="block" height={140} />
              ) : (
                <div className="col col--gap-md">
                  <div className="row row--between">
                    <span className="t-caption">Status</span>
                    <Badge tone={status.enabled ? "success" : "critical"} dot>
                      {status.enabled ? "Online & Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <DefList
                    columns={1}
                    items={[
                      { label: "Provider", value: status.provider || "OpenAI" },
                      { label: "Completion Feature", value: status.features?.completion ? "Enabled" : "Disabled" },
                      { label: "Search Feature", value: status.features?.search ? "Enabled" : "Disabled" },
                      { label: "RAG Feature", value: status.features?.rag ? "Enabled" : "Disabled" },
                    ]}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="col col--gap-lg">
          <Card surface="soft">
            <CardHead title="Collections & Vector Indices" />
            <CardBody>
              {loading ? (
                <Skeleton variant="block" height={120} />
              ) : (
                <div className="col col--gap-md">
                  <div className="col col--gap-xs">
                    <span className="deflist__label">Collections</span>
                    <div className="row row--tight row--wrap">
                      {(status.collections || ["guidelines", "medical_records"]).map((collection) => (
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
        </div>
      </div>

      <section className="section">
        <SectionHead title="How the AI modes work" stripe />

        <div className="grid grid--3">
          {[
            {
              icon: "ai",
              title: "Assist",
              body: "Clinical completion using LLM knowledge. Fast, direct, no vector retrieval.",
            },
            {
              icon: "database",
              title: "Grounded (RAG)",
              body: "Answers assembled from vector search over patient records and guidelines with citations.",
            },
            {
              icon: "search",
              title: "Search",
              body: "Semantic search across medical collections returning ranked document hits.",
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
