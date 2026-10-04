import type {
  AppNotification,
  AIUsage,
  ComposerContext,
  Conversation,
  DashboardMetrics,
  Document,
  DocumentActivity,
  DocumentAnalysis,
  DocumentAnalysisSummary,
  DocumentBadge,
  DocumentComment,
  DocumentOwner,
  DocumentVersion,
  Draft,
  LegalArea,
  LegalSource,
  LegalTask,
  Matter,
  MatterStatus,
  Message,
  PromptSuggestion,
  RecentActivity,
  ResearchResult,
  RiskCategory,
  RiskItem,
  SavedItem,
  ToolExecution,
  User,
} from "@/types/lawmate";


// Module-level mock data must not call `Date.now()` because that drifts between
// SSR and client render → React hydration mismatch (server rendered "4m ago"
// while client rendered "just now"). The mock timestamps are fake by definition,
// so we anchor them to a fixed reference epoch. The relative-time display
// buckets in days/hours, so a stable offset is visually correct.
const MOCK_NOW = new Date('2026-09-01T22:00:00.000Z');
const now = () => MOCK_NOW.toISOString();
const isoDaysFromNow = (d: number) =>
  new Date(MOCK_NOW.getTime() + d * 86400000).toISOString();

export const MOCK_USER: User = {
  id: "u-001",
  name: "Aisyah Rahman",
  email: "aisyah@lawmate.ai",
  role: "lawyer",
  organisation: "Rahman & Partners",
};

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: "s1",
    label: "Review this employment clause",
    prompt: "Review the attached employment clause for risks and compliance with Malaysian employment law.",
    category: "review",
  },
  {
    id: "s2",
    label: "Explain this section in plain English",
    prompt: "Explain the following section of the Act in plain English and list the practical implications.",
    category: "research",
  },
  {
    id: "s3",
    label: "Is this hostel rule legally compliant?",
    prompt: "Assess whether this hostel rule is compliant with Malaysian housing and tenancy regulations.",
    category: "review",
  },
  {
    id: "s4",
    label: "Find potential legal risks",
    prompt: "Identify potential legal risks in the attached document, with severity and recommended mitigation.",
    category: "analyse",
  },
  {
    id: "s5",
    label: "Compare these two documents",
    prompt: "Compare the two attached documents and summarise the key differences in obligations and risks.",
    category: "compare",
  },
  {
    id: "s6",
    label: "Draft a compliant clause",
    prompt: "Draft a compliant payment clause aligned with Malaysian contract law best practice.",
    category: "draft",
  },
  {
    id: "s7",
    label: "Summarise this Act",
    prompt: "Provide a structured summary of this Act with sections, scope and key obligations.",
    category: "research",
  },
  {
    id: "s8",
    label: "Identify employee obligations",
    prompt: "Extract all employee obligations from this employment agreement and explain enforceability.",
    category: "analyse",
  },
];

export const MALAYSIAN_SOURCES: LegalSource[] = [
  {
    id: "src-emp-1955",
    title: "Employment Act 1955",
    type: "act",
    authority: "Federal",
    jurisdiction: "Malaysia",
    area: "Employment",
    section: "Part XI",
    url: "https://www.legislation.gov.my/act-265",
    publishedAt: "1955-01-01",
    excerpt:
      "An Act to provide for the regulation of the terms and conditions of employment of workmen.",
    verified: true,
    relevance: 0.95,
  },
  {
    id: "src-contracts-1950",
    title: "Contracts Act 1950",
    type: "act",
    authority: "Federal",
    jurisdiction: "Malaysia",
    area: "Contract",
    section: "Section 10",
    url: "https://www.legislation.gov.my/act-136",
    publishedAt: "1950-01-01",
    excerpt: "All agreements are contracts if they are made by the free consent of parties.",
    verified: true,
    relevance: 0.9,
  },
  {
    id: "src-pdpa-2010",
    title: "Personal Data Protection Act 2010",
    type: "act",
    authority: "Federal",
    jurisdiction: "Malaysia",
    area: "Data Protection",
    section: "Section 7",
    url: "https://www.pdp.gov.my",
    publishedAt: "2010-06-02",
    excerpt: "General principle: personal data shall not be processed without consent.",
    verified: true,
    relevance: 0.88,
  },
  {
    id: "src-industrial-1967",
    title: "Industrial Relations Act 1967",
    type: "act",
    authority: "Federal",
    jurisdiction: "Malaysia",
    area: "Employment",
    section: "Section 20",
    url: "https://www.legislation.gov.my/act-177",
    publishedAt: "1967-01-01",
    excerpt: "Right to terminate a contract of service.",
    verified: true,
    relevance: 0.8,
  },
  {
    id: "src-cas-emp",
    title: "Sivaguru a/l Siva Subramaniam v Suruhanjaya Perkhidmatan Awam [2023] 1 MLJ 184",
    type: "case",
    authority: "Federal Court",
    jurisdiction: "Malaysia",
    area: "Employment",
    url: "https://elaw.mlaw.gov.my",
    publishedAt: "2023-02-10",
    excerpt: "On procedural fairness in disciplinary proceedings.",
    verified: true,
    relevance: 0.75,
  },
  {
    id: "src-imr-guide",
    title: "Industrial Court Awards: Misconduct Standard",
    type: "guideline",
    authority: "Industrial Court",
    jurisdiction: "Malaysia",
    area: "Employment",
    publishedAt: "2024-01-01",
    excerpt: "Domestic inquiries must follow the principles of natural justice.",
    verified: true,
    relevance: 0.7,
  },
];

export const MOCK_MATTERS: Matter[] = [
  {
    id: "m-1001",
    number: "M-2026-001",
    name: "TechNova Sdn Bhd — Employment Disputes",
    description: "Three pending wrongful termination claims for FY2026.",
    client: "TechNova Sdn Bhd",
    status: "active",
    priority: "high",
    area: "Employment",
    documentsCount: 24,
    conversationsCount: 8,
    tasksCount: 6,
    researchCount: 14,
    updatedAt: isoDaysFromNow(-1),
    classification: "confidential",
  },
  {
    id: "m-1002",
    number: "M-2026-002",
    name: "GreenHostel Compliance Review",
    description: "Annual hostel rules compliance and policy update.",
    client: "GreenHostel Malaysia",
    status: "review",
    priority: "medium",
    area: "Property",
    documentsCount: 12,
    conversationsCount: 5,
    tasksCount: 3,
    researchCount: 9,
    updatedAt: isoDaysFromNow(-3),
    classification: "internal",
  },
  {
    id: "m-1003",
    number: "M-2026-003",
    name: "DataShield — PDPA Audit",
    description: "Cross-border data transfer audit and remediation.",
    client: "DataShield Technologies",
    status: "active",
    priority: "high",
    area: "Data Protection",
    documentsCount: 18,
    conversationsCount: 4,
    tasksCount: 9,
    researchCount: 11,
    updatedAt: isoDaysFromNow(-2),
    classification: "privileged",
  },
  {
    id: "m-1004",
    number: "M-2026-004",
    name: "Acquisition: Valley Foods Sdn Bhd",
    description: "Share purchase agreement review and negotiation.",
    client: "Valley Foods Group",
    status: "pending",
    priority: "medium",
    area: "Corporate",
    documentsCount: 48,
    conversationsCount: 12,
    tasksCount: 7,
    researchCount: 22,
    updatedAt: isoDaysFromNow(-5),
    classification: "privileged",
  },
  {
    id: "m-1005",
    number: "M-2026-005",
    name: "BumiWage Payroll Deduction Policy",
    description: "Salary deduction policy compliance review.",
    client: "BumiWage Sdn Bhd",
    status: "completed",
    priority: "low",
    area: "Employment",
    documentsCount: 6,
    conversationsCount: 3,
    tasksCount: 1,
    researchCount: 4,
    updatedAt: isoDaysFromNow(-12),
    classification: "internal",
  },
];


export const MOCK_ANALYSIS: DocumentAnalysis = {
  id: "a-1",
  documentId: "d-1",
  status: "complete",
  summary:
    "A standard Malaysian employment agreement with restrictive covenants, IP assignment, and statutory leave entitlements. Several risks identified around termination, non-compete enforceability, and overtime provisions.",
  findings: [
    {
      id: "f1",
      kind: "risk",
      title: "Non-compete may be unenforceable",
      detail:
        "Clause 9 imposes a 24-month non-compete. Such long restrictions are typically unenforceable in Malaysia absent consideration and reasonable scope.",
      severity: "high",
      page: 4,
      recommendation: "Reduce to 12 months and limit geographical scope to Peninsular Malaysia.",
    },
    {
      id: "f2",
      kind: "missing_clause",
      title: "Missing express garden-leave language",
      detail: "No express garden-leave provision; employer may face difficulty placing employee on leave.",
      severity: "medium",
      page: 5,
      recommendation: "Add an express garden-leave clause with full pay.",
    },
    {
      id: "f3",
      kind: "ambiguity",
      title: "Overtime calculation unclear",
      detail: "Section on overtime does not specify rate basis (hourly vs. monthly).",
      severity: "medium",
      page: 6,
    },
    {
      id: "f4",
      kind: "termination",
      title: "Termination-for-cause threshold narrow",
      detail: "Termination-for-cause list excludes wilful disobedience — consider adding.",
      severity: "low",
      page: 7,
    },
    {
      id: "f5",
      kind: "confidentiality",
      title: "Confidentiality survives termination — good",
      detail: "Clause 12 obliges confidentiality for 3 years post-termination.",
      severity: "info",
      page: 8,
    },
    {
      id: "f6",
      kind: "payment",
      title: "Deductions language not aligned with Section 24",
      detail: "Deductions clause may not satisfy Employment Act 1955 s.24 requirements.",
      severity: "high",
      page: 9,
      recommendation: "Align deductions with s.24 written authorisation requirements.",
    },
  ],
  parties: ["TechNova Sdn Bhd (Employer)", "Lim Wei Jian (Employee)"],
  dates: ["2026-01-15 (effective)", "Probation ends 2026-04-15"],
  generatedAt: isoDaysFromNow(-1),
};

export const MOCK_TASKS: LegalTask[] = [
  {
    id: "t-1",
    title: "Draft response to claim letter",
    matterId: "m-1001",
    matterName: "TechNova Sdn Bhd — Employment Disputes",
    assignee: "Aisyah Rahman",
    dueDate: isoDaysFromNow(0),
    priority: "high",
    status: "in_progress",
    notes: "Coordinator requested by 5pm.",
  },
  {
    id: "t-2",
    title: "Schedule client meeting",
    matterId: "m-1003",
    matterName: "DataShield — PDPA Audit",
    assignee: "Aisyah Rahman",
    dueDate: isoDaysFromNow(2),
    priority: "medium",
    status: "todo",
  },
  {
    id: "t-3",
    title: "File affidavit at court",
    matterId: "m-1004",
    matterName: "Acquisition: Valley Foods Sdn Bhd",
    assignee: "Junior Counsel",
    dueDate: isoDaysFromNow(-2),
    priority: "high",
    status: "blocked",
    notes: "Awaiting client signature.",
  },
  {
    id: "t-4",
    title: "Update hostel rules policy",
    matterId: "m-1002",
    matterName: "GreenHostel Compliance Review",
    assignee: "Aisyah Rahman",
    dueDate: isoDaysFromNow(5),
    priority: "low",
    status: "todo",
  },
  {
    id: "t-5",
    title: "Close out completed matter",
    matterId: "m-1005",
    matterName: "BumiWage Payroll Deduction Policy",
    assignee: "Aisyah Rahman",
    dueDate: isoDaysFromNow(7),
    priority: "low",
    status: "todo",
  },
];

export const MOCK_RISKS: RiskItem[] = [
  {
    id: "r1",
    title: "Non-compete clause likely unenforceable",
    description: "24-month post-termination restriction exceeds typical enforceability range.",
    severity: "high",
    category: "Employment",
    matterId: "m-1001",
    documentId: "d-1",
    createdAt: isoDaysFromNow(-1),
  },
  {
    id: "r2",
    title: "Salary deductions not aligned with s.24",
    description: "Written authorisation and itemisation requirements need strengthening.",
    severity: "high",
    category: "Compliance",
    matterId: "m-1001",
    documentId: "d-1",
    createdAt: isoDaysFromNow(-1),
  },
  {
    id: "r3",
    title: "Cross-border data transfer risk",
    description: "Sub-processor list outside Malaysia without explicit PDPA safeguards.",
    severity: "high",
    category: "Documentation",
    matterId: "m-1003",
    documentId: "d-3",
    createdAt: isoDaysFromNow(-2),
  },
  {
    id: "r4",
    title: "Hostel curfew may breach tenancy guidance",
    description: "Mandatory curfew may exceed landlord authority under national housing policy.",
    severity: "medium",
    category: "Operational",
    matterId: "m-1002",
    documentId: "d-2",
    createdAt: isoDaysFromNow(-3),
  },
  {
    id: "r5",
    title: "Indemnity cap may be too low",
    description: "Indemnity cap at 25% of contract value may be insufficient for warranty claims.",
    severity: "medium",
    category: "Contractual",
    matterId: "m-1004",
    documentId: "d-4",
    createdAt: isoDaysFromNow(-5),
  },
  {
    id: "r6",
    title: "Missing data retention schedule",
    description: "No documented retention period for processed personal data.",
    severity: "medium",
    category: "Compliance",
    matterId: "m-1003",
    documentId: "d-3",
    createdAt: isoDaysFromNow(-2),
  },
  {
    id: "r7",
    title: "Force majeure carve-outs limited",
    description: "Pandemics and cyber events not explicitly listed as triggering events.",
    severity: "low",
    category: "Contractual",
    matterId: "m-1004",
    documentId: "d-4",
    createdAt: isoDaysFromNow(-5),
  },
  {
    id: "r8",
    title: "Overtime calculation ambiguity",
    description: "Overtime calculation basis unclear and may trigger disputes.",
    severity: "low",
    category: "Employment",
    matterId: "m-1001",
    documentId: "d-1",
    createdAt: isoDaysFromNow(-1),
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c-1",
    title: "Salary deduction analysis",
    pinned: true,
    createdAt: isoDaysFromNow(-1),
    updatedAt: isoDaysFromNow(0),
    messageCount: 14,
    preview: "Identify lawful deductions under Section 24 of the Employment Act 1955…",
    matterId: "m-1001",
  },
  {
    id: "c-2",
    title: "Hostel rules compliance",
    createdAt: isoDaysFromNow(-3),
    updatedAt: isoDaysFromNow(-1),
    messageCount: 9,
    preview: "Compare proposed hostel rules to current tenancy guidelines…",
    matterId: "m-1002",
  },
  {
    id: "c-3",
    title: "PDPA cross-border transfers",
    createdAt: isoDaysFromNow(-2),
    updatedAt: isoDaysFromNow(-2),
    messageCount: 22,
    preview: "Identify sub-processor risk in cross-border data transfer…",
    matterId: "m-1003",
  },
  {
    id: "c-4",
    title: "Warranty indemnity cap",
    createdAt: isoDaysFromNow(-5),
    updatedAt: isoDaysFromNow(-4),
    messageCount: 6,
    preview: "Draft alternative indemnity cap language…",
    matterId: "m-1004",
  },
  {
    id: "c-5",
    title: "Force majeure carve-outs",
    createdAt: isoDaysFromNow(-6),
    updatedAt: isoDaysFromNow(-5),
    messageCount: 4,
    preview: "Identify gaps in force majeure trigger list…",
    matterId: "m-1004",
  },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n-1",
    kind: "analysis",
    title: "Document analysis complete",
    body: "Employment Agreement — Lim Wei Jian.pdf analysed: 6 findings (2 high severity).",
    href: "/legalai/documents",
    read: false,
    createdAt: isoDaysFromNow(-1),
  },
  {
    id: "n-2",
    kind: "task",
    title: "Task due today",
    body: "Draft response to claim letter (TechNova Sdn Bhd).",
    href: "/legalai/tasks",
    read: false,
    createdAt: isoDaysFromNow(0),
  },
  {
    id: "n-3",
    kind: "matter",
    title: "Matter updated",
    body: "DataShield — PDPA Audit: 3 new tasks created.",
    href: "/legalai/matters",
    read: true,
    createdAt: isoDaysFromNow(-2),
  },
  {
    id: "n-4",
    kind: "research",
    title: "Research saved",
    body: "Employment Act 1955 — Part XI summary saved to Saved Items.",
    href: "/legalai/saved",
    read: true,
    createdAt: isoDaysFromNow(-3),
  },
  {
    id: "n-5",
    kind: "ai",
    title: "AI analysis ready",
    body: "Risk engine flagged 2 new high-risk items on DataShield matter.",
    href: "/legalai/risk",
    read: false,
    createdAt: isoDaysFromNow(-1),
  },
];

export const MOCK_DRAFTS: Draft[] = [
  {
    id: "dr-1",
    title: "Warning Letter — Lim Wei Jian",
    template: "warning_letter",
    body: "Date: 21 August 2026\n\nDear Mr. Lim Wei Jian,\n\nWe write to formally warn you…",
    matterId: "m-1001",
    updatedAt: isoDaysFromNow(-1),
    status: "draft",
  },
  {
    id: "dr-2",
    title: "Hostel Rules 2026",
    template: "hostel_rules",
    body: "1. Quiet hours are from 10.00 pm to 7.00 am…",
    matterId: "m-1002",
    updatedAt: isoDaysFromNow(-2),
    status: "review",
  },
];

export const MOCK_SAVED: SavedItem[] = [
  {
    id: "sv-1",
    kind: "source",
    title: "Employment Act 1955 — Part XI",
    body: "Hours of work, holidays, rest days and overtime provisions.",
    tags: ["Employment", "Statute"],
    savedAt: isoDaysFromNow(-2),
  },
  {
    id: "sv-2",
    kind: "answer",
    title: "When can an employer deduct wages?",
    body: "Only with written authorisation and within limits under s.24…",
    tags: ["Employment", "Deductions"],
    matterId: "m-1001",
    savedAt: isoDaysFromNow(-1),
  },
  {
    id: "sv-3",
    kind: "clause",
    title: "Garden leave clause",
    body: "The Employer may at any time require the Employee to remain away from the workplace…",
    tags: ["Employment", "Clause"],
    savedAt: isoDaysFromNow(-3),
  },
  {
    id: "sv-4",
    kind: "research",
    title: "PDPA cross-border transfers — overview",
    body: "Section 7 + Schedule — Standard of protection equivalency test.",
    tags: ["Data Protection"],
    matterId: "m-1003",
    savedAt: isoDaysFromNow(-2),
  },
];

export const MOCK_ACTIVITY: RecentActivity[] = [
  {
    id: "ac-1",
    kind: "conversation",
    title: "Salary deduction analysis",
    detail: "IRAC analysis · 14 messages",
    href: "/legalai/assistant",
    at: isoDaysFromNow(0),
  },
  {
    id: "ac-2",
    kind: "document",
    title: "Employment Agreement — Lim Wei Jian.pdf",
    detail: "Analysis complete · 6 findings",
    href: "/legalai/documents",
    at: isoDaysFromNow(-1),
  },
  {
    id: "ac-3",
    kind: "research",
    title: "PDPA cross-border transfers",
    detail: "Saved · 4 sources",
    href: "/legalai/research",
    at: isoDaysFromNow(-2),
  },
  {
    id: "ac-4",
    kind: "draft",
    title: "Warning Letter — Lim Wei Jian",
    detail: "Edited · draft",
    href: "/legalai/drafting",
    at: isoDaysFromNow(-1),
  },
  {
    id: "ac-5",
    kind: "matter",
    title: "DataShield — PDPA Audit",
    detail: "3 new tasks · updated",
    href: "/legalai/matters",
    at: isoDaysFromNow(-2),
  },
  {
    id: "ac-6",
    kind: "analysis",
    title: "Risk engine flagged 2 high items",
    detail: "DataShield matter",
    href: "/legalai/risk",
    at: isoDaysFromNow(-1),
  },
];

export const MOCK_USAGE: AIUsage = {
  questionsAsked: 184,
  documentsAnalysed: 36,
  draftsGenerated: 21,
  researchSessions: 92,
};

export const MOCK_SEARCH_RESULTS: ResearchResult[] = [
  {
    source: MALAYSIAN_SOURCES[0]!,
    summary:
      "Part XI covers hours of work, rest days, holidays and overtime. Section 60D limits normal hours of work.",
    citation: "Employment Act 1955 (Act 265), Part XI",
    relevance: 0.95,
    date: "1955",
  },
  {
    source: MALAYSIAN_SOURCES[3]!,
    summary:
      "Section 20 sets out circumstances under which an employer may terminate a contract without notice.",
    citation: "Industrial Relations Act 1967, s.20",
    relevance: 0.85,
    date: "1967",
  },
  {
    source: MALAYSIAN_SOURCES[4]!,
    summary:
      "Federal Court affirms natural justice applies to disciplinary proceedings in the public sector.",
    citation: "[2023] 1 MLJ 184",
    relevance: 0.78,
    date: "2023",
  },
];

export const MOCK_REASONING_STEPS = [
  {
    id: "r-1",
    label: "Searching Malaysian legal sources",
    status: "complete" as const,
    detail: "Indexed 12 statutes and 4 cases.",
  },
  {
    id: "r-2",
    label: "Reviewing relevant provisions",
    status: "complete" as const,
    detail: "Employment Act 1955 — Parts XI, XII",
  },
  {
    id: "r-3",
    label: "Comparing applicable requirements",
    status: "complete" as const,
    detail: "Side-by-side comparison complete.",
  },
  {
    id: "r-4",
    label: "Preparing legal analysis",
    status: "complete" as const,
    detail: "IRAC structure ready.",
  },
];

export const MOCK_TOOL_EXECUTIONS: ToolExecution[] = [
  {
    id: "t-1",
    name: "Search legal sources",
    description: "Retrieved 12 Malaysian statutes and 4 cases.",
    status: "complete",
  },
  {
    id: "t-2",
    name: "Retrieve relevant provisions",
    description: "Fetched sections of Employment Act 1955.",
    status: "complete",
  },
  {
    id: "t-3",
    name: "Analyse uploaded document",
    description: "Extracted parties, obligations and risks.",
    status: "complete",
  },
  {
    id: "t-4",
    name: "Compare clauses",
    description: "Compared clause language to current statute.",
    status: "running",
  },
  {
    id: "t-5",
    name: "Extract obligations",
    description: "Identifying employee and employer obligations.",
    status: "pending",
  },
  {
    id: "t-6",
    name: "Generate answer",
    description: "Composing legal analysis.",
    status: "pending",
  },
];

export const MOCK_INITIAL_MESSAGES: Message[] = [
  {
    id: "m-1",
    role: "user",
    content:
      "Under what circumstances may an employer make deductions from an employee's wages in Malaysia?",
    createdAt: isoDaysFromNow(-1),
  },
  {
    id: "m-2",
    role: "assistant",
    createdAt: isoDaysFromNow(-1),
    content:
      "Under Malaysian law, deductions from an employee's wages are principally regulated by **Section 24 of the Employment Act 1955**.\n\n### Rule\nAn employer may only deduct from wages:\n\n1. With the employee's **written authorisation**; and\n2. For lawful purposes including:\n   - Recovery of **advances or overpayments**;\n   - **Trade union subscriptions** (per the Trade Unions Act 1959);\n   - Payments to a **co-operative society** registered under the Co-operative Societies Act 1993;\n   - **Insurance premiums** under a contract for the employee's benefit.\n\n### Practical implications\n- Deductions for **disciplinary fines** are not permissible under the Act.\n- Employers should retain signed authorisation and itemised records.\n- Total deductions should not reduce wages below lawful minimums.\n\n> Verify against the **Employment (Limitation on Deductions from Wages) Regulations 1980** for the precise list and any amendments.",
    citations: [
      {
        index: 1,
        source: MALAYSIAN_SOURCES[0]!,
      },
    ],
    sources: [MALAYSIAN_SOURCES[0]!],
    reasoningSteps: MOCK_REASONING_STEPS,
    toolExecutions: MOCK_TOOL_EXECUTIONS,
    suggestions: [
      "Draft a compliant deduction authorisation clause",
      "Summarise the deduction regulations 1980",
      "What is the maximum permitted deduction?",
      "Identify related disciplinary risks",
    ],
    verified: true,
    attachments: [],
  },
];

export const JURISDICTIONS: { id: "Malaysia" | "Singapore" | "United Kingdom" | "Other"; label: string }[] = [
  { id: "Malaysia", label: "Malaysia" },
  { id: "Singapore", label: "Singapore" },
  { id: "United Kingdom", label: "United Kingdom" },
  { id: "Other", label: "Other" },
];

export const LEGAL_AREAS: { id: LegalArea; label: string }[] = [
  { id: "Employment", label: "Employment" },
  { id: "Contract", label: "Contract" },
  { id: "Corporate", label: "Corporate" },
  { id: "Compliance", label: "Compliance" },
  { id: "Data Protection", label: "Data Protection" },
  { id: "Property", label: "Property" },
  { id: "Litigation", label: "Litigation" },
  { id: "Other", label: "Other" },
];

export const SOURCE_TYPES: { id: RiskCategory; label: string }[] = [
  { id: "Legal", label: "Statutes" },
  { id: "Compliance", label: "Cases" },
  { id: "Contractual", label: "Guidelines" },
  { id: "Employment", label: "Government" },
  { id: "Financial", label: "Other" },
];

export const DRAFT_TEMPLATES: { id: string; label: string; description: string }[] = [
  { id: "employment_agreement", label: "Employment Agreement", description: "Standard Malaysian employment contract." },
  { id: "warning_letter", label: "Warning Letter", description: "Misconduct / performance warning." },
  { id: "show_cause_letter", label: "Show-Cause Letter", description: "Require written explanation." },
  { id: "company_policy", label: "Company Policy", description: "Internal HR / compliance policy." },
  { id: "hostel_rules", label: "Hostel Rules", description: "Tenant rules and regulations." },
  { id: "property_acknowledgement", label: "Property Acknowledgement", description: "Receipt / acknowledgement." },
  { id: "hr_notice", label: "HR Notice", description: "Notice to all employees." },
  { id: "legal_letter", label: "Legal Letter", description: "Letter to a third party." },
  { id: "contract_clause", label: "Contract Clause", description: "Single clause drafting." },
  { id: "internal_memo", label: "Internal Memo", description: "Internal legal memo." },
  { id: "custom", label: "Custom Document", description: "Start from blank." },
];

export function defaultComposerContext(): ComposerContext {
  return {
    jurisdiction: "Malaysia",
    area: "Employment",
    sourceFilter: ["act", "case", "guideline", "government"],
  };
}
/* ============================================================
   Enhanced document-library mock data (Documents redesign)
   Realistic Malaysian legal matter data with owners, tags,
   version histories, comments, activity and AI summaries.
   ============================================================ */

// ----------------------------------------------------------------------
// Document owners
// ----------------------------------------------------------------------

export const MOCK_DOCUMENT_OWNERS: DocumentOwner[] = [
  { id: "u-001", name: "Aisyah Rahman", email: "aisyah@lawmate.ai", avatarUrl: "https://i.pravatar.cc/128?u=u-001" },
  { id: "u-002", name: "Farid Ibrahim", email: "farid@lawmate.ai", avatarUrl: "https://i.pravatar.cc/128?u=u-002" },
  { id: "u-003", name: "Sarah Lim", email: "sarah@lawmate.ai", avatarUrl: "https://i.pravatar.cc/128?u=u-003" },
  { id: "u-004", name: "Mei Ying Wong", email: "meiying@lawmate.ai", avatarUrl: "https://i.pravatar.cc/128?u=u-004" },
  { id: "u-005", name: "Junaidi Abdullah", email: "junaidi@lawmate.ai", avatarUrl: "https://i.pravatar.cc/128?u=u-005" },
  { id: "u-006", name: "Tan Wei Hao", email: "wei.hao@lawmate.ai", avatarUrl: "https://i.pravatar.cc/128?u=u-006" },
];

// ----------------------------------------------------------------------
// Tag pool (shared across documents)
// ----------------------------------------------------------------------

export const MOCK_TAG_OPTIONS = [
  "contract",
  "employment",
  "corporate",
  "litigation",
  "property",
  "compliance",
  "pdpa",
  "nda",
  "nda",
  "agreement",
  "policy",
  "government",
  "reviewed",
  "confidential",
];

// ----------------------------------------------------------------------
// Documents
// ----------------------------------------------------------------------

const OWNERS = MOCK_DOCUMENT_OWNERS;
const ownerOf = (name: string): DocumentOwner => {
  const found = OWNERS.find((o) => o.name === name);
  return found ?? OWNERS[0]!;
};

const DOC: (Omit<Document, "id" | "owner"> & { ownerName: string })[] = [
  {
    name: "Commercial Lease Agreement — Meridian Retail.pdf",
    type: "application/pdf",
    size: 2_145_000,
    uploadedAt: isoDaysFromNow(-14),
    lastModified: isoDaysFromNow(-2),
    status: "ready",
    matterId: "m-1002",
    matterClient: "Meridian Retail Berhad",
    classification: "internal",
    pageCount: 45,
    ownerName: "Aisyah Rahman",
    client: { id: "c-101", name: "Meridian Retail Berhad" },
    statusBadge: "Reviewed",
    tags: ["contract", "property", "agreement", "reviewed"],
    version: 3,
    versionsCount: 5,
    aiInsights: "available",
    sharedWithMe: true,
  },
  {
    name: "Share Purchase Agreement — Valley Foods.pdf",
    type: "application/pdf",
    size: 3_420_000,
    uploadedAt: isoDaysFromNow(-12),
    lastModified: isoDaysFromNow(-5),
    status: "ready",
    matterId: "m-1004",
    matterClient: "Valley Foods Group",
    classification: "privileged",
    pageCount: 76,
    ownerName: "Farid Ibrahim",
    client: { id: "c-102", name: "Valley Foods Group" },
    statusBadge: "Approved",
    tags: ["contract", "corporate", "agreement", "reviewed", "confidential"],
    version: 7,
    versionsCount: 12,
    aiInsights: "available",
    sharedWithMe: false,
  },
  {
    name: "Employment Contract — Lim Wei Jian.pdf",
    type: "application/pdf",
    size: 680_000,
    uploadedAt: isoDaysFromNow(-10),
    lastModified: isoDaysFromNow(-1),
    status: "ready",
    matterId: "m-1001",
    matterClient: "TechNova Sdn Bhd",
    classification: "confidential",
    pageCount: 12,
    ownerName: "Aisyah Rahman",
    client: { id: "c-101", name: "TechNova Sdn Bhd" },
    statusBadge: "Reviewed",
    tags: ["contract", "employment", "agreement", "reviewed"],
    version: 2,
    versionsCount: 4,
    aiInsights: "available",
    sharedWithMe: true,
  },
  {
    name: "Letter of Demand — GreenHostel.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 42_000,
    uploadedAt: isoDaysFromNow(-8),
    lastModified: isoDaysFromNow(-3),
    status: "ready",
    matterId: "m-1002",
    matterClient: "GreenHostel Malaysia",
    classification: "internal",
    pageCount: 2,
    ownerName: "Sarah Lim",
    client: { id: "c-103", name: "GreenHostel Malaysia" },
    statusBadge: "Draft",
    tags: ["litigation", "policy", "draft"],
    version: 2,
    versionsCount: 3,
    aiInsights: "none",
    sharedWithMe: false,
  },
  {
    name: "Witness Statement — v1.pdf",
    type: "application/pdf",
    size: 1_240_000,
    uploadedAt: isoDaysFromNow(-6),
    lastModified: isoDaysFromNow(-6),
    status: "processing",
    matterId: "m-1001",
    matterClient: "TechNova Sdn Bhd",
    classification: "confidential",
    pageCount: 8,
    ownerName: "Junaidi Abdullah",
    client: { id: "c-101", name: "TechNova Sdn Bhd" },
    statusBadge: "Processing",
    tags: ["litigation", "evidence", "confidential"],
    version: 1,
    versionsCount: 1,
    aiInsights: "analyzing",
    sharedWithMe: false,
  },
  {
    name: "PDPA Audit Findings — DataShield.pdf",
    type: "application/pdf",
    size: 1_890_000,
    uploadedAt: isoDaysFromNow(-11),
    lastModified: isoDaysFromNow(-7),
    status: "ready",
    matterId: "m-1003",
    matterClient: "DataShield Technologies",
    classification: "privileged",
    pageCount: 22,
    ownerName: "Mei Ying Wong",
    client: { id: "c-104", name: "DataShield Technologies" },
    statusBadge: "Needs review",
    tags: ["compliance", "pdpa", "report", "confidential"],
    version: 4,
    versionsCount: 6,
    aiInsights: "available",
    sharedWithMe: true,
  },
  {
    name: "Vendor Agreement — AlphaTech Solutions.pdf",
    type: "application/pdf",
    size: 1_520_000,
    uploadedAt: isoDaysFromNow(-21),
    lastModified: isoDaysFromNow(-10),
    status: "ready",
    matterId: "m-1004",
    matterClient: "AlphaTech Solutions",
    classification: "internal",
    pageCount: 30,
    ownerName: "Mei Ying Wong",
    client: { id: "c-105", name: "AlphaTech Solutions" },
    statusBadge: "Approved",
    tags: ["contract", "corporate", "agreement", "reviewed"],
    version: 2,
    versionsCount: 3,
    aiInsights: "available",
    sharedWithMe: false,
  },
  {
    name: "Memorandum of Understanding — JV Partnership.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 156_000,
    uploadedAt: isoDaysFromNow(-15),
    lastModified: isoDaysFromNow(-4),
    status: "ready",
    matterId: "m-1005",
    matterClient: "N/A",
    classification: "internal",
    pageCount: 6,
    ownerName: "Sarah Lim",
    client: { id: "c-106", name: "N/A" },
    statusBadge: "Draft",
    tags: ["agreement", "draft", "confidential"],
    version: 2,
    versionsCount: 4,
    aiInsights: "none",
    sharedWithMe: true,
  },
  {
    name: "Service Level Agreement — DataShield.pdf",
    type: "application/pdf",
    size: 890_000,
    uploadedAt: isoDaysFromNow(-30),
    lastModified: isoDaysFromNow(-18),
    status: "ready",
    matterId: "m-1003",
    matterClient: "DataShield Technologies",
    classification: "confidential",
    pageCount: 15,
    ownerName: "Mei Ying Wong",
    client: { id: "c-104", name: "DataShield Technologies" },
    statusBadge: "Reviewed",
    tags: ["contract", "compliance", "pdpa", "agreement", "reviewed"],
    version: 2,
    versionsCount: 2,
    aiInsights: "available",
    sharedWithMe: false,
  },
  {
    name: "Non-Disclosure Agreement — Standard Form.pdf",
    type: "application/pdf",
    size: 112_000,
    uploadedAt: isoDaysFromNow(-45),
    lastModified: isoDaysFromNow(-40),
    status: "ready",
    matterId: "m-1002",
    matterClient: "Meridian Retail Berhad",
    classification: "public",
    pageCount: 4,
    ownerName: "Farid Ibrahim",
    client: { id: "c-101", name: "Meridian Retail Berhad" },
    statusBadge: "Approved",
    tags: ["nda", "agreement", "reviewed", "government"],
    version: 1,
    versionsCount: 1,
    aiInsights: "available",
    sharedWithMe: true,
  },
  {
    name: "Deed of Mutual Covenant — Skyline Residences.pdf",
    type: "application/pdf",
    size: 2_890_000,
    uploadedAt: isoDaysFromNow(-9),
    lastModified: isoDaysFromNow(-6),
    status: "ready",
    matterId: "m-1005",
    matterClient: "Skyline Developers",
    classification: "confidential",
    pageCount: 60,
    ownerName: "Aisyah Rahman",
    client: { id: "c-107", name: "Skyline Developers" },
    statusBadge: "Needs review",
    tags: ["contract", "property", "agreement", "confidential"],
    version: 3,
    versionsCount: 4,
    aiInsights: "available",
    sharedWithMe: false,
  },
  {
    name: "Employment Policies Handbook 2026.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 520_000,
    uploadedAt: isoDaysFromNow(-19),
    lastModified: isoDaysFromNow(-11),
    status: "ready",
    matterId: "m-1001",
    matterClient: "TechNova Sdn Bhd",
    classification: "internal",
    pageCount: 38,
    ownerName: "Aisyah Rahman",
    client: { id: "c-101", name: "TechNova Sdn Bhd" },
    statusBadge: "Draft",
    tags: ["policy", "employment", "draft", "reviewed"],
    version: 5,
    versionsCount: 8,
    aiInsights: "available",
    sharedWithMe: true,
  },
];

export const MOCK_DOCUMENTS: Document[] = DOC.map((d, i) => ({
  id: `doc-${String(i + 1).padStart(3, "0")}`,
  ...d,
  owner: ownerOf(d.ownerName),
}));

export const MOCK_DASHBOARD_METRICS: DashboardMetrics = {
  usage: MOCK_USAGE,
  activeMatters: MOCK_MATTERS.filter((m) => m.status === "active").length,
  highPriorityMatters: MOCK_MATTERS.filter((m) => m.priority === "high").length,
  totalDocuments: MOCK_DOCUMENTS.length,
  processingDocuments: MOCK_DOCUMENTS.filter((d) => d.status === "processing").length,
  risks: {
    high: MOCK_RISKS.filter((r) => r.severity === "high").length,
    medium: MOCK_RISKS.filter((r) => r.severity === "medium").length,
    low: MOCK_RISKS.filter((r) => r.severity === "low").length,
  },
  tasks: {
    today: MOCK_TASKS.filter(
      (t) => new Date(t.dueDate ?? now()).toDateString() === new Date().toDateString(),
    ).length,
    overdue: MOCK_TASKS.filter(
      (t) =>
        t.status !== "done" &&
        new Date(t.dueDate ?? now()).getTime() < Date.now(),
    ).length,
    upcoming: MOCK_TASKS.filter((t) => t.status === "todo").length,
  },
};


// ----------------------------------------------------------------------
// Document versions (revision history)
// ----------------------------------------------------------------------

const v = (docId: string, version: number, label: string, date: number, author: string, summary: string, size: number, current?: boolean): DocumentVersion => ({
  version,
  id: `${docId}-v${version}`,
  documentId: docId,
  label,
  createdAt: date < 0 ? isoDaysFromNow(date) : new Date(date).toISOString(),
  author: ownerOf(author),
  size,
  changeSummary: summary,
  current: current ?? false,
});

export const MOCK_DOCUMENT_VERSIONS: DocumentVersion[] = [
  // Commercial Lease Agreement — Meridian Retail (5 versions)
  v("doc-001", 1, "v1.0", -30, "Farid Ibrahim", "Initial draft from landlord template.", 1_900_000),
  v("doc-001", 2, "v2.0", -20, "Aisyah Rahman", "Incorporated tenant requests; adjusted rent review clause.", 2_010_000),
  v("doc-001", 3, "v3.0 (current)", -14, "Aisyah Rahman", "Final for execution — security deposit and break clause clarified.", 2_145_000, true),
  v("doc-001", 4, "v4.0 (current)", -7, "Aisyah Rahman", "Post-execution addendum consolidated.", 2_145_000, true),
  v("doc-001", 5, "v5.0 (current)", -2, "Aisyah Rahman", "Minor typographical corrections to Schedules A–C.", 2_145_000, true),

  // Share Purchase Agreement — Valley Foods (12 versions)
  v("doc-002", 1, "v1.0", -50, "Farid Ibrahim", "Draft based on industry SPAA template.", 2_200_000),
  v("doc-002", 3, "v3.0", -32, "Farid Ibrahim", "First substantive review; purchase price mechanics revised.", 2_900_000),
  v("doc-002", 5, "v5.0", -20, "Aisyah Rahman", "Indemnity caps and warranties schedule expanded.", 3_100_000),
  v("doc-002", 7, "v7.0 (current)", -12, "Farid Ibrahim", "Final executed version; board resolutions attached.", 3_420_000, true),

  // Employment Contract — Lim Wei Jian (4 versions)
  v("doc-003", 1, "v1.0", -25, "Aisyah Rahman", "Standard offer draft.", 480_000),
  v("doc-003", 2, "v2.0 (current)", -10, "Aisyah Rahman", "Non-compete narrowed to 12 months; IP clause added.", 680_000, true),

  // Letter of Demand — GreenHostel (3 versions)
  v("doc-004", 1, "v1.0", -12, "Sarah Lim", "Initial demand letter.", 35_000),
  v("doc-004", 2, "v2.0", -8, "Sarah Lim", "Updated quantum per latest accounts.", 42_000),

  // Witness Statement (1 version)
  v("doc-005", 1, "v1.0", -6, "Junaidi Abdullah", "Initial transcription.", 1_240_000),

  // PDPA Audit Findings — DataShield (6 versions)
  v("doc-006", 1, "v1.0", -35, "Mei Ying Wong", "Preliminary findings.", 1_100_000),
  v("doc-006", 3, "v3.0", -15, "Mei Ying Wong", "Cross-border transfer section rewritten.", 1_650_000),
  v("doc-006", 4, "v4.0 (current)", -11, "Mei Ying Wong", "Final report with remediation roadmap.", 1_890_000, true),

  // Vendor Agreement — AlphaTech (3 versions)
  v("doc-007", 1, "v1.0", -40, "Mei Ying Wong", "Template-based draft.", 1_100_000),
  v("doc-007", 2, "v2.0 (current)", -21, "Mei Ying Wong", "SLA penalty schedule finalized.", 1_520_000, true),

  // MOU — JV Partnership (4 versions)
  v("doc-008", 1, "v1.0", -22, "Sarah Lim", "Framework MOU.", 110_000),
  v("doc-008", 2, "v2.0", -15, "Sarah Lim", "Term and exclusivity clauses revised.", 156_000),

  // Service Level Agreement — DataShield (2 versions)
  v("doc-009", 1, "v1.0", -45, "Mei Ying Wong", "Draft SLA.", 720_000),
  v("doc-009", 2, "v2.0 (current)", -30, "Mei Ying Wong", "Final with data-processing addendum.", 890_000, true),

  // NDA — Standard Form (1 version)
  v("doc-010", 1, "v1.0 (current)", -45, "Farid Ibrahim", "Firm standard NDA.", 112_000, true),

  // Deed of Mutual Covenant — Skyline (4 versions)
  v("doc-011", 1, "v1.0", -55, "Aisyah Rahman", "Developer draft.", 2_400_000),
  v("doc-011", 3, "v3.0", -25, "Aisyah Rahman", "Common area and maintenance fund revised.", 2_890_000),

  // Employment Policies Handbook (8 versions)
  v("doc-012", 1, "v1.0", -90, "Aisyah Rahman", "Annual handbook revision.", 290_000),
  v("doc-012", 5, "v5.0", -30, "Aisyah Rahman", "Payroll deduction policy added per s.24.", 460_000),
  v("doc-012", 6, "v6.0 (current)", -19, "Aisyah Rahman", "Current draft with leave and attendance updates.", 520_000, true),
];

// ----------------------------------------------------------------------
// Comments
// ----------------------------------------------------------------------

export const MOCK_DOCUMENT_COMMENTS: Record<string, DocumentComment[]> = {
  "doc-001": [
    {
      id: "cm-1",
      author: ownerOf("Farid Ibrahim"),
      content: "Please confirm the break clause triggers at month 24 — the tenant has requested mid-term exit.",
      createdAt: isoDaysFromNow(-1),
      resolved: false,
    },
    {
      id: "cm-2",
      author: ownerOf("Aisyah Rahman"),
      content: "Resolved. Break notice period set to 90 days, payable in advance.",
      createdAt: isoDaysFromNow(-2),
      resolved: true,
      replies: [
        {
          id: "cm-3",
          author: ownerOf("Farid Ibrahim"),
          content: "Noted — I will mark the comment thread as closed on signature.",
          createdAt: isoDaysFromNow(-2),
          resolved: true,
        },
      ],
    },
  ],
  "doc-003": [
    {
      id: "cm-4",
      author: ownerOf("Junaidi Abdullah"),
      content: "Non-compete reduced to 12 months — enforceable range per recent Industrial Court guidance.",
      createdAt: isoDaysFromNow(-1),
      resolved: true,
    },
  ],
  "doc-006": [
    {
      id: "cm-5",
      author: ownerOf("Aisyah Rahman"),
      content: "Cross-border transfer findings need to reference Schedule 3 equivalency test.",
      createdAt: isoDaysFromNow(-6),
      resolved: false,
    },
  ],
};

// ----------------------------------------------------------------------
// Activity timelines
// ----------------------------------------------------------------------

const activity = (
  docId: string,
  kind: DocumentActivity["kind"],
  actor: string,
  title: string,
  detail?: string,
  target?: string,
  daysAgo: number = 0,
  hoursAgo?: number,
): DocumentActivity => ({
  id: `${docId}-ac-${Date.now()}-${Math.random()}`,
  kind,
  actor: ownerOf(actor),
  title,
  detail,
  target,
  at: hoursAgo !== undefined
    ? new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString()
    : isoDaysFromNow(daysAgo),
});

export const MOCK_DOCUMENT_ACTIVITY: Record<string, DocumentActivity[]> = {
  "doc-001": [
    activity("doc-001", "version", "Aisyah Rahman", "Published v5.0", "Minor typographical corrections to Schedules A–C.", "doc-001-v5", 2),
    activity("doc-001", "analyse", "Aisyah Rahman", "AI analysis complete", "4 risks and 7 key clauses extracted (92% confidence).", "doc-001-ai", 4),
    activity("doc-001", "share", "Aisyah Rahman", "Shared with Tan Wei Hao", "View-only access granted.", "doc-001-share", 6),
    activity("doc-001", "review", "Farid Ibrahim", "Marked as Reviewed", "Final for execution.", "doc-001-review", 6),
    activity("doc-001", "download", "Tan Wei Hao", "Downloaded v4.0", "Reference copy saved locally.", "doc-001-dl", 12),
  ],
  "doc-003": [
    activity("doc-003", "version", "Aisyah Rahman", "Published v2.0", "Non-compete narrowed to 12 months; IP clause added.", "doc-003-v2", 1),
    activity("doc-003", "analyse", "Aisyah Rahman", "AI analysis complete", "6 findings (2 high severity) including non-compete and deductions.", "doc-003-ai", 1),
  ],
  "doc-006": [
    activity("doc-006", "version", "Mei Ying Wong", "Published v4.0", "Final report with remediation roadmap.", "doc-006-v4", 7),
    activity("doc-006", "tag", "Mei Ying Wong", "Added tags", "compliance, pdpa, report, confidential.", "doc-006-tag", 7),
    activity("doc-006", "move", "Mei Ying Wong", "Moved to matter", "DataShield — PDPA Audit.", "doc-006-move", 11),
  ],
  "doc-004": [
    activity("doc-004", "edit", "Sarah Lim", "Edited Letter of Demand", "Updated quantum per latest accounts.", "doc-004-edit", 3, 3),
  ],
};

// ----------------------------------------------------------------------
// AI analysis summaries
// ----------------------------------------------------------------------

const today = (d: number, h: number = 0) => new Date(Date.now() - (Math.abs(d) * 86400000 + h * 3600000)).toISOString();

const SUMMARY = (docId: string): DocumentAnalysisSummary => {
  const base = {
    available: true,
    generating: false,
    keyClauses: [],
    potentialRisks: [],
    missingInformation: [],
    importantDates: [],
    parties: [],
    obligations: [],
  };
  switch (docId) {
    case "doc-001":
      return {
        ...base,
        executiveSummary:
          "Commercial lease for retail premises in a multi-storey development. The agreement contains standard tenant covenants, a break clause, security deposit mechanics and schedules for the premises and service charges. The AI flags the break-notice period and the service charge reconciliation as areas requiring negotiation.",
        keyClauses: [
          { title: "Rent review (Clause 12)", excerpt: "Annual increase capped at 5%, or market rent if higher, determined by independent valuer.", page: 8 },
          { title: "Break clause (Clause 18)", excerpt: "Tenant may terminate with 90 days written notice between months 24–30.", page: 12 },
          { title: "Use of premises (Clause 5)", excerpt: "Restricted to 'retail sale of general merchandise' only — sub-letting prohibited.", page: 4 },
          { title: "Service charge (Clause 15)", excerpt: "Reconciled annually; under/over-recovery settled within 30 days.", page: 10 },
        ],
        potentialRisks: [
          { title: "Break notice period", severity: "medium", page: 12 },
          { title: "Service charge audit rights limited", severity: "low", page: 11 },
          { title: "Insurance obligation asymmetry", severity: "medium", page: 16 },
        ],
        missingInformation: [
          "Sub-letting consent regime not specified (currently silent).",
          "Force majeure clause absent — pandemic/cyber events not carved out.",
        ],
        importantDates: ["2026-11-01 (lease start)", "2028-10-31 (expiry)", "2028-05-01 (break window open)"],
        parties: ["Meridian Retail Berhad (Tenant)", "Skyline Holdings Sdn Bhd (Landlord)"],
        obligations: [
          "Tenant: pay rent quarterly in advance; maintain premises; comply with building rules.",
          "Landlord: provide quiet enjoyment; maintain common areas; insure building structure.",
        ],
        clauseCount: 34,
        issuesCount: 4,
        unusualClausesCount: 2,
        lastAnalysedAt: today(-2, 4),
        confidence: 0.92,
      };
    case "doc-003":
      return {
        ...base,
        executiveSummary:
          "Malaysian employment agreement for a senior software engineer at TechNova. Covers compensation, probation, restrictive covenants, IP assignment and termination. AI analysis identifies the 12-month non-compete as the most significant legal risk, plus ambiguities in overtime and deductions clauses.",
        keyClauses: [
          { title: "Probation (Clause 7)", excerpt: "Six-month probation; extendable once with 14 days' notice.", page: 3 },
          { title: "Non-compete (Clause 9)", excerpt: "12 months post-termination within Peninsular Malaysia for direct competitors.", page: 5 },
          { title: "IP assignment (Clause 11)", excerpt: "All work product and inventions assigned to Employer on creation.", page: 6 },
          { title: "Deductions (Clause 17)", excerpt: "Authorised deductions listed; itemised pay slips provided monthly.", page: 8 },
        ],
        potentialRisks: [
          { title: "Non-compete enforceability", severity: "high", page: 5 },
          { title: "Overtime rate basis unclear", severity: "medium", page: 7 },
          { title: "Deductions vs s.24 alignment", severity: "high", page: 8 },
          { title: "Missing garden-leave clause", severity: "medium", page: 7 },
        ],
        missingInformation: [
          "Garden-leave language not present (employer cannot place employee on leave without notice risk).",
          "Termination-for-cause list excludes wilful disobedience.",
        ],
        importantDates: ["2026-01-15 (effective)", "2026-07-15 (probation ends)", "2027-01-15 (commencement of restraint)"],
        parties: ["TechNova Sdn Bhd (Employer)", "Lim Wei Jian (Employee)"],
        obligations: [
          "Employee: faithful service; IP assignment; confidentiality post-termination.",
          "Employer: pay salary by the 7th of each month; statutory contributions; annual leave.",
        ],
        clauseCount: 24,
        issuesCount: 6,
        unusualClausesCount: 1,
        lastAnalysedAt: today(-1, 9),
        confidence: 0.89,
      };
    case "doc-006":
      return {
        ...base,
        executiveSummary:
          "PDPA audit report for DataShield Technologies covering data mapping, cross-border transfers, sub-processor management and retention schedules. Two high-severity gaps were identified in the cross-border transfer safeguards and sub-processor notification process.",
        keyClauses: [
          { title: "Cross-border transfer (Section 7)", excerpt: "Standard of protection equivalency test applied; no adequacy decisions relied upon.", page: 6 },
          { title: "Sub-processor list (Schedule B)", excerpt: "Seven subprocessors identified; Malaysia-based only.", page: 18 },
          { title: "Retention schedule (Section 12)", excerpt: "Personal data retained 5 years post-engagement unless longer required.", page: 14 },
        ],
        potentialRisks: [
          { title: "Sub-processor list outdated", severity: "high", page: 18 },
          { title: "No explicit PDPA safeguards clause", severity: "high", page: 7 },
          { title: "Retention schedule silent on backups", severity: "medium", page: 14 },
        ],
        missingInformation: ["Documented retention schedule is not formally approved.", "Data breach notification procedure not tested (no tabletop exercise on record)."],
        importantDates: ["2025-12-01 (audit start)", "2026-02-01 (remediation due)"],
        parties: ["DataShield Technologies (data user)", "External PDPA Auditor"],
        obligations: [
          "Notify Data Protection Commissioner of cross-border transfers.",
          "Maintain accurate record of processing activities.",
        ],
        clauseCount: 12,
        issuesCount: 3,
        unusualClausesCount: 0,
        lastAnalysedAt: today(-6, 5),
        confidence: 0.85,
      };
    case "doc-009":
      return {
        ...base,
        executiveSummary:
          "Service level agreement for cloud hosting and managed support. Covers uptime SLAs, response times, penalties (service credits) and data protection obligations. AI notes the service credit cap at 10% of monthly fees may not adequately reflect critical-outage impact.",
        keyClauses: [
          { title: "Uptime guarantee (Schedule 1)", excerpt: "99.5% monthly uptime; measured per service category.", page: 2 },
          { title: "Service credits (Section 14)", excerpt: "Capped at 10% of monthly fees; tiered by severity.", page: 11 },
          { title: "Data-processing addendum (Schedule 3)", excerpt: "GDPR-aligned subprocessor obligations; breach notification within 72 hours.", page: 13 },
        ],
        potentialRisks: [
          { title: "Service credit cap may be low", severity: "medium", page: 11 },
          { title: "No explicit exclusivity or lock-in", severity: "low", page: 9 },
        ],
        missingInformation: ["Business continuity and disaster recovery standards not quantified."],
        importantDates: ["2025-06-01 (service launch)", "2026-05-31 (annual renewal)"],
        parties: ["DataShield Technologies (customer)", "CloudServe Malaysia Sdn Bhd (provider)"],
        obligations: [
          "Provider: maintain 99.5% uptime; respond within defined SLAs; protect personal data.",
          "Customer: provide reasonable access; pay fees on time.",
        ],
        clauseCount: 21,
        issuesCount: 2,
        unusualClausesCount: 0,
        lastAnalysedAt: today(-20, 2),
        confidence: 0.88,
      };
    case "doc-007":
      return {
        ...base,
        executiveSummary:
          "Vendor agreement for IT infrastructure supply and support. Covers pricing, delivery, acceptance testing, warranties and liability. AI flags the indemnity cap and the limitation of consequential losses as negotiated priorities.",
        keyClauses: [
          { title: "Acceptance testing (Section 9)", excerpt: "10-business-day acceptance window; deemed accepted if no written rejection.", page: 7 },
          { title: "Warranty (Section 11)", excerpt: "12-month hardware warranty; software defect remediation within 5 business days.", page: 8 },
          { title: "Liability cap (Section 19)", excerpt: "Total liability capped at 12 months of fees; exclusions for indirect losses.", page: 13 },
        ],
        potentialRisks: [
          { title: "Indemnity cap at 25% of contract value", severity: "medium", page: 12 },
          { title: "Consequential loss carve-out broad", severity: "medium", page: 13 },
        ],
        missingInformation: ["Penalty for late delivery not specified in main body."],
        importantDates: ["2025-05-15 (contract date)", "2025-06-15 (go-live)"],
        parties: ["AlphaTech Solutions (buyer)", "InfraCore Systems Sdn Bhd (vendor)"],
        obligations: [
          "Vendor: deliver hardware per spec; provide 24/7 support.",
          "Buyer: make payments within 30 days; provide site access.",
        ],
        clauseCount: 28,
        issuesCount: 2,
        unusualClausesCount: 0,
        lastAnalysedAt: today(-12, 7),
        confidence: 0.87,
      };
    case "doc-002":
      return {
        ...base,
        executiveSummary:
          "Share purchase agreement for the acquisition of Valley Foods Group by an investment vehicle. Comprehensive warranties, indemnities, completion mechanics and post-completion adjustments. AI identifies the earn-out mechanics and the carry-forward of tax losses as the key value drivers and negotiation points.",
        keyClauses: [
          { title: "Purchase price & completion (Clause 8)", excerpt: "Base price MYR 45m adjusted by net debt and working capital.", page: 7 },
          { title: "Earn-out (Clause 14)", excerpt: "Up to MYR 8m payable over 24 months against EBITDA targets.", page: 12 },
          { title: "Indemnity & cap (Clauses 22–23)", excerpt: "Tax indemnity unlimited; general indemnity capped at purchase price.", page: 17 },
          { title: "Non-compete (Clause 27)", excerpt: "Vendors restricted from competing for 36 months.", page: 21 },
        ],
        potentialRisks: [
          { title: "Earn-out measurement subjectivity", severity: "high", page: 12 },
          { title: "Carry-forward tax losses untested", severity: "medium", page: 9 },
          { title: "36-month non-compete scope too broad", severity: "medium", page: 21 },
        ],
        missingInformation: ["Deferred consideration structure not finalised.", "Key-person retention agreements not attached."],
        importantDates: ["2025-09-20 (SPA date)", "2025-11-15 (completion)", "2026-11-15 (first earn-out checkpoint)"],
        parties: ["Valley Acquisition Sdn Bhd (buyer)", "Valley Foods Group Sdn Bhd & vendors (sellers)"],
        obligations: [
          "Sellers: disclose all liabilities; cooperate in transition.",
          "Buyer: pay completion price; obtain necessary regulatory approvals.",
        ],
        clauseCount: 58,
        issuesCount: 5,
        unusualClausesCount: 2,
        lastAnalysedAt: today(-8, 3),
        confidence: 0.91,
      };
    case "doc-011":
      return {
        ...base,
        executiveSummary:
          "Deed of mutual covenant for Skyline Residences, establishing the management corporation and common property regime. Covers contribution to sinking fund, by-laws enforcement and dispute resolution. AI notes the sinking fund contribution percentage and the arbitration mechanism as important items.",
        keyClauses: [
          { title: "Sinking fund (Article 5)", excerpt: "Contributions of 3.5% of assessed value, adjusted annually.", page: 6 },
          { title: "By-laws (Schedule 2)", excerpt: "Pets, rentals and renovations governed by 24 by-laws.", page: 18 },
          { title: "Dispute resolution (Article 22)", excerpt: "Arbitration per Arbitration Act 2005; costs follow the event.", page: 21 },
        ],
        potentialRisks: [
          { title: "Sinking fund may be inadequate", severity: "medium", page: 6 },
          { title: "By-law amendment requires 75% consensus", severity: "low", page: 7 },
        ],
        missingInformation: ["Insurance policy details not incorporated."],
        importantDates: ["2024-03-01 (first AGM)", "Ongoing (annual sinking fund call)"],
        parties: ["Skyline Management Corp", "Unit owners of Skyline Residences"],
        obligations: [
          "Owners: pay contribution; comply with by-laws.",
          "Management Corporation: maintain common property; administer funds.",
        ],
        clauseCount: 36,
        issuesCount: 2,
        unusualClausesCount: 0,
        lastAnalysedAt: today(-8, 10),
        confidence: 0.84,
      };
    case "doc-012":
      return {
        ...base,
        executiveSummary:
          "2026 employee policies handbook for TechNova. Covers recruitment, conduct, leave, remuneration, discipline and termination. AI confirms alignment with Employment Act 1955 Part XI and flags the absence of a remote-work policy section.",
        keyClauses: [
          { title: "Remuneration (Section 4)", excerpt: "Salary paid by the 7th of each month; annual review in March.", page: 5 },
          { title: "Annual leave (Section 8)", excerpt: "18 days pro-rated; unused leave cashable at cap of 18 days.", page: 9 },
          { title: "Disciplinary (Section 16)", excerpt: "Summary dismissal for gross misconduct per company code.", page: 14 },
        ],
        potentialRisks: [
          { title: "Absence of remote-work policy", severity: "low", page: 1 },
          { title: "Garden-leave mechanism not stated", severity: "medium", page: 15 },
        ],
        missingInformation: ["Remote-work / hybrid working guidelines not present."],
        importantDates: ["2026-01-01 (effective)", "2026-03-15 (review cycle)"],
        parties: ["TechNova Sdn Bhd (employer)", "All employees"],
        obligations: [
          "Employee: comply with code of conduct; maintain confidentiality.",
          "Employer: provide safe workplace; pay statutory benefits.",
        ],
        clauseCount: 31,
        issuesCount: 2,
        unusualClausesCount: 0,
        lastAnalysedAt: today(-13, 6),
        confidence: 0.86,
      };
    default:
      return { ...base, executiveSummary: "Document awaiting AI analysis.", keyClauses: [], potentialRisks: [], missingInformation: [], importantDates: [], parties: [], obligations: [] };
  }
};

export const DOCUMENT_ANALYSIS_SUMMARIES: Record<string, DocumentAnalysisSummary> = {
  "doc-001": SUMMARY("doc-001"),
  "doc-002": SUMMARY("doc-002"),
  "doc-003": SUMMARY("doc-003"),
  "doc-006": SUMMARY("doc-006"),
  "doc-007": SUMMARY("doc-007"),
  "doc-009": SUMMARY("doc-009"),
  "doc-011": SUMMARY("doc-011"),
  "doc-012": SUMMARY("doc-012"),
};

export function getDocumentAnalysisSummary(documentId: string): DocumentAnalysisSummary | undefined {
  return DOCUMENT_ANALYSIS_SUMMARIES[documentId];
}

export function enrichDocuments(docs: Document[]): Document[] {
  return docs;
}
