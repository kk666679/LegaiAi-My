"use client";

import { useState } from "react";
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
  GitCompare,
  Gavel,
  Loader2,
  CheckCheck,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { AIComposer } from "@/components/lawmate/AIComposer";
import { DRAFT_TEMPLATES, MALAYSIAN_SOURCES } from "@/lib/lawmate/data";
import { cn } from "@/lib/utils";
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
  { id: "compare", label: "Compare to template", icon: GitCompare },
];

const QUALITY_SCORES = {
  overall: 82,
  completeness: 88,
  citationCoverage: 76,
  citationValidity: 94,
  clarity: 81,
  evidenceGrounding: 79,
  consistency: 85,
  structure: 86,
};

const EVIDENCE = MALAYSIAN_SOURCES.slice(0, 4).map((s, i) => ({
  ...s,
  relevance: 0.95 - i * 0.08,
  confidence: 0.92 - i * 0.05,
  verified: s.verified ?? true,
  snippet: s.excerpt,
}));

const VERSIONS = [
  { id: "v-1", label: "Current draft", date: "Just now", author: "Aisyah Rahman", ai: false },
  { id: "v-2", label: "AI improved wording", date: "5m ago", author: "AI (Llama 3.1)", ai: true },
  { id: "v-3", label: "Initial draft", date: "2h ago", author: "Aisyah Rahman", ai: false },
  { id: "v-4", label: "Template: warning_letter", date: "2h ago", author: "system", ai: false },
];

export default function DraftStudioPage() {
  const [template, setTemplate] = useState<string>("warning_letter");
  const [body, setBody] = useState(DRAFT_BODY);
  const [chat, setChat] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content:
        "I've prepared a draft warning letter. Review it and let me know if you'd like me to make it more legally cautious, identify risks, or improve wording.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [selectedTab, setSelectedTab] = useState("editor");
  const [citationInput, setCitationInput] = useState("");

  const wordCount = body.split(/\s+/).filter(Boolean).length;

  const runAction = (label: string) => {
    setSaveStatus("saving");
    setChat((c) => [
      ...c,
      { role: "user", content: label },
      {
        role: "ai",
        content: `Applied: ${label}. Changes are streaming into the editor with citation-backed justifications.`,
      },
    ]);
    setTimeout(() => setSaveStatus("saved"), 800);
    toast.success(`AI action queued: ${label}`);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChat((c) => [
      ...c,
      { role: "user", content: chatInput },
      {
        role: "ai",
        content:
          "Noted. I'll apply the suggested change after verifying it against the active authorities.",
      },
    ]);
    setChatInput("");
  };

  const saveDraft = () => {
    setSaveStatus("saving");
    setTimeout(() => setSaveStatus("saved"), 400);
    toast.success("Draft saved");
  };
  const exportDraft = (format: "PDF" | "DOCX" | "TXT") => {
    const ext = format.toLowerCase();
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warning-letter.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format}`);
  };
  const showHistory = () => {
    setSelectedTab("history");
    toast.info("Showing version history");
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    setSaveStatus("unsaved");
    setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => setSaveStatus("saved"), 600);
    }, 800);
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Document Drafting</p>
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              Warning Letter — Lim Wei Jian
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">Draft</Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                {saveStatus === "saving" && <Loader2 className="size-3 animate-spin" />}
                {saveStatus === "saved" && <CheckCheck className="size-3 text-emerald-500" />}
                {saveStatus === "unsaved" && <AlertTriangle className="size-3 text-amber-500" />}
                {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "All changes saved" : "Unsaved changes"}
              </Badge>
              <span>· {wordCount} words</span>
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
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={showHistory}>
              <History className="size-3.5" /> History
            </Button>
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

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Apply AI to draft:
              </span>
              {AI_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Button
                    key={a.id}
                    variant="outline"
                    size="sm"
                    onClick={() => runAction(a.label)}
                    className="gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Icon className="size-3.5" /> {a.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="citations">Citations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-3">
            <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,360px)]">
              <Card>
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileSignature className="size-4 text-primary" />
                    <span className="font-medium">Document editor</span>
                  </div>
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
                          <DropdownMenuItem
                            key={a.id}
                            onClick={() => runAction(a.label)}
                            className="gap-2"
                          >
                            <Icon className="size-3.5" /> {a.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  className="w-full min-h-[420px] lg:min-h-[560px] resize-none bg-transparent p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed text-foreground focus:outline-none"
                />
                <div className="flex items-center gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>·</span>
                  <span>{body.length} characters</span>
                  <span className="ml-auto inline-flex items-center gap-1">
                    {saveStatus === "saving" ? (
                      <><Loader2 className="size-3 animate-spin" /> Saving…</>
                    ) : saveStatus === "saved" ? (
                      <><CheckCircle2 className="size-3 text-emerald-500" /> Saved</>
                    ) : (
                      <><AlertTriangle className="size-3 text-amber-500" /> Unsaved</>
                    )}
                  </span>
                </div>
              </Card>

              <Card className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="size-4 text-primary" />
                    <span className="font-medium">AI Assistant</span>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-[260px] max-h-[320px] lg:max-h-[420px]">
                  <div className="p-3 space-y-3">
                    {chat.map((m, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-md p-3 text-sm leading-relaxed",
                          m.role === "user"
                            ? "ml-auto max-w-[90%] bg-primary/10"
                            : "bg-muted/40",
                        )}
                      >
                        {m.content}
                      </div>
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
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supporting evidence</CardTitle>
                <CardDescription>Authoritative sources relevant to this draft.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {EVIDENCE.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border bg-card/30 p-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Gavel className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{e.title}</p>
                        <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
                        {e.section && <Badge variant="secondary" className="text-[10px]">{e.section}</Badge>}
                        {e.verified && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-500">
                            <CheckCircle2 className="size-3" /> Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.snippet}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Relevance {(e.relevance * 100).toFixed(0)}%</span>
                        <span>Confidence {(e.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            setBody((b) => `${b}\n\n${e.title}${e.section ? ` — ${e.section}` : ''}: ${e.snippet ?? ""}`);
                            toast.success(`Inserted reference: ${e.title}`);
                          }}
                        >
                          Insert
                        </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Draft quality</CardTitle>
                <CardDescription>Multi-dimensional quality assessment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall</span>
                    <span className="text-2xl font-semibold tracking-tight">{QUALITY_SCORES.overall}<span className="text-sm text-muted-foreground">/100</span></span>
                  </div>
                  <Progress value={QUALITY_SCORES.overall} className="h-2" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(QUALITY_SCORES).filter(([k]) => k !== "overall").map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                      <Progress value={value} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="citations" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Citations</CardTitle>
                <CardDescription>Insert and validate citations from LOM.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <input
                    value={citationInput}
                    onChange={(e) => setCitationInput(e.target.value)}
                    placeholder="Search LOM: Act, case, section…"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {citationInput && (
                  <div className="space-y-1 rounded-md border bg-card/30 p-2">
                    {MALAYSIAN_SOURCES.filter((s) =>
                      s.title.toLowerCase().includes(citationInput.toLowerCase()) ||
                      s.section?.toLowerCase().includes(citationInput.toLowerCase())
                    ).slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCitationInput("");
                        }}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent/40 transition-colors"
                      >
                        <Gavel className="size-3.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{s.section} · {s.area}</p>
                        </div>
                        <Plus className="size-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {MALAYSIAN_SOURCES.slice(0, 2).map((s) => (
                    <div key={s.id} className="flex items-start gap-3 rounded-md border bg-card/30 p-3">
                      <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.title} {s.section && `— ${s.section}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.excerpt}</p>
                      </div>
<Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remove"
                            onClick={() => toast.message("Citation removed")}
                          >
                            <X className="size-3" />
                          </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Version history</CardTitle>
                <CardDescription>Restore previous versions or compare.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {VERSIONS.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-md border bg-card/30 p-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <History className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{v.label}</p>
                        {v.ai && <Badge variant="outline" className="text-[10px]">AI</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{v.author} · {v.date}</p>
                    </div>
<Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info(`Comparing with "${v.label}"`)}
                      >
                        Compare
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success(`Restored "${v.label}"`)}
                      >
                        Restore
                      </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
