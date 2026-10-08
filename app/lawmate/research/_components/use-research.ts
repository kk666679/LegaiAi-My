"use client";
// app/lawmate/research/_components/use-research.ts
import * as React from "react";
import type {
  Authority,
  AuthorityKind,
  Finding,
  ResearchCollection,
  ResearchFilters,
  ResearchMemo,
  ResearchQuery,
  ResearchReasoningStep,
  ResearchSession,
  ResearchSort,
  ResearchStats,
} from "./types";

export interface UseResearchOptions {
  filters?: ResearchFilters;
  sort?: ResearchSort;
  sessionId?: string;
  scope?: string;
}

export interface UseResearchResult {
  sessions: ResearchSession[];
  sessionsLoading: boolean;
  sessionsError?: string;

  activeSession: ResearchSession | null;
  sessionAuthorities: Authority[];
  sessionFindings: Finding[];
  sessionReasoning: ResearchReasoningStep[];
  sessionMemo: ResearchMemo | null;

  collections: ResearchCollection[];
  stats: ResearchStats | null;

  // Actions
  createSession: (query: ResearchQuery) => Promise<ResearchSession>;
  saveSession: (id: string, saved: boolean) => void;
  deleteSession: (id: string) => void;
  updateMemo: (sessionId: string, patch: Partial<ResearchMemo>) => void;
  addToCollection: (sessionId: string, collectionId: string) => void;
  reload: () => void;
}

export function useResearch(options: UseResearchOptions = {}): UseResearchResult {
  const { filters, sort, sessionId, scope = "all" } = options;

  const [sessions, setSessions] = React.useState<ResearchSession[]>([]);
  const [sessionAuthorities, setSessionAuthorities] = React.useState<Authority[]>([]);
  const [sessionFindings, setSessionFindings] = React.useState<Finding[]>([]);
  const [sessionReasoning, setSessionReasoning] = React.useState<ResearchReasoningStep[]>([]);
  const [sessionMemo, setSessionMemo] = React.useState<ResearchMemo | null>(null);
  const [sessionsLoading, setSessionsLoading] = React.useState(true);
  const [sessionsError, setSessionsError] = React.useState<string>();
  const [tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);

  const mock = React.useMemo(() => createMockData(), []);

  // ── Sessions fetch ───────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setSessionsLoading(true);
    setSessionsError(undefined);

    Promise.resolve(mock)
      .then((m) => {
        if (cancelled) return;

        let list = m.sessions;

        if (scope === "saved") list = list.filter((s) => s.saved);
        if (scope === "recent") list = list.slice(0, 5);

        if (filters?.query) {
          const q = filters.query.toLowerCase();
          list = list.filter((s) =>
            `${s.title} ${s.query.text}`.toLowerCase().includes(q),
          );
        }

        setSessions(list);
      })
      .catch((e) => {
        if (!cancelled) setSessionsError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, sort, scope, tick, mock]);

  // ── Session detail fetch ─────────────────────────────────
  React.useEffect(() => {
    if (!sessionId) {
      setSessionAuthorities([]);
      setSessionFindings([]);
      setSessionReasoning([]);
      setSessionMemo(null);
      return;
    }

    let cancelled = false;

    // Simulate a staggered load so streaming feels real
    Promise.resolve(mock)
      .then((m) => {
        if (cancelled) return;

        // Filter authorities by session scope
        const session = m.sessions.find((s) => s.id === sessionId);
        if (!session) return;

        const authorities = m.authorities.slice(0, session.authorityCount || 8);
        setSessionAuthorities(authorities);
        setSessionFindings(m.findings.slice(0, session.findingCount || 4));
        setSessionReasoning(m.reasoning);
        setSessionMemo(m.memo);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [sessionId, mock]);

  // ── Derived ──────────────────────────────────────────────
  const activeSession = React.useMemo(
    () => (sessionId ? sessions.find((s) => s.id === sessionId) ?? null : null),
    [sessionId, sessions],
  );

  // ── Actions ──────────────────────────────────────────────
  const createSession = React.useCallback(
    async (query: ResearchQuery): Promise<ResearchSession> => {
      const session: ResearchSession = {
        id: `session-${Date.now()}`,
        title: query.text.length > 60 ? `${query.text.slice(0, 60)}…` : query.text,
        query,
        status: "running",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorityCount: 0,
        findingCount: 0,
      };
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    [],
  );

  const saveSession = React.useCallback((id: string, saved: boolean) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, saved } : s)));
  }, []);

  const deleteSession = React.useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateMemo = React.useCallback(
    (sid: string, patch: Partial<ResearchMemo>) => {
      setSessionMemo((prev) =>
        prev ? { ...prev, ...patch, updatedAt: new Date().toISOString() } : null,
      );
    },
    [],
  );

  const addToCollection = React.useCallback(
    (sid: string, collectionId: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid
            ? { ...s, tags: Array.from(new Set([...(s.tags ?? []), collectionId])) }
            : s,
        ),
      );
    },
    [],
  );

  return {
    sessions,
    sessionsLoading,
    sessionsError,
    activeSession,
    sessionAuthorities,
    sessionFindings,
    sessionReasoning,
    sessionMemo,
    collections: mock.collections,
    stats: mock.stats,
    createSession,
    saveSession,
    deleteSession,
    updateMemo,
    addToCollection,
    reload,
  };
}

// ─────────────────────────────────────────────────────────────
// Mock dataset — replace when the backend is ready
// ─────────────────────────────────────────────────────────────
function createMockData(): {
  sessions: ResearchSession[];
  authorities: Authority[];
  findings: Finding[];
  reasoning: ResearchReasoningStep[];
  memo: ResearchMemo;
  collections: ResearchCollection[];
  stats: ResearchStats;
} {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

  const authorities: Authority[] = [
    {
      id: "wong-yuen-foo-v-soon-hing",
      kind: "case",
      court: "federal-court",
      jurisdiction: "MY",
      year: 1973,
      title: "Wong Yuen Foo v Soon Hing",
      citation: {
        id: "c-1",
        short: "[1973] 1 MLJ 225",
        full: "Wong Yuen Foo v Soon Hing [1973] 1 MLJ 225 (Federal Court)",
        kind: "case",
        authorityId: "wong-yuen-foo-v-soon-hing",
      },
      judge: "Suffian LP",
      bench: ["Suffian LP", "Ong Hock Thye FJ", "Ali FJ"],
      summary:
        "An employer terminating for misconduct must conduct a fair inquiry before dismissal. Failure to do so renders the dismissal without just cause.",
      headnote:
        "The Industrial Court has consistently held that a domestic inquiry is a prerequisite to a lawful dismissal for misconduct. Absence of inquiry is not fatal per se, but the employer must show the employee was given a real opportunity to be heard.",
      keyParagraphs: [
        { para: 5, note: "Requirement of fair inquiry", text: "Where an employer intends to dismiss for misconduct, it is incumbent that a fair inquiry be held so that the employee may answer the allegations against him." },
        { para: 12, note: "Opportunity to be heard", text: "The requirement is not the form of the inquiry but the substance — the employee must have a real and adequate opportunity to present his case." },
      ],
      relevance: 0.94,
      confidence: 0.91,
      rationale: "Directly addresses the domestic inquiry requirement under s.14(1)(a) Employment Act 1955.",
      url: "https://lom.agc.gov.my/",
      tags: ["employment", "misconduct", "domestic-inquiry"],
    },
    {
      id: "employment-act-1955-s14",
      kind: "statute",
      jurisdiction: "MY",
      year: 1955,
      title: "Employment Act 1955 — Section 14",
      citation: {
        id: "c-2",
        short: "Act 265, s.14",
        full: "Employment Act 1955 (Act 265), s.14",
        kind: "statute",
        authorityId: "employment-act-1955-s14",
      },
      summary:
        "Governs termination of a contract of service on grounds of misconduct. Requires inquiry into alleged misconduct before dismissal, or payment of compensation.",
      headnote:
        "(1) An employer may terminate a contract of service without notice on the ground of misconduct after due inquiry. (2) If the inquiry is not held, the employer may be liable to pay compensation in lieu of notice.",
      keyParagraphs: [
        { para: 1, note: "Termination for misconduct", text: "An employer may terminate the contract of service without notice on the ground of misconduct after due inquiry…" },
        { para: 3, note: "Compensation for wrongful dismissal", text: "…the employer shall not be entitled to dismiss without notice and shall be liable to pay compensation." },
      ],
      relevance: 0.98,
      confidence: 0.99,
      url: "https://lom.agc.gov.my/",
      tags: ["employment", "statute", "misconduct"],
    },
    {
      id: "industrial-relations-act-1967-s20",
      kind: "statute",
      jurisdiction: "MY",
      year: 1967,
      title: "Industrial Relations Act 1967 — Section 20",
      citation: {
        id: "c-3",
        short: "Act 177, s.20",
        full: "Industrial Relations Act 1967 (Act 177), s.20",
        kind: "statute",
        authorityId: "industrial-relations-act-1967-s20",
      },
      summary:
        "Provides the statutory remedy for unfair dismissal. An employee who considers himself dismissed without just cause may make a representation to the Director-General for reinstatement.",
      relevance: 0.85,
      confidence: 0.96,
      url: "https://lom.agc.gov.my/",
      tags: ["employment", "unfair-dismissal"],
    },
    {
      id: "milan-auto-v-industrial-court",
      kind: "case",
      court: "federal-court",
      jurisdiction: "MY",
      year: 2021,
      title: "Milan Auto Sdn Bhd v Industrial Court Malaysia",
      citation: {
        id: "c-4",
        short: "[2021] 1 MLJ 123",
        full: "Milan Auto Sdn Bhd v Industrial Court Malaysia [2021] 1 MLJ 123",
        kind: "case",
        authorityId: "milan-auto-v-industrial-court",
      },
      summary:
        "The Industrial Court has jurisdiction to review the procedural fairness of a domestic inquiry but must not substitute its own decision for that of the employer.",
      relevance: 0.72,
      confidence: 0.88,
      url: "https://lom.agc.gov.my/",
      tags: ["employment", "industrial-court"],
    },
    {
      id: "dr-james-alfred-v-kk-mart",
      kind: "case",
      court: "court-of-appeal",
      jurisdiction: "MY",
      year: 2019,
      title: "Dr James Alfred v K.K. Mart Sdn Bhd",
      citation: {
        id: "c-5",
        short: "[2019] 4 MLJ 479",
        full: "Dr James Alfred v K.K. Mart Sdn Bhd [2019] 4 MLJ 479 (Court of Appeal)",
        kind: "case",
        authorityId: "dr-james-alfred-v-kk-mart",
      },
      summary:
        "The Industrial Court's award of reinstatement is discretionary. Backwages should be capped at 24 months in ordinary cases.",
      relevance: 0.68,
      confidence: 0.92,
      url: "https://lom.agc.gov.my/",
      tags: ["employment", "reinstatement", "backwages"],
    },
    {
      id: "industrial-court-practice-note-2-2019",
      kind: "practice-direction",
      jurisdiction: "MY",
      year: 2019,
      title: "Industrial Court Practice Note No. 2 of 2019",
      citation: {
        id: "c-6",
        short: "ICPN 2/2019",
        full: "Industrial Court of Malaysia Practice Note No. 2 of 2019",
        kind: "practice-direction",
        authorityId: "industrial-court-practice-note-2-2019",
      },
      summary:
        "Sets out the procedure for case management and the requirements for filing a statement of case in unfair dismissal proceedings.",
      relevance: 0.55,
      confidence: 0.94,
      tags: ["employment", "procedure"],
    },
    {
      id: "syed-azlan-v-malaysian-airlines",
      kind: "case",
      court: "high-court",
      jurisdiction: "MY",
      year: 2020,
      title: "Syed Azlan v Malaysian Airlines Berhad",
      citation: {
        id: "c-7",
        short: "[2020] 3 MLJ 55",
        full: "Syed Azlan v Malaysian Airlines Berhad [2020] 3 MLJ 55 (High Court)",
        kind: "case",
        authorityId: "syed-azlan-v-malaysian-airlines",
      },
      summary:
        "Summary dismissal for dishonesty was upheld where the employer held a fair inquiry and the employee had full opportunity to respond.",
      relevance: 0.62,
      confidence: 0.85,
      tags: ["employment", "dishonesty"],
    },
    {
      id: "anon-2022-employment-tribunal",
      kind: "circular",
      jurisdiction: "MY",
      year: 2022,
      title: "Ministry of Human Resources Circular No. 4/2022",
      citation: {
        id: "c-8",
        short: "MOHR Circular 4/2022",
        full: "Ministry of Human Resources Circular No. 4 of 2022",
        kind: "circular",
        authorityId: "anon-2022-employment-tribunal",
      },
      summary:
        "Guidance on the amended provisions of the Employment Act following the Employment (Amendment) Act 2022, including flexible working arrangements and maternity leave.",
      relevance: 0.40,
      confidence: 0.90,
      tags: ["employment", "statute", "amendments"],
    },
  ];

  const findings: Finding[] = [
    {
      id: "f-1",
      kind: "ratio",
      title: "Fair inquiry is a precondition to dismissal for misconduct",
      summary:
        "Section 14(1)(a) of the Employment Act 1955 requires due inquiry before termination for misconduct. Wong Yuen Foo confirms that the inquiry must give the employee a real opportunity to be heard.",
      authorityIds: ["employment-act-1955-s14", "wong-yuen-foo-v-soon-hing"],
      confidence: 0.91,
      paragraph: 5,
    },
    {
      id: "f-2",
      kind: "holding",
      title: "The Industrial Court may review procedural fairness",
      summary:
        "Milan Auto confirms the Industrial Court's jurisdiction to review whether the employer's inquiry was fair, without substituting its own decision for the employer's.",
      authorityIds: ["milan-auto-v-industrial-court"],
      confidence: 0.85,
    },
    {
      id: "f-3",
      kind: "gap",
      title: "No authority on remote domestic inquiries",
      summary:
        "The retrieved authorities do not directly address whether a domestic inquiry may be conducted remotely (video conference). Consider whether an analogy to Milan Auto's flexibility principle applies.",
      authorityIds: [],
      confidence: 0.42,
    },
    {
      id: "f-4",
      kind: "contradiction",
      title: "Backwages cap may be contested",
      summary:
        "Dr James Alfred caps backwages at 24 months in ordinary cases, but the Federal Court in Wong Yuen Foo did not address a cap. Some Industrial Court awards have exceeded 24 months in egregious cases.",
      authorityIds: ["dr-james-alfred-v-kk-mart", "wong-yuen-foo-v-soon-hing"],
      confidence: 0.68,
    },
  ];

  const reasoning: ResearchReasoningStep[] = [
    { id: "r1", kind: "issue", label: "Parsed the issue", status: "complete", detail: "Termination for misconduct — procedural fairness under the Employment Act 1955." },
    { id: "r2", kind: "search", label: "Retrieved Malaysian authorities", status: "complete", detail: "8 authorities across statutes, cases, and practice directions.", authorityIds: ["employment-act-1955-s14", "wong-yuen-foo-v-soon-hing", "milan-auto-v-industrial-court"] },
    { id: "r3", kind: "filter", label: "Filtered by relevance and jurisdiction", status: "complete", detail: "Removed duplicate and non-Malaysian sources.", authorityIds: [] },
    { id: "r4", kind: "rank", label: "Ranked by authority weight", status: "complete", detail: "Federal Court > Court of Appeal > High Court > Industrial Court.", authorityIds: [] },
    { id: "r5", kind: "rule", label: "Extracted the governing rule", status: "complete", detail: "s.14(1)(a) EA 1955 + Wong Yuen Foo domestic inquiry requirement.", authorityIds: ["employment-act-1955-s14", "wong-yuen-foo-v-soon-hing"], confidence: 0.91 },
    { id: "r6", kind: "application", label: "Applied to the facts", status: "complete", detail: "Facts on file do not show an inquiry was held; employee was not given an opportunity to respond.", authorityIds: [], confidence: 0.78 },
    { id: "r7", kind: "conclusion", label: "Drafted the conclusion", status: "complete", detail: "Dismissal likely unfair on procedural grounds; reinstatement or compensation is available under s.20 IRA 1967.", authorityIds: ["industrial-relations-act-1967-s20"], confidence: 0.82 },
  ];

  const memo: ResearchMemo = {
    id: "memo-1",
    sessionId: "session-1",
    title: "Dismissal for misconduct — procedural fairness",
    status: "draft",
    createdAt: iso(20 * 60_000),
    updatedAt: iso(5 * 60_000),
    authorName: "Aisyah Rahman",
    body: `# Dismissal for misconduct — procedural fairness

## Issue

Whether the dismissal of Lim Wei Jian for misconduct was lawful given the procedure the employer followed.

## Rule

**Section 14(1)(a) of the Employment Act 1955** permits an employer to terminate a contract of service without notice on the ground of misconduct *after due inquiry*. The Federal Court in **Wong Yuen Foo v Soon Hing [1973] 1 MLJ 225** held that the inquiry must give the employee a real and adequate opportunity to be heard.

## Application

On the facts, no domestic inquiry was held. The employee was informed of the allegations but was not invited to respond. Under **Milan Auto Sdn Bhd v Industrial Court Malaysia [2021] 1 MLJ 123**, the Industrial Court may review this procedural unfairness without substituting its own decision for the employer's.

## Conclusion

The dismissal is likely procedurally unfair. The employee may bring a representation under **s.20 of the Industrial Relations Act 1967**. Reinstatement or compensation in lieu is available. Backwages are likely capped at 24 months per **Dr James Alfred v K.K. Mart Sdn Bhd [2019] 4 MLJ 479**.`,
  };

  const sessions: ResearchSession[] = [
    {
      id: "session-1",
      title: "Dismissal for misconduct — procedural fairness",
      query: {
        id: "q-1",
        text: "Is a domestic inquiry required before dismissing an employee for misconduct in Malaysia?",
        scope: {
          jurisdictions: ["MY"],
          kinds: ["case", "statute", "regulation", "practice-direction"],
          includeSecondary: false,
        },
        createdAt: iso(20 * 60_000),
      },
      status: "complete",
      createdAt: iso(20 * 60_000),
      updatedAt: iso(2 * 60_000),
      authorityCount: 6,
      findingCount: 4,
      avgConfidence: 0.81,
      durationMs: 32_400,
      ownerName: "Aisyah Rahman",
      matterId: "m-246",
      matterName: "TechNova Sdn Bhd — employment matter",
      clientName: "TechNova Sdn Bhd",
      saved: true,
      tags: ["employment", "misconduct", "procedural-fairness"],
      memoId: "memo-1",
    },
    {
      id: "session-2",
      title: "Director fiduciary duties — scope",
      query: {
        id: "q-2",
        text: "What are the fiduciary duties of a director under the Companies Act 2016?",
        scope: {
          jurisdictions: ["MY"],
          kinds: ["case", "statute"],
          includeSecondary: false,
        },
        createdAt: iso(1 * 86_400_000),
      },
      status: "complete",
      createdAt: iso(1 * 86_400_000),
      updatedAt: iso(1 * 86_400_000 + 4_000),
      authorityCount: 8,
      findingCount: 5,
      avgConfidence: 0.88,
      durationMs: 41_200,
      ownerName: "Priya Sundaram",
      saved: false,
      tags: ["corporate", "fiduciary"],
    },
    {
      id: "session-3",
      title: "PDPA data subject rights",
      query: {
        id: "q-3",
        text: "What rights do data subjects have under the Personal Data Protection Act 2010?",
        scope: {
          jurisdictions: ["MY"],
          kinds: ["statute", "regulation", "circular"],
          includeSecondary: true,
        },
        createdAt: iso(3 * 86_400_000),
      },
      status: "complete",
      createdAt: iso(3 * 86_400_000),
      updatedAt: iso(3 * 86_400_000 + 6_000),
      authorityCount: 12,
      findingCount: 6,
      avgConfidence: 0.86,
      durationMs: 28_600,
      ownerName: "Daniel Tan",
      saved: true,
      tags: ["data-protection", "compliance"],
    },
    {
      id: "session-4",
      title: "Limitation period — contract claims",
      query: {
        id: "q-4",
        text: "What is the limitation period for a claim in contract in Malaysia?",
        scope: {
          jurisdictions: ["MY"],
          kinds: ["statute", "case"],
          includeSecondary: false,
        },
        createdAt: iso(5 * 86_400_000),
      },
      status: "complete",
      createdAt: iso(5 * 86_400_000),
      updatedAt: iso(5 * 86_400_000 + 2_400),
      authorityCount: 5,
      findingCount: 2,
      avgConfidence: 0.94,
      durationMs: 18_200,
      ownerName: "Aisyah Rahman",
      saved: false,
      tags: ["litigation", "limitation"],
    },
  ];

  const collections: ResearchCollection[] = [
    { id: "col-1", name: "Employment law playbook", description: "Recurring issues in employment matters.", sessionCount: 12, createdAt: iso(30 * 86_400_000), updatedAt: iso(1 * 86_400_000), color: "hsl(217 91% 60%)" },
    { id: "col-2", name: "PDPA compliance", description: "Data protection research for the TechNova engagement.", sessionCount: 8, createdAt: iso(20 * 86_400_000), updatedAt: iso(3 * 86_400_000), color: "hsl(160 84% 39%)", matterId: "m-246" },
    { id: "col-3", name: "Litigation research", description: "Case law on procedural and evidentiary issues.", sessionCount: 5, createdAt: iso(15 * 86_400_000), updatedAt: iso(5 * 86_400_000), color: "hsl(32 95% 44%)" },
  ];

  const stats: ResearchStats = {
    totalSessions: 24,
    sessionsThisWeek: 4,
    savedSessions: 2,
    totalAuthorities: 87,
    avgConfidence: 0.84,
    avgDurationMs: 26_400,
    byKind: { case: 45, statute: 22, regulation: 8, "practice-direction": 3, secondary: 6, treaty: 1, constitutional: 2, circular: 0 },
  };

  return { sessions, authorities, findings, reasoning, memo, collections, stats };
}
