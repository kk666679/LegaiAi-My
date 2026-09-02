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
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { AIMetricCard } from "@/components/ai/aimetric-card";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactActions,
  ArtifactContent,
} from "@/components/ai-elements/artifact";

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

export default function DraftingPage() {
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

  const runAction = (label: string) => {
    setChat((c) => [
      ...c,
      { role: "user", content: label },
      { role: "ai", content: `Applied: ${label}. Streaming changes into the editor and citing relevant statutes.` },
    ]);
    toast.success(`AI action queued: ${label}`);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChat((c) => [
      ...c,
      { role: "user", content: chatInput },
      { role: "ai", content: "Noted. I'll apply the requested change after verifying it against the active authorities." },
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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Document Drafting</p>
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              Warning Letter — Lim Wei Jian
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Draft</Badge>
              Last edited 1d ago
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
            <Button size="sm" className="gap-1.5" onClick={() => exportDraft("PDF")}>
              <Download className="size-3.5" /> Export
            </Button>
          </div>
        </div>

        <LegalDisclaimer compact />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AIMetricCard title="Words" value={body.split(/\s+/).filter(Boolean).length} description="In document" icon={FileText} />
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
                  <Suggestion key={a.id} suggestion={a.label} onClick={() => runAction(a.label)}>
                    <Icon className="size-3.5 mr-1" />
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
                        <DropdownMenuItem key={a.id} onClick={() => runAction(a.label)} className="gap-2">
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
              <span>{body.split(/\s+/).filter(Boolean).length} words</span>
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
            <ScrollArea className="flex-1 min-h-[260px] max-h-[320px] lg:max-h-[420px]">
              <div className="p-3 space-y-3">
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-md p-3 text-sm leading-relaxed",
                      msg.role === "user" ? "ml-auto max-w-[90%] bg-primary/10" : "bg-muted/40",
                    )}
                  >
                    {msg.content}
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
          </Artifact>
        </div>
      </div>
    </DashboardShell>
  );
}
