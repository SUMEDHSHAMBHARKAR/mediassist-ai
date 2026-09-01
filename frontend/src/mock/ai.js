import { daysAgo, hoursAgo, minutesAgo, recentDayLabels } from "./time";

/**
 * AI fixtures — shaped for GET /ai/status, POST /ai/complete, POST /ai/search,
 * POST /ai/rag and GET /ai/usage.
 *
 * Messages carry `sources` so the citation rail has real content to render
 * before the RAG backend is connected.
 */

export const aiStatus = {
  online: true,
  model: "MediAssist Clinical LLM",
  modelVersion: "2026.02",
  retrieval: {
    enabled: true,
    documentCount: 18_432,
    lastIndexedAt: hoursAgo(3),
    collections: ["Clinical guidelines", "Formulary", "Patient records", "Discharge summaries"],
  },
  latencyMs: 640,
  degradedFeatures: [],
};

export const promptSuggestions = [
  {
    id: "sug-1",
    icon: "records",
    title: "Summarise this patient's recent history",
    prompt:
      "Summarise the last three encounters for Aarav Sharma, highlighting changes in blood pressure management.",
  },
  {
    id: "sug-2",
    icon: "reports",
    title: "Interpret a report against guidelines",
    prompt:
      "Interpret the latest ambulatory blood pressure report for Aarav Sharma against current hypertension guidance.",
  },
  {
    id: "sug-3",
    icon: "prescriptions",
    title: "Check for interactions",
    prompt:
      "Check the active prescription for Rehan Qadri for interactions and monitoring requirements.",
  },
  {
    id: "sug-4",
    icon: "search",
    title: "Search the knowledge base",
    prompt:
      "What does our formulary recommend as second-line therapy for stage 2 hypertension with diabetes?",
  },
];

export const AI_MODES = [
  { value: "assist", label: "Assist", icon: "ai", hint: "General clinical reasoning" },
  { value: "rag", label: "Grounded", icon: "database", hint: "Answers cite retrieved documents" },
  { value: "search", label: "Search", icon: "search", hint: "Retrieval only, no generation" },
];

/** Conversation history for the left rail. */
export const conversations = [
  {
    id: "conv-1",
    title: "Hypertension escalation — Aarav Sharma",
    mode: "rag",
    updatedAt: minutesAgo(12),
    messageCount: 6,
    patientId: "pat-001",
  },
  {
    id: "conv-2",
    title: "Anticoagulation review — Rehan Qadri",
    mode: "rag",
    updatedAt: hoursAgo(3),
    messageCount: 8,
    patientId: "pat-005",
  },
  {
    id: "conv-3",
    title: "Asthma step-up guidance",
    mode: "assist",
    updatedAt: hoursAgo(20),
    messageCount: 4,
    patientId: "pat-009",
  },
  {
    id: "conv-4",
    title: "Formulary: second-line antihypertensives",
    mode: "search",
    updatedAt: daysAgo(2, 11, 0),
    messageCount: 2,
    patientId: null,
  },
  {
    id: "conv-5",
    title: "Sleep apnoea CPAP counselling notes",
    mode: "assist",
    updatedAt: daysAgo(4, 16, 0),
    messageCount: 5,
    patientId: "pat-016",
  },
];

const HYPERTENSION_SOURCES = [
  {
    id: "src-1",
    title: "Hypertension management protocol · v4.2",
    collection: "Clinical guidelines",
    excerpt:
      "For stage 2 hypertension with coexisting type 2 diabetes, initiate combination therapy with an ACE inhibitor or ARB plus a calcium channel blocker. Target below 130/80 mmHg where tolerated.",
    score: 0.94,
    page: 12,
  },
  {
    id: "src-2",
    title: "Encounter note · 24 hours ago",
    collection: "Patient records",
    excerpt:
      "Added amlodipine 5 mg once daily alongside existing telmisartan. Reinforced sodium restriction and continued metformin.",
    score: 0.91,
    page: null,
  },
  {
    id: "src-3",
    title: "Ambulatory blood pressure monitoring report",
    collection: "Reports",
    excerpt:
      "24-hour mean of 146/92 mmHg with blunted nocturnal dip. Consistent with sustained hypertension.",
    score: 0.88,
    page: 1,
  },
  {
    id: "src-4",
    title: "Formulary entry · Amlodipine",
    collection: "Formulary",
    excerpt:
      "Peripheral oedema is the most common dose-limiting effect. Review at two to four weeks after initiation or dose change.",
    score: 0.79,
    page: 44,
  },
];

/** Seeded thread for the default conversation. */
export const conversationMessages = {
  "conv-1": [
    {
      id: "msg-1",
      role: "user",
      content:
        "Summarise the last three encounters for Aarav Sharma, highlighting changes in blood pressure management.",
      at: minutesAgo(18),
    },
    {
      id: "msg-2",
      role: "assistant",
      at: minutesAgo(17),
      content:
        "Across the last three encounters, blood pressure control has been the dominant clinical thread and has been escalated stepwise.\n\n**Most recent visit (yesterday)** — Home readings persistently above 150/95 mmHg. Amlodipine 5 mg once daily was added to existing telmisartan 40 mg. Sodium restriction reinforced and metformin continued unchanged.\n\n**Previous visit** — Ambulatory monitoring was requested after clinic readings diverged from home readings. The 24-hour mean returned at 146/92 mmHg with a blunted nocturnal dip.\n\n**Earlier visit** — Single-agent therapy with dose optimisation only; glycaemic control was the primary focus at that point, with HbA1c recorded at 7.8%.\n\nThe pattern is a move from monotherapy to combination therapy driven by objective ambulatory data rather than clinic readings alone.",
      sources: HYPERTENSION_SOURCES,
      tokens: 412,
      latencyMs: 1840,
    },
    {
      id: "msg-3",
      role: "user",
      content: "What should be monitored now that amlodipine has been added?",
      at: minutesAgo(14),
    },
    {
      id: "msg-4",
      role: "assistant",
      at: minutesAgo(13),
      content:
        "Three monitoring priorities follow from the current regimen.\n\n**Blood pressure response** — Guidance recommends review at two to four weeks after initiation or dose change. Home readings twice daily give the most reliable signal here, and the patient already keeps a log.\n\n**Peripheral oedema** — This is the most common dose-limiting effect of amlodipine. Ankle swelling should prompt review rather than self-discontinuation.\n\n**Renal function and potassium** — Because telmisartan is continued, a repeat metabolic panel is appropriate alongside the next blood pressure review. The previous creatinine and electrolytes were within range.\n\nA documented penicillin allergy is recorded but is not relevant to this regimen.",
      sources: [HYPERTENSION_SOURCES[0], HYPERTENSION_SOURCES[3], HYPERTENSION_SOURCES[1]],
      tokens: 298,
      latencyMs: 1520,
    },
  ],
};

/** Retrieval-only results for the Search mode. */
export const searchResults = [
  {
    id: "res-1",
    title: "Hypertension management protocol · v4.2",
    collection: "Clinical guidelines",
    excerpt:
      "For stage 2 hypertension with coexisting type 2 diabetes, initiate combination therapy with an ACE inhibitor or ARB plus a calcium channel blocker.",
    score: 0.94,
    updatedAt: daysAgo(40),
  },
  {
    id: "res-2",
    title: "Formulary entry · Amlodipine",
    collection: "Formulary",
    excerpt:
      "Dihydropyridine calcium channel blocker. Usual starting dose 5 mg once daily, maximum 10 mg. Peripheral oedema is dose-related.",
    score: 0.9,
    updatedAt: daysAgo(96),
  },
  {
    id: "res-3",
    title: "Diabetes and cardiovascular risk pathway",
    collection: "Clinical guidelines",
    excerpt:
      "Blood pressure targets in diabetes should account for albuminuria status. Below 130/80 mmHg is appropriate where tolerated.",
    score: 0.83,
    updatedAt: daysAgo(120),
  },
  {
    id: "res-4",
    title: "Combination therapy adherence review",
    collection: "Clinical guidelines",
    excerpt:
      "Single-pill combinations improve adherence relative to separate tablets and should be considered once doses are stable.",
    score: 0.74,
    updatedAt: daysAgo(210),
  },
];

/** Report analysis workflow output. */
export const reportAnalysis = {
  reportId: "rep-4001",
  status: "complete",
  completedAt: hoursAgo(1),
  confidence: 0.91,
  headline:
    "Sustained stage 2 hypertension with loss of nocturnal dip. Combination therapy is appropriate.",
  findings: [
    {
      id: "fin-1",
      label: "24-hour mean",
      value: "146/92 mmHg",
      severity: "urgent",
      note: "Above the 130/80 mmHg target for a patient with type 2 diabetes.",
    },
    {
      id: "fin-2",
      label: "Nocturnal dip",
      value: "4%",
      severity: "urgent",
      note: "Blunted. A dip below 10% is associated with higher cardiovascular risk.",
    },
    {
      id: "fin-3",
      label: "Daytime variability",
      value: "Within range",
      severity: "routine",
      note: "No evidence of white-coat effect.",
    },
    {
      id: "fin-4",
      label: "Heart rate",
      value: "88 bpm mean",
      severity: "routine",
      note: "No chronotropic concern.",
    },
  ],
  recommendations: [
    "Review blood pressure response two to four weeks after the amlodipine addition.",
    "Repeat renal function and potassium alongside the next review.",
    "Ask about ankle swelling explicitly at the next contact.",
  ],
  sources: HYPERTENSION_SOURCES,
};

export const aiUsage = {
  period: "Current billing month",
  requests: { used: 3_412, limit: 10_000 },
  tokens: { used: 1_284_600, limit: 4_000_000 },
  retrievalQueries: { used: 1_186, limit: 5_000 },
  averageLatencyMs: 1_640,
  dailySeries: recentDayLabels(7).map((label, index) => ({
    label,
    value: [412, 486, 521, 604, 588, 342, 128][index],
  })),
  byFeature: [
    { label: "Grounded answers", value: 1_642 },
    { label: "Report analysis", value: 884 },
    { label: "Knowledge search", value: 612 },
    { label: "Note drafting", value: 274 },
  ],
};

/**
 * Canned assistant reply used while the AI backend is not connected.
 * The composer resolves this through aiService so swapping in POST /ai/complete
 * requires no change in the chat components.
 */
export function draftReply(prompt, mode) {
  const grounded = mode === "rag";

  return {
    content:
      `I do not have a live model connection in this environment, so this is a placeholder response to: “${prompt.trim()}”.\n\n` +
      (grounded
        ? "In grounded mode the answer would be assembled only from retrieved documents, and every claim would carry a citation to the sources listed alongside this message."
        : "In assist mode the answer would come from the clinical model without retrieval, so it would carry no citations and should not be relied on for dosing decisions.") +
      "\n\nConnect the AI service to replace this text with a real completion.",
    sources: grounded ? HYPERTENSION_SOURCES.slice(0, 3) : [],
    tokens: 180,
    latencyMs: 1_200,
  };
}

export { HYPERTENSION_SOURCES };
