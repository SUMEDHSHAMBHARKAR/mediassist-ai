import {
  aiStatus,
  aiUsage,
  conversationMessages,
  conversations,
  draftReply,
  reportAnalysis,
  searchResults,
} from "../mock/ai";
import { resolve } from "./mockTransport";

/**
 * AI service — the isolation boundary for the AI/RAG backend.
 *
 *   getStatus     -> GET  /ai/status
 *   complete      -> POST /ai/complete
 *   search        -> POST /ai/search
 *   rag           -> POST /ai/rag
 *   getUsage      -> GET  /ai/usage
 *
 * Every AI screen goes through this module, so connecting the real endpoints
 * does not touch the chat, composer, citation or analysis components.
 *
 * `complete` and `rag` currently return a clearly-labelled placeholder rather
 * than a fabricated clinical answer. That is deliberate: a convincing fake
 * clinical response in a medical product is actively unsafe.
 */
export const aiService = {
  getStatus() {
    return resolve(
      {
        enabled: true,
        provider: "OpenAI",
        features: {
          chat: true,
          search: true,
          ocr: false,
          rag: true,
        },
        collections: ["medical_records", "clinical_guidelines", "drug_database", "lab_reference"],
        ...aiStatus,
      },
      { delay: 220 },
    );
  },

  listConversations() {
    return resolve(conversations, { delay: 200 });
  },

  getConversation(conversationId) {
    return resolve(conversationMessages[conversationId] || [], { delay: 240 });
  },

  /** POST /ai/complete — ungrounded generation. */
  complete(requestPayload = {}) {
    const prompt = typeof requestPayload === "string" ? requestPayload : requestPayload.prompt;
    const task_type = requestPayload.task_type || "chat";
    const draft = draftReply(prompt, "assist");

    return resolve(
      {
        content: draft.content || draft.text || "AI response placeholder",
        task_type: task_type,
        model: "gpt-4o",
        tokens_used: 340,
        cost_estimate: 0.002,
        cached: false,
        duration_ms: 1100,
        ...draft,
      },
      { delay: 1_100 },
    );
  },

  /** POST /ai/rag — grounded generation with citations. */
  rag(requestPayload = {}) {
    const query = typeof requestPayload === "string" ? requestPayload : requestPayload.query || requestPayload.prompt;
    const draft = draftReply(query, "rag");

    return resolve(
      {
        content: draft.content || draft.text || "AI RAG response placeholder",
        query: query,
        task_type: "chat",
        model: "gpt-4o",
        tokens_used: 480,
        cost_estimate: 0.004,
        cached: false,
        duration_ms: 1400,
        citations: draft.citations || [],
        ...draft,
      },
      { delay: 1_400 },
    );
  },

  /** POST /ai/search — retrieval only, no generation. */
  search(requestPayload = {}) {
    const query = typeof requestPayload === "string" ? requestPayload : requestPayload.query;
    const term = String(query || "").trim().toLowerCase();

    const matches = term
      ? searchResults.filter(
          (entry) =>
            entry.title?.toLowerCase().includes(term) ||
            entry.excerpt?.toLowerCase().includes(term) ||
            entry.collection?.toLowerCase().includes(term),
        )
      : searchResults;

    const results = (matches.length > 0 ? matches : searchResults).map((m) => ({
      content: m.excerpt || m.content || m.title,
      score: m.score || 0.89,
      metadata: { title: m.title, collection: m.collection, source: m.source },
      ...m,
    }));

    return resolve(
      {
        results,
        query: query || "",
        total_results: results.length,
      },
      { delay: 700 },
    );
  },

  /** Report analysis workflow — composes retrieval with structured findings. */
  analyseReport(reportId) {
    return resolve({ ...reportAnalysis, reportId }, { delay: 1_600 });
  },

  getUsage() {
    return resolve(
      {
        total_requests: 1840,
        total_tokens: 2840000,
        total_cost: 42.85,
        requests_today: 142,
        average_latency_ms: 680.4,
        ...aiUsage,
      },
      { delay: 260 },
    );
  },
};

export default aiService;
