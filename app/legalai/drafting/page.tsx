"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FileSignature,
  Wand2,
  Sparkles,
  AlertTriangle,
  Save,
  Download,
  Languages,
  Shield,
  ListChecks,
  History,
  FileText,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { AIComposer } from "@/components/lawmate/AIComposer";
import { DRAFT_TEMPLATES } from "@/lib/lawmate/data";
import { cn } from "@/lib/utils";
import { AIChip } from "@/components/ai/aichip";
import { AIStatusIndicator } from "@/components/ai/aistatus-indicator";
import { AIMetricCard } from "@/components/ai/aimetric-card";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactActions,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
  MessageToolbar,
} from "@/components/ai-elements/message";
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ai-elements/sources";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
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
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationSource,
  InlineCitationQuote,
} from "@/components/ai-elements/inline-citation";
import { Copy, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";

const DRAFT_BODY = `Date: 21 August 2026

Dear Mr. Lim Wei Jian,

We refer to your recent conduct on 18 August 2026 in which you were observed accessing restricted systems without authorisation. This letter serves as a FORMAL WARNING regarding the seriousness of your actions and the consequences should similar behaviour recur.

You are required to respond in writing within seven (7) working days explaining the circumstances and providing any mitigating factors you wish the Company to consider.

Failure to respond, or a finding that the conduct warrants disciplinary action, may result in suspension or termination of your employment.

Please treat this matter with the seriousness it deserves.

Yours faithfully,
For and on behalf of TechNova Sdn Bhd

Aisyah Rahman
Head of People Operations`;

const AI_ACTIONS = [
  { id: "improve", label: "Improve wording", icon: Wand2 },
  { id: "simplify", label: "Simplify language", icon: Sparkles },
  { id: "formal", label: "Make more formal", icon: Shield },
  { id: "cautious", label: "Make legally cautious", icon: Shield },
  { id: "consistency", label: "Check consistency", icon: ListChecks },
  { id: "risk", label: "Identify risks", icon: AlertTriangle },
  { id: "translate", label: "Translate to Malay", icon: Languages },
  { id: "summarise", label: "Summarise", icon: FileText },
];

type ToolState = "output-available" | "input-available" | "input-streaming";

type ChatMsg = {
  role: "user" | "ai";
  content: string;
  thinking?: string;
  toolName?: string;
  toolState?: ToolState;
  toolInput?: Record<string, string>;
  toolOutput?: string;
  sources?: { href: string; title: string }[];
};

const WORKFLOW_STEPS = [
  "Template selected",
  "AI draft generated",
  "Review in progress",
  "Citation check",
  "Export",
];

export default function DraftingPage() {
  const [template, setTemplate] = useState<string>("warning_letter");
  const [body, setBody] = useState(DRAFT_BODY);
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "ai",
      content:
        "I've prepared a draft warning letter based on the **warning_letter** template. Review it and let me know if you'd like me to make it more legally cautious, identify risks, or improve wording.",
      thinking:
        "Drafted from the warning_letter template. Cross-referenced Section 14 of the Employment Act 1955 on disciplinary procedures and the company's internal grievance policy.",
      sources: [
        { href: "https://lom.gov.my/act/employment-1955", title: "Employment Act 1955 — s.14" },
        { href: "https://lom.gov.my/case/wong-yuen-foo", title: "Wong Yuen Foo v Soon Hing" },
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const wordCount = body.split(/\s+/).filter(Boolean).length;

  const runAction = (id: string, label: string) => {
    setActiveAction(id);
    setChat((c) => [
      ...c,
      { role: "user", content: label },
      {
        role: "ai",
        content: `Applied: **${label}**. Changes streamed into the editor with citation-backed justifications.`,
        thinking: `Verifying "${label}" against active authorities before applying.`,
        toolName: label,
        toolState: "output-available" as ToolState,
        toolInput: { action: label, document: "warning_letter" },
        toolOutput: `Action "${label}" completed. 3 changes applied. 2 citations verified.`,
        sources: [
          { href: "https://lom.gov.my/act/employment-1955", title: "Employment Act 1955" },
          { href: "https://lom.gov.my/internal/disciplinary-policy", title: "Internal Disciplinary Policy" },
        ],
      },
    ]);
    setTimeout(() => setActiveAction(null), 800);
    toast.success(`AI action queued: ${label}`);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChat((c) => [
      ...c,
      { role: "user", content: chatInput },
      {
        role: "ai",
        content: "Noted. I'll apply the requested change after verifying it against the active authorities.",
        thinking: "Reviewing user request against active authorities before applying changes.",
        sources: [{ href: "https://lom.gov.my/act/employment-1955", title: "Employment Act 1955" }],
      },
    ]);
    setChatInput("");
  };

  const saveDraft = () =>
    toast.success("Draft saved", { description: "Auto-save will resume on the next change." });

  const exportDraft = (format: "PDF" | "DOCX" | "TXT") => {
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warning-letter.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format}`);
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Document Drafting</p>
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              Warning Letter — Lim Wei Jian
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Draft</Badge>
              <InlineCitation>
                <InlineCitationCard>
                  <InlineCitationCardTrigger sources={["https://lom.gov.my/act/employment-1955"]} />
                  <InlineCitationCardBody>
                    <div className="p-3 space-y-2">
                      <InlineCitationSource
                        title="Employment Act 1955 — Section 14"
                        url="https://lom.gov.my/act/employment-1955"
                        description="Governs disciplinary procedures for misconduct in Malaysian employment relationships."
                      />
                      <InlineCitationQuote>
                        The contract of service may be terminated by either party on grounds of misconduct.
                      </InlineCitationQuote>
                    </div>
                  </InlineCitationCardBody>
                </InlineCitationCard>
              </InlineCitation>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="h-9 w-auto text-xs">
                <FileSignature className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRAFT_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={saveDraft}>
              <Save className="size-3.5" /> Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Download className="size-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportDraft("PDF")}>PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDraft("DOCX")}>DOCX</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDraft("TXT")}>TXT</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <LegalDisclaimer compact />

        {/* Workflow plan */}
        <Plan defaultOpen>
          <PlanHeader>
            <div>
              <PlanTitle>Draft workflow</PlanTitle>
              <PlanDescription>Template → AI draft → Review → Citation check → Export</PlanDescription>
            </div>
            <PlanAction><PlanTrigger /></PlanAction>
          </PlanHeader>
          <PlanContent>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {WORKFLOW_STEPS.map((step, i) => (
                <span key={step} className={cn("flex items-center gap-1", i < 3 ? "text-foreground" : "text-muted-foreground")}>
                  {i < 3
                    ? <CheckCheck className="size-3 text-emerald-500" />
                    : <Loader2 className="size-3 opacity-40" />}
                  {step}
                  {i < WORKFLOW_STEPS.length - 1 && <span className="text-muted-foreground/40">›</span>}
                </span>
              ))}
            </div>
          </PlanContent>
        </Plan>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AIMetricCard title="Words" value={wordCount} description="In document" icon={FileText} />
          <AIMetricCard title="Characters" value={body.length} description="Including spaces" icon={FileSignature} />
          <AIMetricCard title="AI actions" value={chat.filter((c) => c.role === "ai").length} description="Applied this session" icon={Sparkles} />
          <AIMetricCard title="Template" value={DRAFT_TEMPLATES.find((t) => t.id === template)?.label ?? "Custom"} description="Selected" icon={FileSignature} />
        </div>

        {/* AI actions bar */}
        <Artifact>
          <ArtifactContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Apply AI to draft:</span>
              <AIChip variant="outline" size="sm" icon={<Wand2 className="size-3" />} label="Quick actions" />
            </div>
            <Suggestions>
              {AI_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Suggestion key={a.id} suggestion={a.label} onClick={() => runAction(a.id, a.label)}>
                    {activeAction === a.id
                      ? <Loader2 className="size-3.5 mr-1 animate-spin" />
                      : <Icon className="size-3.5 mr-1" />}
                    {a.label}
                  </Suggestion>
                );
              })}
            </Suggestions>
          </ArtifactContent>
        </Artifact>

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,360px)]">
          {/* Editor */}
          <Artifact>
            <ArtifactHeader>
              <div className="flex items-center gap-2 text-sm">
                <FileSignature className="size-4 text-primary" />
                <ArtifactTitle>Document editor</ArtifactTitle>
                <Badge variant="secondary" className="text-[10px]">Auto-saved</Badge>
              </div>
              <ArtifactActions>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Wand2 className="size-3.5" /> AI actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Apply to selection</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {AI_ACTIONS.map((a) => {
                      const Icon = a.icon;
                      return (
                        <DropdownMenuItem key={a.id} onClick={() => runAction(a.id, a.label)} className="gap-2">
                          <Icon className="size-3.5" /> {a.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </ArtifactActions>
            </ArtifactHeader>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[420px] lg:min-h-[560px] resize-none bg-transparent p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed text-foreground focus:outline-none"
            />
            <div className="flex items-center gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
              <span>{wordCount} words</span>
              <span>·</span>
              <span>{body.length} characters</span>
              <span className="ml-auto">
                <AIStatusIndicator status="success" label="Saved" size="sm" showPulse={false} />
              </span>
            </div>
          </Artifact>

          {/* AI Assistant */}
          <Artifact className="flex flex-col overflow-hidden">
            <ArtifactHeader>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-primary" />
                <ArtifactTitle>AI Assistant</ArtifactTitle>
              </div>
              <ArtifactActions>
                <Button variant="ghost" size="icon-sm" aria-label="History">
                  <History className="size-4" />
                </Button>
              </ArtifactActions>
            </ArtifactHeader>
            <ScrollArea className="flex-1 min-h-[260px] max-h-[320px] lg:max-h-[500px]">
              <div className="p-3 space-y-4">
                {chat.map((msg, i) => (
                  <Message key={i} from={msg.role === "ai" ? "assistant" : "user"}>
                    {/* Chain-of-thought for AI messages */}
                    {msg.role === "ai" && msg.thinking && (
                      <ChainOfThought defaultOpen={false}>
                        <ChainOfThoughtHeader>Reasoning trace</ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          <ChainOfThoughtStep
                            label="Retrieve authorities"
                            status="complete"
                            description="pgVector semantic search across Malaysian legal corpus"
                          >
                            <ChainOfThoughtSearchResults>
                              <ChainOfThoughtSearchResult>EA 1955 s.14</ChainOfThoughtSearchResult>
                              <ChainOfThoughtSearchResult>Industrial Court</ChainOfThoughtSearchResult>
                            </ChainOfThoughtSearchResults>
                          </ChainOfThoughtStep>
                          <ChainOfThoughtStep
                            label="Apply to draft"
                            status="complete"
                            description={msg.thinking}
                          />
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    )}

                    {/* Reasoning (collapsible thinking) */}
                    {msg.role === "ai" && msg.thinking && (
                      <Reasoning defaultOpen={false}>
                        <ReasoningTrigger />
                        <ReasoningContent>{msg.thinking}</ReasoningContent>
                      </Reasoning>
                    )}

                    {/* Tool call result */}
                    {msg.role === "ai" && msg.toolName && msg.toolState && (
                      <Tool>
                        <ToolHeader
                          type="tool-result"
                          state={msg.toolState}
                          title={msg.toolName}
                        />
                        <ToolContent>
                          {msg.toolInput && <ToolInput input={msg.toolInput} />}
                          {msg.toolOutput && (
                            <ToolOutput output={msg.toolOutput} errorText={undefined} />
                          )}
                        </ToolContent>
                      </Tool>
                    )}

                    <MessageContent>
                      <MessageResponse>{msg.content}</MessageResponse>
                      {msg.role === "ai" && msg.sources && (
                        <Sources>
                          <SourcesTrigger count={msg.sources.length} />
                          <SourcesContent>
                            {msg.sources.map((s) => (
                              <Source key={s.href} href={s.href} title={s.title} />
                            ))}
                          </SourcesContent>
                        </Sources>
                      )}
                      {msg.role === "ai" && (
                        <MessageToolbar>
                          <MessageActions>
                            <MessageAction
                              tooltip="Copy"
                              onClick={() => navigator.clipboard?.writeText(msg.content)}
                            >
                              <Copy className="size-3.5" />
                            </MessageAction>
                            <MessageAction tooltip="Regenerate">
                              <RefreshCw className="size-3.5" />
                            </MessageAction>
                            <MessageAction tooltip="Helpful">
                              <ThumbsUp className="size-3.5" />
                            </MessageAction>
                            <MessageAction tooltip="Not helpful">
                              <ThumbsDown className="size-3.5" />
                            </MessageAction>
                          </MessageActions>
                        </MessageToolbar>
                      )}
                    </MessageContent>
                  </Message>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-3 space-y-2">
              <AIComposer
                value={chatInput}
                onChange={setChatInput}
                onSubmit={sendChat}
                placeholder="Ask the AI to refine, check or translate this draft…"
                showAttachments={false}
                compact
              />
            </div>
          </Artifact>
        </div>
      </div>
    </DashboardShell>
  );
}
