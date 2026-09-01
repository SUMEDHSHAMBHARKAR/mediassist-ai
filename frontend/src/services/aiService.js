import { api } from "./apiClient";
import {
  conversationMessages,
  conversations,
  reportAnalysis,
} from "../mock/ai";

/**
 * AI service connected to FastAPI endpoints:
 *   getStatus  -> GET  /ai/status
 *   complete   -> POST /ai/complete
 *   search     -> POST /ai/search
 *   rag        -> POST /ai/rag
 *   getUsage   -> GET  /ai/usage
 */
export const aiService = {
  async getStatus() {
    const status = await api.get("/ai/status");
    return {
      online: Boolean(status.enabled),
      model: status.provider || "Not configured",
      modelVersion: "Configured",
      latencyMs: 0,
      retrieval: {
        enabled: Boolean(status.features?.rag),
        documentCount: 0,
        lastIndexedAt: new Date().toISOString(),
        collections: status.collections || [],
      },
    };
  },

  async getUsage() {
    const usage = await api.get("/ai/usage");
    return {
      period: "Current usage",
      requests: { used: usage.total_requests ?? 0, limit: 1000 },
      tokens: { used: usage.total_tokens ?? 0, limit: 1_000_000 },
      retrievalQueries: { used: 0, limit: 1000 },
      averageLatencyMs: usage.average_latency_ms ?? 0,
      dailySeries: [],
      byFeature: [],
    };
  },

  complete(requestPayload = {}) {
    const body = typeof requestPayload === "string"
      ? { task_type: "chat", prompt: requestPayload }
      : {
          task_type: requestPayload.task_type || "chat",
          prompt: requestPayload.prompt || "",
          system_prompt: requestPayload.system_prompt,
          context: requestPayload.context,
          temperature: requestPayload.temperature ?? 0.7,
          max_tokens: requestPayload.max_tokens ?? 1000,
        };
    return api.post("/ai/complete", body);
  },

  rag(requestPayload = {}) {
    const body = typeof requestPayload === "string"
      ? { query: requestPayload, context_type: "medical_records", top_k: 5 }
      : {
          query: requestPayload.query || requestPayload.prompt || "",
          context_type: requestPayload.context_type || requestPayload.collection || "medical_records",
          top_k: requestPayload.top_k || 5,
        };
    return api.post("/ai/rag", body);
  },

  search(requestPayload = {}) {
    const body = typeof requestPayload === "string"
      ? { collection: "medical_records", query: requestPayload, top_k: 5 }
      : {
          collection: requestPayload.collection || "medical_records",
          query: requestPayload.query || "",
          top_k: requestPayload.top_k || 5,
          filters: requestPayload.filters,
        };
    return api.post("/ai/search", body);
  },

  listConversations() {
    return Promise.resolve(conversations);
  },

  getConversation(conversationId) {
    return Promise.resolve(conversationMessages[conversationId] || []);
  },

  analyseReport(reportId) {
    return Promise.resolve({ ...reportAnalysis, reportId });
  },
};

export default aiService;
