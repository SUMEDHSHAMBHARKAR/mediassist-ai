import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import AIComposer from "../../components/ai/AIComposer";
import AIMessage, { AITyping } from "../../components/ai/AIMessage";
import ConversationList from "../../components/ai/ConversationList";
import SourceCard from "../../components/ai/SourceCard";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import IconButton from "../../components/ui/IconButton";
import Modal from "../../components/ui/Modal";
import { EmptyState, LoadingState, SkeletonRows } from "../../components/ui/States";
import { AI_MODES, promptSuggestions } from "../../mock/ai";
import { useAuth } from "../../context/AuthContext";
import useAsyncData from "../../hooks/useAsyncData";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import aiService from "../../services/aiService";
import patientsService from "../../services/patientsService";
import { formatNumber, formatRelative } from "../../utils/format";

let turnSeq = 0;
const nextId = () => {
  turnSeq += 1;
  return `turn-${Date.now()}-${turnSeq}`;
};

/**
 * AIAssistant — the AI workspace.
 *
 * Three columns: conversation history, the thread, and a context rail carrying
 * retrieved sources and patient context. Every call goes through aiService, so
 * connecting /ai/complete, /ai/rag and /ai/search touches nothing here.
 */
function AIAssistant() {
  useDocumentTitle("AI Assistant");

  const [params, setParams] = useSearchParams();
  const { user } = useAuth();

  const patientId = params.get("patientId");

  const [activeId, setActiveId] = useState("conv-1");
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("rag");
  const [busy, setBusy] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(null);
  const [searchHits, setSearchHits] = useState(null);
  const [copied, setCopied] = useState(false);

  const threadRef = useRef(null);
  const cancelledRef = useRef(false);

  const { data: status } = useAsyncData(() => aiService.getStatus(), []);
  const { data: conversations, loading: convosLoading } = useAsyncData(
    () => aiService.listConversations(),
    [],
    { initialData: [] },
  );
  const { data: patient } = useAsyncData(
    () => patientsService.getById(patientId),
    [patientId],
    { enabled: Boolean(patientId) },
  );

  // Load the selected thread.
  useEffect(() => {
    let stale = false;
    setThreadLoading(true);

    aiService
      .getConversation(activeId)
      .then((result) => {
        if (stale) return;
        setMessages(result);
        setThreadLoading(false);
      })
      .catch(() => {
        if (stale) return;
        setMessages([]);
        setThreadLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [activeId]);

  // Keep the newest turn in view.
  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  const lastSources =
    [...messages].reverse().find((message) => message.sources?.length > 0)?.sources || [];

  const send = async (text = prompt, requestedMode = mode) => {
    const content = text.trim();
    if (!content || busy) return;

    cancelledRef.current = false;

    const userTurn = {
      id: nextId(),
      role: "user",
      content,
      at: new Date().toISOString(),
    };

    setMessages((current) => [...current, userTurn]);
    setPrompt("");
    setBusy(true);
    setSearchHits(null);

    try {
      if (requestedMode === "search") {
        const hits = await aiService.search({ query: content });
        if (cancelledRef.current) return;

        setSearchHits(hits);
        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: "assistant",
            mode: "search",
            at: new Date().toISOString(),
            content: `Retrieval returned ${hits.length} document${hits.length === 1 ? "" : "s"} for “${content}”. No answer was generated in Search mode — open the results in the context panel to read them.`,
            sources: hits.map((hit) => ({ ...hit, page: null })),
          },
        ]);
        return;
      }

      const reply =
        requestedMode === "rag"
          ? await aiService.rag({ prompt: content, patientId })
          : await aiService.complete({ prompt: content, patientId });

      if (cancelledRef.current) return;

      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: "assistant",
          mode: requestedMode,
          at: new Date().toISOString(),
          ...reply,
        },
      ]);
    } catch (cause) {
      if (cancelledRef.current) return;

      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: "error",
          at: new Date().toISOString(),
          content:
            cause instanceof Error
              ? `The request did not complete: ${cause.message}`
              : "The request did not complete.",
          failedPrompt: content,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const stop = () => {
    cancelledRef.current = true;
    setBusy(false);
    setMessages((current) => [
      ...current,
      {
        id: nextId(),
        role: "error",
        at: new Date().toISOString(),
        content: "Generation stopped before the answer was complete.",
      },
    ]);
  };

  const copy = (message) => {
    navigator.clipboard?.writeText(message.content).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false),
    );
  };

  const startNew = () => {
    setActiveId(`new-${Date.now()}`);
    setMessages([]);
    setSearchHits(null);
    setPrompt("");
  };

  const clearContext = () => {
    const next = new URLSearchParams(params);
    next.delete("patientId");
    setParams(next, { replace: true });
  };

  const isEmptyThread = !threadLoading && messages.length === 0;

  return (
    <div className="ai">
      {/* History rail */}
      <aside className="ai__rail">
        <div className="ai__rail-head">
          <span className="t-label t-label--sm t-label--ink">Conversations</span>
          <IconButton icon="plus" label="New conversation" size="sm" onClick={startNew} />
        </div>

        <div className="ai__rail-scroll">
          <ConversationList
            conversations={conversations || []}
            activeId={activeId}
            onSelect={(conversation) => setActiveId(conversation.id)}
            loading={convosLoading}
          />
        </div>

        <div className="sidebar__footer">
          <Link to="/ai/usage" className="row row--tight t-caption">
            <Icon name="analytics" size={13} />
            Usage and quota
            <span className="grow" />
            <Icon name="arrowRight" size={12} />
          </Link>
        </div>
      </aside>

      {/* Thread */}
      <main className="ai__main">
        <div className="ai__topbar">
          <div className="row row--tight">
            <span className="stripe--mark" aria-hidden="true" style={{ minHeight: 28 }} />
            <div className="col col--gap-xxs">
              <span className="t-data t-ink">AI Assistant</span>
              <span className="t-caption row row--tight">
                {status ? (
                  <>
                    <span
                      className="badge__dot"
                      style={{
                        background: status.online ? "var(--success)" : "var(--critical)",
                      }}
                      aria-hidden="true"
                    />
                    {status.model} · {status.modelVersion}
                  </>
                ) : (
                  "Checking service"
                )}
              </span>
            </div>
          </div>

          <div className="row row--tight">
            {status?.retrieval?.enabled && (
              <Badge tone="accent" icon="database" className="hide-mobile">
                {formatNumber(status.retrieval.documentCount)} documents indexed
              </Badge>
            )}
            <Button size="sm" variant="ghost" icon="plus" onClick={startNew}>
              New
            </Button>
          </div>
        </div>

        <div className="ai__thread" ref={threadRef}>
          <div className="ai__thread-inner">
            {threadLoading ? (
              <LoadingState label="Loading conversation" />
            ) : isEmptyThread ? (
              <>
                <div className="ai-hero">
                  <span className="ai-hero__mark" aria-hidden="true">
                    <Icon name="ai" size={24} />
                  </span>
                  <h1 className="t-display-sm">Clinical AI assistant</h1>
                  <p className="t-body" style={{ marginTop: "var(--s-sm)" }}>
                    Ask about a patient's history, interpret a report against
                    guidance, or search the knowledge base. In Grounded mode every
                    claim carries a citation to the document it came from.
                  </p>
                </div>

                <div className="col col--gap-xs">
                  <span className="t-label t-label--sm">Try one of these</span>
                  {promptSuggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.id}
                      className="suggestion"
                      onClick={() => {
                        setPrompt(suggestion.prompt);
                        send(suggestion.prompt);
                      }}
                    >
                      <span className="suggestion__icon" aria-hidden="true">
                        <Icon name={suggestion.icon} size={16} />
                      </span>
                      <span className="col col--gap-xxs">
                        <span className="t-data t-ink">{suggestion.title}</span>
                        <span className="t-caption">{suggestion.prompt}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <Banner tone="warning" icon="alertTriangle">
                  The assistant supports clinical reasoning. It does not make
                  decisions, and its output must be verified against the source
                  record before it informs care.
                </Banner>
              </>
            ) : (
              <>
                {messages.map((message) => (
                  <AIMessage
                    key={message.id}
                    message={message}
                    authorName={user?.name || "You"}
                    onCopy={copy}
                    onOpenSource={setSourceOpen}
                    onRetry={
                      message.failedPrompt
                        ? () => send(message.failedPrompt, mode)
                        : undefined
                    }
                  />
                ))}

                {busy && (
                  <AITyping
                    label={mode === "search" ? "Searching" : "Thinking"}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="ai__composer">
          <div className="ai__composer-inner">
            {copied && (
              <p className="t-caption" style={{ marginBottom: "var(--s-xs)" }}>
                Copied to clipboard.
              </p>
            )}

            <AIComposer
              value={prompt}
              onChange={setPrompt}
              onSubmit={() => send()}
              modes={AI_MODES}
              mode={mode}
              onModeChange={setMode}
              busy={busy}
              onStop={stop}
              contextChip={patient ? `${patient.name} · ${patient.mrn}` : null}
              onClearContext={patient ? clearContext : undefined}
              placeholder={
                mode === "search"
                  ? "Search guidelines, formulary and records"
                  : "Ask about a patient, a report or a guideline"
              }
            />
          </div>
        </div>
      </main>

      {/* Context rail */}
      <aside className="ai__rail ai__rail--end">
        <div className="ai__rail-head">
          <span className="t-label t-label--sm t-label--ink">
            {searchHits ? "Search results" : "Context"}
          </span>
          {searchHits && (
            <IconButton
              icon="close"
              label="Clear search results"
              size="sm"
              onClick={() => setSearchHits(null)}
            />
          )}
        </div>

        <div className="ai__rail-scroll">
          <div style={{ padding: "var(--s-md)" }} className="col col--gap-lg">
            {searchHits ? (
              <div className="col col--gap-xs">
                <span className="t-caption">
                  {searchHits.length} document
                  {searchHits.length === 1 ? "" : "s"} retrieved
                </span>
                {searchHits.map((hit, index) => (
                  <SourceCard
                    key={hit.id}
                    source={hit}
                    index={index}
                    onOpen={setSourceOpen}
                  />
                ))}
              </div>
            ) : (
              <>
                {patient && (
                  <section className="col col--gap-sm">
                    <span className="t-label t-label--sm">Patient context</span>

                    <div className="card card--soft">
                      <div className="card__body card__body--tight col col--gap-xs">
                        <Link to={`/patients/${patient.id}`} className="t-data t-ink">
                          {patient.name}
                        </Link>
                        <span className="t-caption">{patient.mrn}</span>

                        {patient.allergies?.length > 0 && (
                          <span className="row row--tight t-caption t-critical">
                            <Icon name="alertTriangle" size={12} />
                            {patient.allergies.join(", ")}
                          </span>
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
                    </div>

                    <p className="t-caption">
                      The assistant may use this patient's records when answering in
                      Grounded mode.
                    </p>
                  </section>
                )}

                <section className="col col--gap-sm">
                  <span className="t-label t-label--sm">Cited sources</span>

                  {threadLoading ? (
                    <SkeletonRows rows={2} />
                  ) : lastSources.length === 0 ? (
                    <EmptyState
                      size="inline"
                      icon="database"
                      title="No citations yet"
                      message="Ask something in Grounded mode and the documents behind the answer appear here."
                    />
                  ) : (
                    <div className="col col--gap-xs">
                      {lastSources.map((source, index) => (
                        <SourceCard
                          key={source.id}
                          source={source}
                          index={index}
                          onOpen={setSourceOpen}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {status?.retrieval && (
                  <section className="col col--gap-sm">
                    <span className="t-label t-label--sm">Knowledge base</span>

                    <div className="card card--soft">
                      <div className="card__body card__body--tight col col--gap-xs">
                        <div className="row row--between">
                          <span className="t-caption">Documents</span>
                          <span className="t-data t-ink t-tabular">
                            {formatNumber(status.retrieval.documentCount)}
                          </span>
                        </div>
                        <div className="row row--between">
                          <span className="t-caption">Last indexed</span>
                          <span className="t-caption t-strong">
                            {formatRelative(status.retrieval.lastIndexedAt)}
                          </span>
                        </div>

                        <div className="divider" />

                        <div className="row row--tight row--wrap">
                          {status.retrieval.collections.map((collection) => (
                            <Badge key={collection} tone="muted">
                              {collection}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                <section className="col col--gap-sm">
                  <span className="t-label t-label--sm">Workflows</span>
                  <Button variant="surface" icon="reports" block to="/ai/analysis">
                    Report analysis
                  </Button>
                  <Button variant="surface" icon="analytics" block to="/ai/usage">
                    Usage and quota
                  </Button>
                </section>
              </>
            )}
          </div>
        </div>
      </aside>

      <Modal
        open={Boolean(sourceOpen)}
        onClose={() => setSourceOpen(null)}
        size="md"
        title={sourceOpen?.title}
        subtitle={
          sourceOpen
            ? `${sourceOpen.collection}${sourceOpen.page ? ` · page ${sourceOpen.page}` : ""}`
            : undefined
        }
        footer={
          <Button variant="ghost" onClick={() => setSourceOpen(null)}>
            Close
          </Button>
        }
      >
        {sourceOpen && (
          <div className="col col--gap-md">
            {sourceOpen.score !== undefined && (
              <div className="row row--tight">
                <Badge tone="accent">
                  {Math.round(sourceOpen.score * 100)}% relevance
                </Badge>
                <Badge tone="muted">{sourceOpen.collection}</Badge>
              </div>
            )}

            <blockquote
              className="card card--inset"
              style={{ padding: "var(--s-md)", margin: 0 }}
            >
              <p className="t-body">{sourceOpen.excerpt}</p>
            </blockquote>

            <Banner tone="accent" icon="info">
              This is the retrieved extract. Opening the full document requires the
              retrieval service, which is not connected yet.
            </Banner>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AIAssistant;
