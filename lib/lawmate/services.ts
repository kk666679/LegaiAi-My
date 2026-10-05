import {
  MOCK_ACTIVITY,
  MOCK_ANALYSIS,
  MOCK_CONVERSATIONS,
  MOCK_DASHBOARD_METRICS,
  MOCK_DOCUMENTS,
  MOCK_DOCUMENT_OWNERS,
  MOCK_DRAFTS,
  MOCK_INITIAL_MESSAGES,
  MOCK_MATTERS,
  MOCK_NOTIFICATIONS,
  MOCK_RISKS,
  MOCK_SAVED,
  MOCK_SEARCH_RESULTS,
  MOCK_TASKS,
  MOCK_USER,
  PROMPT_SUGGESTIONS,
} from "@/lib/lawmate/data";
import type {
  AppNotification,
  Conversation,
  DashboardMetrics,
  Document,
  DocumentAnalysis,
  Draft,
  LegalTask,
  Matter,
  Message,
  PromptSuggestion,
  RecentActivity,
  ResearchResult,
  RiskItem,
  SavedItem,
  User,
} from "@/types/lawmate";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface AIService {
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Message[]>;
  sendMessage(input: string, context?: { conversationId?: string }): Promise<Message>;
}

export interface DocumentService {
  list(): Promise<Document[]>;
  get(id: string): Promise<Document | null>;
  upload(file: File): Promise<Document>;
  getAnalysis(id: string): Promise<DocumentAnalysis | null>;
}

export interface LegalResearchService {
  search(query: string, filters?: { area?: string; source?: string }): Promise<ResearchResult[]>;
  getSuggestions(): PromptSuggestion[];
}

export interface MatterService {
  list(): Promise<Matter[]>;
  get(id: string): Promise<Matter | null>;
  create(input: { name: string; client?: string; priority?: Matter["priority"] }): Promise<Matter>;
}

export interface TaskService {
  list(): Promise<LegalTask[]>;
  update(id: string, patch: Partial<LegalTask>): Promise<LegalTask | null>;
  create(input: Omit<LegalTask, "id">): Promise<LegalTask>;
}

export interface NotificationService {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface SearchService {
  global(query: string): Promise<Array<{ kind: string; title: string; href: string }>>;
}

export interface UserService {
  me(): Promise<User>;
}

export interface AnalyticsService {
  dashboard(): Promise<DashboardMetrics>;
  activity(): Promise<RecentActivity[]>;
  risks(): Promise<RiskItem[]>;
}

export interface SavedService {
  list(): Promise<SavedItem[]>;
  remove(id: string): Promise<void>;
}

export interface DraftService {
  list(): Promise<Draft[]>;
  get(id: string): Promise<Draft | null>;
  update(id: string, body: string): Promise<Draft | null>;
  create(template: string): Promise<Draft>;
}

export const mockAI: AIService = {
  async listConversations() {
    await delay(80);
    return MOCK_CONVERSATIONS;
  },
  async getConversation() {
    await delay(80);
    return MOCK_INITIAL_MESSAGES;
  },
  async sendMessage(input) {
    await delay(120);
    return {
      id: `m-${Date.now()}`,
      role: "assistant",
      content: `(Demo) Streaming response for: "${input.slice(0, 80)}". In a production build, this would stream from the agent runtime with citations and tool execution.`,
      createdAt: new Date().toISOString(),
      verified: true,
      suggestions: PROMPT_SUGGESTIONS.slice(0, 4).map((p) => p.label),
    };
  },
};

export const mockDocuments: DocumentService = {
  async list() {
    await delay(60);
    return MOCK_DOCUMENTS;
  },
  async get(id) {
    await delay(40);
    return MOCK_DOCUMENTS.find((d) => d.id === id) ?? null;
  },
  async upload(file) {
    await delay(200);
    return {
      id: `d-${Date.now()}`,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: "processing",
      matterId: undefined,
      classification: "internal",
      pageCount: undefined,
      owner: MOCK_DOCUMENT_OWNERS[0]!,
      client: { id: "c-unknown", name: "N/A" },
      statusBadge: "Processing",
      tags: [],
      version: 1,
      aiInsights: "analyzing",
      sharedWithMe: false,
    };
  },
  async getAnalysis(id) {
    await delay(40);
    if (id === MOCK_ANALYSIS.documentId) return MOCK_ANALYSIS;
    return null;
  },
};

export const mockResearch: LegalResearchService = {
  async search() {
    await delay(80);
    return MOCK_SEARCH_RESULTS;
  },
  getSuggestions() {
    return PROMPT_SUGGESTIONS;
  },
};

export const mockMatters: MatterService = {
  async list() {
    await delay(60);
    return MOCK_MATTERS;
  },
  async get(id) {
    await delay(40);
    return MOCK_MATTERS.find((m) => m.id === id) ?? null;
  },
  async create(input) {
    await delay(80);
    return {
      id: `m-${Date.now()}`,
      number: `M-${new Date().getFullYear()}-${(MOCK_MATTERS.length + 1)
        .toString()
        .padStart(3, "0")}`,
      name: input.name,
      client: input.client,
      priority: input.priority ?? "medium",
      status: "active",
      documentsCount: 0,
      conversationsCount: 0,
      tasksCount: 0,
      researchCount: 0,
      updatedAt: new Date().toISOString(),
      classification: "internal",
    };
  },
};

export const mockTasks: TaskService = {
  async list() {
    await delay(40);
    return MOCK_TASKS;
  },
  async update(id, patch) {
    await delay(40);
    const idx = MOCK_TASKS.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    return { ...MOCK_TASKS[idx]!, ...patch };
  },
  async create(input) {
    await delay(60);
    return { ...input, id: `t-${Date.now()}` };
  },
};

export const mockNotifications: NotificationService = {
  async list() {
    await delay(40);
    return MOCK_NOTIFICATIONS;
  },
  async markRead(id) {
    await delay(20);
    const n = MOCK_NOTIFICATIONS.find((x) => x.id === id);
    if (n) n.read = false;
  },
  async markAllRead() {
    await delay(20);
    MOCK_NOTIFICATIONS.forEach((n) => (n.read = true));
  },
};

export const mockSearch: SearchService = {
  async global(query) {
    await delay(40);
    const q = query.toLowerCase();
    const items: Array<{ kind: string; title: string; href: string }> = [];
    MOCK_DOCUMENTS.forEach((d) =>
      d.name.toLowerCase().includes(q)
        ? items.push({ kind: "document", title: d.name, href: "/legalai/documents" })
        : null,
    );
    MOCK_MATTERS.forEach((m) =>
      m.name.toLowerCase().includes(q)
        ? items.push({ kind: "matter", title: m.name, href: "/legalai/matters" })
        : null,
    );
    MOCK_CONVERSATIONS.forEach((c) =>
      c.title.toLowerCase().includes(q)
        ? items.push({ kind: "conversation", title: c.title, href: "/legalai/assistant" })
        : null,
    );
    MOCK_DRAFTS.forEach((d) =>
      d.title.toLowerCase().includes(q)
        ? items.push({ kind: "draft", title: d.title, href: "/legalai/draft" })
        : null,
    );
    return items.slice(0, 10);
  },
};

export const mockUser: UserService = {
  async me() {
    return MOCK_USER;
  },
};

export const mockAnalytics: AnalyticsService = {
  async dashboard() {
    await delay(60);
    return MOCK_DASHBOARD_METRICS;
  },
  async activity() {
    await delay(40);
    return MOCK_ACTIVITY;
  },
  async risks() {
    await delay(40);
    return MOCK_RISKS;
  },
};

export const mockSaved: SavedService = {
  async list() {
    await delay(40);
    return MOCK_SAVED;
  },
  async remove(id) {
    await delay(20);
    const idx = MOCK_SAVED.findIndex((s) => s.id === id);
    if (idx >= 0) MOCK_SAVED.splice(idx, 1);
  },
};

export const mockDrafts: DraftService = {
  async list() {
    await delay(40);
    return MOCK_DRAFTS;
  },
  async get(id) {
    await delay(30);
    return MOCK_DRAFTS.find((d) => d.id === id) ?? null;
  },
  async update(id, body) {
    await delay(40);
    const d = MOCK_DRAFTS.find((x) => x.id === id);
    if (!d) return null;
    d.body = body;
    d.updatedAt = new Date().toISOString();
    return d;
  },
  async create(template) {
    await delay(40);
    return {
      id: `dr-${Date.now()}`,
      title: `New ${template.replace("_", " ")}`,
      template: template as Draft["template"],
      body: "",
      updatedAt: new Date().toISOString(),
      status: "draft",
    };
  },
};

export const lawmate = {
  ai: mockAI,
  documents: mockDocuments,
  research: mockResearch,
  matters: mockMatters,
  tasks: mockTasks,
  notifications: mockNotifications,
  search: mockSearch,
  user: mockUser,
  analytics: mockAnalytics,
  saved: mockSaved,
  drafts: mockDrafts,
};

export type LawMate = typeof lawmate;