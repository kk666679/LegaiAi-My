"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileSignature,
  Wand2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Save,
  Download,
  Languages,
  Shield,
  ListChecks,
  History,
  Plus,
  FileText,
  Gavel,
  Loader2,
  CheckCheck,
  Copy,
  FilePlus2,
  ClipboardCopy,
  RefreshCw,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { AIComposer } from "@/components/lawmate/AIComposer";
import { DRAFT_TEMPLATES } from "@/lib/lawmate/data";
import {
  DEFAULT_TEMPLATE_ID,
  analyzeDraft,
  docTypeForTemplate,
  templateSeed,
} from "@/lib/lawmate/drafting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpcReact } from "@/clients";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanAction,
  PlanContent,
  PlanTrigger,
} from "@/components/ai-elements/plan";

/* ---------------------------------------------------------------------- */
/* Local shapes. trpcReact is typed as `any` upstream (see clients.ts), so   */
/* the shapes consumed here are narrowed locally.                          */
/* ---------------------------------------------------------------------- */

interface DraftRow {
  id: string;
  title: string;
  content?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  tags?: string[] | null;
}

interface EvidenceRow {
  id: string;
  title: string;
  citation?: string | null;
  jurisdiction?: string | null;
  relevance?: number | null;
  status?: string | null;
  supportType?: string | null;
}

interface LomHit {
  id: string;
  type?: string | null;
  actNumber?: string | null;
  titleEn?: string | null;
  titleBm?: string | null;
  citation?: string | null;
  sourceUrl?: string | null;
}

interface QualityResult {
  qualityScore: number;
  citationCoverage: number;
  citations: { total: number; verified: number; pending: number };
  evidence: { count: number };
  unsupported: { sentence: string; rationale: string }[];
  reasons: string[];
  disclaimer: string;
}

interface DraftJob {
  id: string;
  status: string;
  completedAt?: string | null;
}

type SaveStatus = "local" | "unsaved" | "saving" | "saved" | "error";

interface Snapshot {
  id: string;
  label: string;
  at: number;
  author: string;
  content: string;
}

interface StudioCitation {
  /** Database id once persisted; absent for purely local entries. */
  dbId?: string;
  displayText: string;
  section?: string;
  status: string;
  confidence?: number;
  explanation?: string;
  matchedTitle?: string;
  matchedCitation?: string;
}

type ChatMsg = {
  role: "user" | "ai";
  content: string;
  thinking?: string;
};

const AI_ACTIONS: { id: string; label: string; icon: LucideIcon; instruction: string }[] = [
  {
    id: "improve",
    label: "Improve wording",
    icon: Wand2,
    instruction: "Rewrite the selected passage for clarity and professional register without changing its legal effect.",
  },
  {
    id: "simplify",
    label: "Simplify language",
    icon: Sparkles,
    instruction: "Simplify the selected passage into plain English while preserving its legal meaning.",
  },
  {
    id: "formal",
    label: "Make more formal",
    icon: Shield,
    instruction: "Rewrite the selected passage in a more formal, court-appropriate register.",
  },
  {
    id: "cautious",
    label: "Make legally cautious",
    icon: Shield,
    instruction: "Qualify the selected passage so it does not overstate any obligation. Flag anything that needs an authority we have not yet verified.",
  },
  {
    id: "consistency",
    label: "Check consistency",
    icon: ListChecks,
    instruction: "List any internal inconsistency, undefined term or numbering error in this document. Do not rewrite it.",
  },
  {
    id: "risk",
    label: "Identify risks",
    icon: AlertTriangle,
    instruction: "Identify legal and commercial risks in the selected passage. For each risk, name the authority you rely on, or say plainly that no verified authority was available.",
  },
  {
    id: "translate",
    label: "Translate to Malay",
    icon: Languages,
    instruction: "Translate the selected passage into Bahasa Melayu, keeping defined terms in English in brackets on first use.",
  },
  {
    id: "summarise",
    label: "Summarise",
    icon: FileText,
    instruction: "Summarise this document in no more than five bullet points, noting what it obliges each party to do.",
  },
];

const SESSION_KEY = "lawmate:drafting-studio:session";
const HISTORY_KEY = "lawmate:drafting-studio:history";
const CITATIONS_KEY = "lawmate:drafting-studio:citations";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the draft still lives in memory */
  }
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "draft"
  );
}

function titleForTemplate(templateId: string) {
  return (
    DRAFT_TEMPLATES.find((t) => t.id === templateId)?.label ?? "Untitled draft"
  );
}

export default function DraftStudioPage() {
  /* ---------------- local editor session ---------------- */
  const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [title, setTitle] = useState<string>("Warning Letter");
  const [body, setBody] = useState<string>(() => templateSeed(DEFAULT_TEMPLATE_ID));
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("local");
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "ai",
      content:
        "Drafting Studio is ready. Select a passage in the editor and apply an AI action, or ask me a question about this document.",
      thinking:
        "Load the selected template seed. Citations are validated against the LOM catalogue before they are marked verified.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [selectedTab, setSelectedTab] = useState("editor");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [citationQuery, setCitationQuery] = useState("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [citations, setCitations] = useState<StudioCitation[]>([]);
  const [comparing, setComparing] = useState<Snapshot | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- restore local session ---------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("template");
    if (requested && DRAFT_TEMPLATES.some((t) => t.id === requested)) {
      setTemplate(requested);
      setBody(templateSeed(requested));
      setTitle(titleForTemplate(requested));
      return;
    }
    const session = readJson<{ template?: string; title?: string; body?: string }>(
      SESSION_KEY,
      {},
    );
    if (session.body) {
      if (session.template) setTemplate(session.template);
      if (session.title) setTitle(session.title);
      setBody(session.body);
    }
  }, []);

  useEffect(() => {
    setSnapshots(readJson<Snapshot[]>(HISTORY_KEY, []));
    setCitations(readJson<StudioCitation[]>(CITATIONS_KEY, []));
  }, []);

  /* Persist the working session so an unsaved draft survives a reload.
     Debounced so a burst of keystrokes writes once. */
  useEffect(() => {
    if (!body) return;
    if (sessionTimer.current) clearTimeout(sessionTimer.current);
    sessionTimer.current = setTimeout(() => {
      writeJson(SESSION_KEY, { template, title, body });
    }, 600);
  }, [template, title, body]);

  useEffect(() => {
    writeJson(CITATIONS_KEY, citations);
  }, [citations]);

  useEffect(
    () => () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
    },
    [],
  );

  /* ---------------- real data ---------------- */
  const draftList = trpcReact.drafting.list.useQuery(
    { limit: 25 },
    { staleTime: 30_000, retry: false },
  );
  const drafts = ((draftList.data ?? []) as DraftRow[]).filter(
    (d) => d.status !== "archived",
  );

  const qualityQuery = trpcReact.drafting.quality.useQuery(
    { draftId: draftId ?? "" },
    { enabled: !!draftId, staleTime: 15_000, retry: false },
  );
  const serverQuality = (qualityQuery.data ?? null) as QualityResult | null;

  const evidenceQuery = trpcReact.drafting.listEvidence.useQuery(
    { draftId: draftId ?? "" },
    { enabled: !!draftId, staleTime: 30_000, retry: false },
  );
  const serverEvidence = (evidenceQuery.data ?? []) as EvidenceRow[];

  const lomSearch = trpcReact.drafting.lomSearch.useQuery(
    { q: citationQuery, limit: 8 },
    { enabled: citationQuery.trim().length > 1, staleTime: 60_000, retry: false },
  );
  const lomHits = (lomSearch.data ?? []) as LomHit[];

  const jobStatus = trpcReact.drafting.jobStatus.useQuery(
    { jobId: jobId ?? "" },
    {
      enabled: !!jobId,
      retry: false,
      refetchInterval: (query: any) => {
        const status = query?.state?.data?.status;
        return status === "COMPLETED" || status === "FAILED" || status === "CANCELLED"
          ? false
          : 3000;
      },
    },
  );
  const job = (jobStatus.data ?? null) as DraftJob | null;

  const createMutation = trpcReact.drafting.create.useMutation();
  const updateMutation = trpcReact.drafting.update.useMutation();
  const aiSuggest = trpcReact.drafting.aiSuggest.useMutation();
  const insertCitationMutation = trpcReact.drafting.insertCitation.useMutation();
  const validateCitationMutation = trpcReact.drafting.validateCitation.useMutation();
  const retrieveEvidenceMutation = trpcReact.drafting.retrieveEvidence.useMutation();
  const generateMutation = trpcReact.drafting.generate.useMutation();
  const utils = trpcReact.useUtils?.();

  /* ---------------- derived analysis ---------------- */
  const analysis = useMemo(() => analyzeDraft(body), [body]);
  const verifiedCitations = citations.filter((c) => c.status === "VERIFIED").length;

  const scoreRows = useMemo(() => {
    if (serverQuality) {
      return [
        { key: "Citation coverage", value: Math.round(serverQuality.citationCoverage * 100) },
        { key: "Citations verified", value: serverQuality.citations.total ? Math.round((serverQuality.citations.verified / serverQuality.citations.total) * 100) : 0 },
        { key: "Evidence attached", value: Math.min(100, serverQuality.evidence.count * 20) },
        { key: "Unsupported claims", value: Math.max(0, 100 - serverQuality.unsupported.length * 20) },
      ];
    }
    return [
      { key: "Citation coverage", value: Math.round(analysis.coverage * 100) },
      { key: "Citations detected", value: Math.min(100, analysis.citations.length * 15) },
      { key: "Evidence attached", value: serverEvidence.length ? Math.min(100, serverEvidence.length * 25) : 40 },
      { key: "Unsupported claims", value: Math.max(0, 100 - analysis.unsupported.length * 20) },
    ];
  }, [serverQuality, analysis, serverEvidence.length]);

  const overallScore = serverQuality
    ? serverQuality.qualityScore
    : analysis.score;

  const unsupportedAssertions =
    serverQuality?.unsupported ??
    analysis.unsupported.map((u) => ({
      sentence: u.sentence,
      rationale: u.rationale,
    }));

  const steps = useMemo(
    () => [
      { label: "Template selected", done: true },
      { label: draftId ? "Draft saved" : "Draft saved (local)", done: !!draftId },
      { label: "Citations validated", done: citations.length > 0 && verifiedCitations > 0 },
      { label: "Quality reviewed", done: !!serverQuality },
      { label: "Export", done: false },
    ],
    [draftId, citations.length, verifiedCitations, serverQuality],
  );

  /* ---------------- editor helpers ---------------- */
  const selection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return "";
    return el.value.slice(el.selectionStart, el.selectionEnd).trim();
  }, []);

  /**
   * Applies an edit to the editor: replaces the current selection when there
   * is one, otherwise appends the text on a new block.
   */
  const applyEdit = useCallback(
    (text: string) => {
      const el = editorRef.current;
      if (!el) {
        setBody((current) => `${current}${current.endsWith("\n") ? "" : "\n\n"}${text}`);
        return;
      }
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const prefix = start === end ? "\n\n" : "";
      setBody((current) => `${current.slice(0, start)}${prefix}${text}${current.slice(end)}`);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + prefix.length + text.length;
        el.setSelectionRange(pos, pos);
        setHasSelection(false);
      });
    },
    [],
  );

  const pushSnapshot = useCallback(
    (label: string, author: string, content: string) => {
      setSnapshots((current) => {
        const next = [
          { id: `${Date.now()}-${current.length}`, label, at: Date.now(), author, content },
          ...current,
        ].slice(0, 20);
        writeJson(HISTORY_KEY, next);
        return next;
      });
    },
    [],
  );

  const persist = useCallback(
    async (nextBody: string, nextTitle: string, quiet = false) => {
      if (!draftId) {
        if (!quiet) toast.success("Draft kept locally", {
          description: "Sign in and press Save to store it in your workspace.",
        });
        return;
      }
      setSaveStatus("saving");
      try {
        await updateMutation.mutateAsync({ id: draftId, content: nextBody, title: nextTitle });
        setSaveStatus("saved");
        if (!quiet) toast.success("Draft saved");
      } catch {
        setSaveStatus("error");
        toast.error("Could not save the draft", {
          description: "Your changes remain in this browser session.",
        });
      }
    },
    [draftId, updateMutation],
  );

  const markDirty = useCallback(() => {
    setSaveStatus(draftId ? "unsaved" : "local");
  }, [draftId]);

  const handleBodyChange = (value: string) => {
    setBody(value);
    markDirty();
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (draftId) void persist(value, title, true);
    }, 1500);
  };

  const changeTemplate = (next: string) => {
    setTemplate(next);
    setBody(templateSeed(next));
    setTitle(titleForTemplate(next));
    setSaveStatus("local");
    pushSnapshot(`Template → ${titleForTemplate(next)}`, "You", body);
    toast.info(`Template applied: ${titleForTemplate(next)}`);
  };

  const newDraft = () => {
    setDraftId(null);
    setBody(templateSeed(template));
    setTitle(titleForTemplate(template));
    setCitations([]);
    setSaveStatus("local");
    setJobId(null);
    toast.success("Started a new local draft");
  };

  const openDraft = (row: DraftRow) => {
    setDraftId(row.id);
    setTitle(row.title || "Untitled draft");
    setBody(row.content ?? "");
    setSaveStatus("saved");
    const tag = row.tags?.find((t) => DRAFT_TEMPLATES.some((d) => d.id === t));
    if (tag) setTemplate(tag);
    toast.success(`Opened “${row.title}”`);
  };

  const saveDraft = async () => {
    if (!body.trim()) {
      toast.error("Nothing to save", { description: "The draft is empty." });
      return;
    }
    if (!draftId) {
      setSaveStatus("saving");
      try {
        const created = (await createMutation.mutateAsync({
          title: title.trim() || "Untitled draft",
          content: body,
          docType: docTypeForTemplate(template),
        })) as DraftRow;
        setDraftId(created.id);
        setSaveStatus("saved");
        pushSnapshot("Saved to workspace", "You", body);
        await utils?.drafting?.list?.invalidate?.();
        toast.success("Draft saved to your workspace");
      } catch {
        setSaveStatus("error");
        toast.error("Save failed", {
          description: "The draft is safe in this browser. Sign in to persist it server-side.",
        });
      }
      return;
    }
    await persist(body, title);
    pushSnapshot("Manual save", "You", body);
  };

  /* ---------------- AI actions ---------------- */
  const runAction = async (id: string, instruction: string) => {
    const action = AI_ACTIONS.find((a) => a.id === id);
    const picked = selection();
    setActiveAction(id);
    setChat((current) => [
      ...current,
      {
        role: "user",
        content: picked
          ? `${action?.label ?? instruction}\n\nSelection: “${picked}”`
          : `${action?.label ?? instruction} (whole draft)`,
      },
    ]);
    try {
      const result = await aiSuggest.mutateAsync({
        instruction,
        documentType: docTypeForTemplate(template),
        ...(picked ? { selection: picked } : {}),
      });
      if (result?.ok) {
        applyEdit(result.text);
        setChat((current) => [
          ...current,
          {
            role: "ai",
            content: result.text,
            thinking: `${result.provider} · ${result.model} · ${result.latencyMs ?? 0}ms`,
          },
        ]);
        pushSnapshot(`AI: ${action?.label ?? id}`, "AI", `${body}\n\n${result.text}`);
        toast.success(
          `${action?.label ?? "AI action"} ${picked ? "applied to selection" : "appended to draft"}`,
        );
      } else {
        setChat((current) => [
          ...current,
          { role: "ai", content: result?.message ?? "No suggestion was returned." },
        ]);
        toast.warning("No suggestion", {
          description: result?.message ?? "Configure a BYOK provider in Settings to enable AI drafting.",
        });
      }
    } catch {
      setChat((current) => [
        ...current,
        {
          role: "ai",
          content:
            "The drafting agent could not be reached. Check your connection or provider settings — the draft on the left is unaffected.",
        },
      ]);
      toast.error("AI action failed");
    } finally {
      setActiveAction(null);
      markDirty();
    }
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    void runAction("chat", text);
  };

  /* ---------------- citations ---------------- */
  const addCitation = async (hit: LomHit) => {
    const displayText = hit.actNumber ?? hit.titleEn ?? hit.titleBm ?? "Untitled authority";
    const entry: StudioCitation = { displayText, status: "PENDING" };
    setCitations((current) => [{ ...entry }, ...current]);
    applyEdit(`[${displayText}]`);
    markDirty();
    setCitationQuery("");
    if (draftId) {
      try {
        const ref = (await insertCitationMutation.mutateAsync({
          draftId,
          displayText,
          ...(hit.sourceUrl ? { sourceId: hit.sourceUrl } : {}),
        })) as { id: string };
        setCitations((current) =>
          current.map((c) => (c.displayText === displayText && !c.dbId ? { ...c, dbId: ref.id } : c)),
        );
      } catch {
        toast.warning("Citation kept locally", {
          description: "It could not be persisted — validate it from the Quality tab once saved.",
        });
      }
    }
    await void validateOne(entry.displayText);
    toast.success(`Inserted ${displayText}`);
  };

  const validateOne = async (displayText: string) => {
    const existing = citations.find((c) => c.displayText === displayText);
    if (existing?.dbId) {
      try {
        const updated = (await validateCitationMutation.mutateAsync({ id: existing.dbId })) as {
          status: string;
          confidence?: number;
          explanation?: string;
          matchedTitle?: string;
          matchedCitation?: string;
        };
        setCitations((current) =>
          current.map((c) =>
            c.dbId === existing.dbId
              ? {
                  ...c,
                  status: updated.status,
                  confidence: updated.confidence,
                  explanation: updated.explanation,
                  matchedTitle: updated.matchedTitle,
                  matchedCitation: updated.matchedCitation,
                }
              : c,
          ),
        );
      } catch {
        toast.error(`Validation failed for ${displayText}`);
      }
      return;
    }
    // Local heuristic: confirm the text matches a recognisable citation format.
    const known = detectFormat(displayText);
    setCitations((current) =>
      current.map((c) =>
        c.displayText === displayText
          ? {
              ...c,
              status: known,
              confidence: known === "VERIFIED" ? 0.6 : 0,
              explanation:
                known === "VERIFIED"
                  ? "Format matches a recognised Malaysian reporter. Authority text not yet matched against the LOM catalogue."
                  : "No recognised format and no LOM match found.",
            }
          : c,
      ),
    );
  };

  const removeCitation = (displayText: string) => {
    setCitations((current) => current.filter((c) => c.displayText !== displayText));
    toast.message("Citation removed from the list", {
      description: "It was left in the draft text — delete it manually if needed.",
    });
  };

  const pullEvidence = async () => {
    if (!draftId) {
      toast.error("Save the draft first", {
        description: "Evidence is attached to a persisted draft so it stays auditable.",
      });
      return;
    }
    const query = analysis.citations.map((c) => c.raw).join(" ") || title;
    try {
      const created = (await retrieveEvidenceMutation.mutateAsync({
        draftId,
        q: query.slice(0, 500),
      })) as EvidenceRow[];
      await utils?.drafting?.listEvidence?.invalidate?.();
      toast.success(
        created.length ? `Attached ${created.length} source(s)` : "No LOM matches found",
        {
          description: created.length
            ? undefined
            : "Try a different Act number in the Citations tab.",
        },
      );
    } catch {
      toast.error("Evidence retrieval failed");
    }
  };

  const runGenerate = async () => {
    try {
      const res = (await generateMutation.mutateAsync({
        docType: docTypeForTemplate(template),
        title: title.trim() || "Untitled draft",
        facts: body.slice(0, 8000),
        tone: "neutral",
        citations: analysis.citations.map((c) => c.raw).slice(0, 20),
      })) as { jobId: string; documentId: string; status: string };
      setJobId(res.jobId);
      toast.success("Drafting agent queued", {
        description: "Track progress in the workflow bar above the editor.",
      });
    } catch {
      toast.error("Could not queue the drafting job");
    }
  };

  const exportTxt = () => {
    const blob = new Blob([`${title}\n${"=".repeat(title.length)}\n\n${body}`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(title)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as TXT");
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Draft copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  };

  const saveBadge = {
    local: { label: "Local session", icon: FileText, tone: "text-muted-foreground" },
    unsaved: { label: "Unsaved changes", icon: AlertTriangle, tone: "text-amber-500" },
    saving: { label: "Saving…", icon: Loader2, tone: "text-muted-foreground" },
    saved: { label: "All changes saved", icon: CheckCheck, tone: "text-emerald-500" },
    error: { label: "Save failed", icon: AlertTriangle, tone: "text-destructive" },
  }[saveStatus];

  const SaveIcon = saveBadge.icon;

  return (
    <DashboardShell>
      <div className="space-y-4">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Drafting Studio</p>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
              aria-label="Draft title"
              className="mt-1 w-full truncate border-none bg-transparent p-0 text-2xl font-semibold tracking-tight outline-none focus:ring-0"
            />
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">
                {titleForTemplate(template)}
              </Badge>
              <Badge variant="outline" className={cn("gap-1 text-[10px]", saveBadge.tone)}>
                <SaveIcon className={cn("size-3", saveStatus === "saving" && "animate-spin")} />
                {saveBadge.label}
              </Badge>
              <span aria-hidden>·</span>
              <span>{analysis.words} words</span>
              <span aria-hidden>·</span>
              <span>{analysis.citations.length} citations</span>
              <span aria-hidden>·</span>
              <span>HITL L2 · review required</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={template} onValueChange={changeTemplate}>
              <SelectTrigger className="h-9 w-auto gap-1.5 text-xs">
                <FileSignature className="size-3.5" />
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {DRAFT_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {drafts.length > 0 && (
              <Select value={draftId ?? "__new"} onValueChange={(v) => {
                const row = drafts.find((d) => d.id === v);
                if (row) openDraft(row);
              }}>
                <SelectTrigger className="h-9 w-auto gap-1.5 text-xs" aria-label="Open saved draft">
                  <FileText className="size-3.5" />
                  <SelectValue placeholder="Saved drafts" />
                </SelectTrigger>
                <SelectContent>
                  {drafts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="max-w-[220px] truncate">{d.title}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" size="sm" className="gap-1.5" onClick={newDraft}>
              <FilePlus2 className="size-3.5" /> New
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void saveDraft()}>
              <Save className="size-3.5" /> Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Download className="size-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportTxt} className="gap-2">
                  <Download className="size-3.5" /> Plain text (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void copyAll()} className="gap-2">
                  <ClipboardCopy className="size-3.5" /> Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    toast.info("Use your browser's print dialog", {
                      description: "Choose “Save as PDF” to produce a paginated document.",
                    })
                  }
                  className="gap-2"
                >
                  <FileText className="size-3.5" /> PDF via print dialog
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <LegalDisclaimer compact />

        {/* ── Workflow ─────────────────────────────────────── */}
        <Plan defaultOpen>
          <PlanHeader>
            <div>
              <PlanTitle>Draft workflow</PlanTitle>
              <PlanDescription>
                Template → draft → citations → quality → export
              </PlanDescription>
            </div>
            <PlanAction>
              <PlanTrigger />
            </PlanAction>
          </PlanHeader>
          <PlanContent className="space-y-3">
            <ol className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {steps.map((step, i) => (
                <li key={step.label} className="flex items-center gap-1">
                  <span className={cn("flex items-center gap-1", step.done && "text-foreground")}>
                    {step.done ? (
                      <CheckCheck className="size-3 text-emerald-500" />
                    ) : (
                      <span
                        className="inline-block size-3 rounded-full border border-current opacity-40"
                        aria-hidden
                      />
                    )}
                    {step.label}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="text-muted-foreground/40" aria-hidden>
                      ›
                    </span>
                  )}
                </li>
              ))}
            </ol>

            {job ? (
              <div className="rounded-md border bg-card/40 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    Drafting agent · job {job.id.slice(0, 8)}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {job.status}
                  </Badge>
                </div>
                <Progress
                  className="mt-2 h-1.5"
                  value={
                    job.status === "COMPLETED"
                      ? 100
                      : job.status === "FAILED" || job.status === "CANCELLED"
                        ? 100
                        : 45
                  }
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {job.status === "QUEUED"
                    ? "Queued on the legal-drafting worker."
                    : job.status === "PROCESSING"
                      ? "Running the template pipeline. Results land in the document library."
                      : `Job ${job.status.toLowerCase()}.`}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => void runGenerate()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Bot className="size-3.5" />
                  )}
                  Generate with drafting agent
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => void pullEvidence()}>
                  <Gavel className="size-3.5" /> Retrieve evidence
                </Button>
                {jobId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => void jobStatus.refetch()}
                  >
                    <RefreshCw className="size-3.5" /> Refresh job
                  </Button>
                )}
              </div>
            )}
          </PlanContent>
        </Plan>

        {/* ── AI action bar ────────────────────────────────── */}
        <Artifact>
          <ArtifactContent className="p-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                Apply AI to {hasSelection ? "selection" : "whole draft"}:
              </span>
              {AI_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Button
                    key={a.id}
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 whitespace-nowrap"
                    disabled={activeAction !== null}
                    onClick={() => void runAction(a.id, a.instruction)}
                  >
                    {activeAction === a.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                    {a.label}
                  </Button>
                );
              })}
            </div>
          </ArtifactContent>
        </Artifact>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="citations">Citations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Editor */}
          <TabsContent value="editor" className="mt-3">
            <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,380px)]">
              <Artifact>
                <ArtifactHeader>
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <FileSignature className="size-4 shrink-0 text-primary" />
                    <ArtifactTitle className="truncate">Document editor</ArtifactTitle>
                  </div>
                  <ArtifactActions>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => void copyAll()}
                    >
                      <Copy className="size-3.5" /> Copy
                    </Button>
                  </ArtifactActions>
                </ArtifactHeader>
                <textarea
                  ref={editorRef}
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  onSelect={() => setHasSelection(selection().length > 0)}
                  spellCheck={false}
                  aria-label="Draft text"
                  className="min-h-[420px] w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-foreground focus:outline-none sm:p-6 sm:text-sm"
                />
                <div className="flex flex-wrap items-center gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
                  <span>{analysis.words} words</span>
                  <span aria-hidden>·</span>
                  <span>{analysis.characters} characters</span>
                  <span aria-hidden>·</span>
                  <span>{analysis.paragraphs} paragraphs</span>
                  <span className="ml-auto inline-flex items-center gap-1">
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 className="size-3 animate-spin" /> Saving…
                      </>
                    ) : saveStatus === "saved" ? (
                      <>
                        <CheckCircle2 className="size-3 text-emerald-500" /> Saved
                      </>
                    ) : saveStatus === "error" ? (
                      <>
                        <AlertTriangle className="size-3 text-destructive" /> Not saved
                      </>
                    ) : (
                      <>
                        <FileText className="size-3" /> {draftId ? "Unsaved" : "Local session"}
                      </>
                    )}
                  </span>
                </div>
              </Artifact>

              <Artifact className="flex flex-col overflow-hidden">
                <ArtifactHeader>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="size-4 text-primary" />
                    <ArtifactTitle>AI Assistant</ArtifactTitle>
                  </div>
                </ArtifactHeader>
                <ScrollArea className="min-h-[260px] max-h-[320px] flex-1 lg:max-h-[460px]">
                  <div className="space-y-4 p-3">
                    {chat.map((msg, i) => (
                      <Message key={i} from={msg.role === "ai" ? "assistant" : "user"}>
                        {msg.role === "ai" && msg.thinking && (
                          <ChainOfThought defaultOpen={false}>
                            <ChainOfThoughtHeader>Provenance</ChainOfThoughtHeader>
                            <ChainOfThoughtContent>
                              <ChainOfThoughtStep label="Instruction prepared" status="complete" />
                              <ChainOfThoughtStep
                                label="Provider call"
                                status="complete"
                                description={msg.thinking}
                              />
                              <ChainOfThoughtStep
                                label="Citation check"
                                status="complete"
                                description="Authorities are validated against the LOM catalogue before they are marked verified."
                              />
                            </ChainOfThoughtContent>
                          </ChainOfThought>
                        )}
                        <MessageContent>
                          <MessageResponse>{msg.content}</MessageResponse>
                        </MessageContent>
                      </Message>
                    ))}
                  </div>
                </ScrollArea>
                <div className="space-y-2 border-t p-3">
                  <AIComposer
                    value={chatInput}
                    onChange={setChatInput}
                    onSubmit={sendChat}
                    placeholder="Ask the AI to refine, check or translate this draft…"
                    showAttachments={false}
                    isLoading={activeAction !== null}
                    compact
                  />
                </div>
              </Artifact>
            </div>
          </TabsContent>

          {/* Evidence */}
          <TabsContent value="evidence" className="mt-3 space-y-4">
            <Artifact>
              <ArtifactHeader>
                <div>
                  <ArtifactTitle>Evidence attached to this draft</ArtifactTitle>
                  <ArtifactDescription>
                    {draftId
                      ? "Sources retrieved from the LOM catalogue and stored against this draft."
                      : "Save the draft to attach sources — evidence stays auditable only once persisted."}
                  </ArtifactDescription>
                </div>
                <ArtifactActions>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void pullEvidence()}
                    disabled={retrieveEvidenceMutation.isPending}
                  >
                    {retrieveEvidenceMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Gavel className="size-3.5" />
                    )}
                    Retrieve
                  </Button>
                </ArtifactActions>
              </ArtifactHeader>
              <ArtifactContent className="space-y-2">
                {evidenceQuery.isLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Loading evidence…</p>
                ) : serverEvidence.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No evidence attached yet. Detected references in the draft:
                    </p>
                    {analysis.citations.length === 0 ? (
                      <p className="rounded-md border bg-card/40 p-3 text-xs text-muted-foreground">
                        No Act numbers, section references or Malaysian reporter citations were found in
                        the current text. Insert citations from the Citations tab to build the record.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {analysis.citations.map((c, i) => (
                          <li
                            key={`${c.raw}-${i}`}
                            className="flex items-center gap-2 rounded-md border bg-card/40 px-3 py-2 text-xs"
                          >
                            <Badge variant="outline" className="text-[10px]">
                              {c.type}
                            </Badge>
                            <span className="truncate">{c.raw}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  serverEvidence.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 rounded-md border bg-card/30 p-3"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Gavel className="size-4 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{e.title}</p>
                          {e.citation && (
                            <Badge variant="secondary" className="text-[10px]">
                              {e.citation}
                            </Badge>
                          )}
                          {e.jurisdiction && (
                            <Badge variant="outline" className="text-[10px]">
                              {e.jurisdiction}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              e.status === "VERIFIED" && "border-emerald-500/30 text-emerald-500",
                            )}
                          >
                            {(e.status ?? "PENDING").toLowerCase()}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {e.supportType ? `Support: ${e.supportType} · ` : ""}
                          Relevance{" "}
                          {e.relevance != null ? `${Math.round(e.relevance * 100)}%` : "—"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </ArtifactContent>
            </Artifact>
          </TabsContent>

          {/* Quality */}
          <TabsContent value="quality" className="mt-3 space-y-4">
            <Artifact>
              <ArtifactHeader>
                <div>
                  <ArtifactTitle>Draft quality</ArtifactTitle>
                  <ArtifactDescription>
                    {serverQuality
                      ? serverQuality.disclaimer
                      : "Local heuristic preview. Save the draft to score it against persisted citations and evidence."}
                  </ArtifactDescription>
                </div>
                {qualityQuery.isFetching && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                )}
              </ArtifactHeader>
              <ArtifactContent className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Overall</span>
                    <span className="text-2xl font-semibold tracking-tight">
                      {overallScore}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </span>
                  </div>
                  <Progress value={overallScore} className="h-2" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {serverQuality
                      ? "Computed from persisted citations, evidence and unsupported assertions."
                      : "Computed in this browser from the citation patterns in your text."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {scoreRows.map((row) => (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>{row.key}</span>
                        <span className="font-medium tabular-nums">{row.value}</span>
                      </div>
                      <Progress value={row.value} className="h-1.5" />
                    </div>
                  ))}
                </div>

                {serverQuality && serverQuality.reasons.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Breakdown</p>
                      <ul className="mt-2 space-y-1">
                        {serverQuality.reasons.map((r) => (
                          <li key={r} className="text-xs text-muted-foreground">
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </ArtifactContent>
            </Artifact>

            <Artifact>
              <ArtifactHeader>
                <div>
                  <ArtifactTitle>Unsupported assertions</ArtifactTitle>
                  <ArtifactDescription>
                    Legal-sounding statements with no authority attached.
                  </ArtifactDescription>
                </div>
              </ArtifactHeader>
              <ArtifactContent className="space-y-2">
                {unsupportedAssertions.length === 0 ? (
                  <p className="flex items-center gap-2 rounded-md border bg-card/40 p-3 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500" aria-hidden />
                    No unsupported assertions detected.
                  </p>
                ) : (
                  unsupportedAssertions.map((u, i) => (
                    <div key={`${u.sentence}-${i}`} className="rounded-md border bg-card/40 p-3">
                      <p className="text-xs font-medium">{u.sentence}</p>
                      <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                        {u.rationale}
                      </p>
                    </div>
                  ))
                )}
              </ArtifactContent>
            </Artifact>
          </TabsContent>

          {/* Citations */}
          <TabsContent value="citations" className="mt-3 space-y-4">
            <Artifact>
              <ArtifactHeader>
                <div>
                  <ArtifactTitle>Insert and validate citations</ArtifactTitle>
                  <ArtifactDescription>
                    Search the LOM legislation catalogue, insert, then validate the format.
                  </ArtifactDescription>
                </div>
              </ArtifactHeader>
              <ArtifactContent className="space-y-3">
                <input
                  value={citationQuery}
                  onChange={(e) => setCitationQuery(e.target.value)}
                  placeholder="Search LOM: Act number, title, section…"
                  aria-label="Search the LOM catalogue"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />

                {citationQuery.trim().length > 1 && (
                  <div className="space-y-1 rounded-md border bg-card/30 p-2">
                    {lomSearch.isFetching ? (
                      <p className="p-2 text-xs text-muted-foreground">Searching LOM…</p>
                    ) : lomHits.length === 0 ? (
                      <p className="p-2 text-xs text-muted-foreground">
                        No LOM match. Try the Act number, e.g. “Act 265”.
                      </p>
                    ) : (
                      lomHits.map((hit) => (
                        <button
                          key={hit.id}
                          onClick={() => void addCitation(hit)}
                          className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent/40"
                        >
                          <Gavel className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {hit.titleEn ?? hit.titleBm ?? hit.actNumber}
                            </span>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {hit.actNumber ?? hit.type}
                              {hit.citation ? ` · ${hit.citation}` : ""}
                            </span>
                          </span>
                          <Plus className="size-3 shrink-0 text-muted-foreground" />
                        </button>
                      ))
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {citations.length === 0 ? (
                    <p className="rounded-md border bg-card/40 p-3 text-xs text-muted-foreground">
                      No citations in this draft yet. Search the LOM catalogue above, or write an Act
                      reference directly in the editor — it will be detected by the Quality tab.
                    </p>
                  ) : (
                    citations.map((c) => (
                      <div
                        key={`${c.displayText}-${c.dbId ?? "local"}`}
                        className="flex items-start gap-3 rounded-md border bg-card/30 p-3"
                      >
                        <span className="mt-0.5 shrink-0">
                          {c.status === "VERIFIED" ? (
                            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
                          ) : c.status === "INVALID" ? (
                            <AlertTriangle className="size-4 text-destructive" aria-hidden />
                          ) : (
                            <AlertTriangle className="size-4 text-amber-500" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{c.displayText}</p>
                          {c.matchedTitle && (
                            <p className="text-[11px] text-muted-foreground">
                              Matched: {c.matchedTitle}
                              {c.matchedCitation ? ` · ${c.matchedCitation}` : ""}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {c.status.toLowerCase()}
                            {c.confidence != null &&
                              ` · ${Math.round(c.confidence * 100)}% confidence`}
                            {c.explanation ? ` — ${c.explanation}` : ""}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Validate ${c.displayText}`}
                          onClick={() => void validateOne(c.displayText)}
                        >
                          <RefreshCw className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${c.displayText}`}
                          onClick={() => removeCitation(c.displayText)}
                        >
                          <span aria-hidden>×</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ArtifactContent>
            </Artifact>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-3 space-y-4">
            <Artifact>
              <ArtifactHeader>
                <div>
                  <ArtifactTitle>Version history</ArtifactTitle>
                  <ArtifactDescription>
                    Every template change, save and AI action in this browser session.
                  </ArtifactDescription>
                </div>
              </ArtifactHeader>
              <ArtifactContent className="space-y-2">
                {snapshots.length === 0 ? (
                  <p className="rounded-md border bg-card/40 p-3 text-xs text-muted-foreground">
                    No snapshots yet. Saving, switching templates or applying an AI action records one.
                  </p>
                ) : (
                  snapshots.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-md border bg-card/30 p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <History className="size-4 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{v.label}</p>
                          {v.author === "AI" && (
                            <Badge variant="outline" className="text-[10px]">
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {v.author} · {new Date(v.at).toLocaleString("en-MY")} ·{" "}
                          {v.content.split(/\s+/).filter(Boolean).length} words
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setComparing(v)}
                      >
                        Compare
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBody(v.content);
                          setSaveStatus(draftId ? "unsaved" : "local");
                          toast.success(`Restored “${v.label}”`);
                        }}
                      >
                        Restore
                      </Button>
                    </div>
                  ))
                )}
              </ArtifactContent>
            </Artifact>

            {comparing && (
              <Artifact>
                <ArtifactHeader>
                  <div>
                    <ArtifactTitle>Comparison</ArtifactTitle>
                    <ArtifactDescription>
                      Current draft vs “{comparing.label}”
                    </ArtifactDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setComparing(null)}>
                    Close
                  </Button>
                </ArtifactHeader>
                <ArtifactContent className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: `Snapshot · ${new Date(comparing.at).toLocaleString("en-MY")}`, text: comparing.content },
                    { label: "Current draft", text: body },
                  ].map((col) => {
                    const words = col.text.split(/\s+/).filter(Boolean).length;
                    return (
                      <div key={col.label} className="space-y-1.5">
                        <p className="text-xs font-medium">{col.label}</p>
                        <p className="text-[11px] text-muted-foreground">{words} words</p>
                        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border bg-card/40 p-3 font-mono text-[11px] leading-relaxed">
                          {col.text}
                        </pre>
                      </div>
                    );
                  })}
                </ArtifactContent>
              </Artifact>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

/** Recognises a Malaysian reporter or Act format in a citation string. */
function detectFormat(value: string) {
  if (/\[\d{4}\]\s+\d+\s+(?:MLJ|AM|AMCR)\s+\d+/.test(value)) return "VERIFIED";
  if (/\bAct\s+(?:[Aa]\d+|\d+)/.test(value)) return "UNVERIFIED";
  return "INVALID";
}