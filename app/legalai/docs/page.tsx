"use client";

import Link from "next/link";
import {
  Library,
  BookOpen,
  Sparkles,
  Bot,
  FileSignature,
  Briefcase,
  Shield,
  GitBranch,
  ArrowRight,
  Search,
  Keyboard,
  Command,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";

const SECTIONS = [
  {
    title: "Getting started",
    icon: Sparkles,
    items: [
      { title: "Quick start guide", desc: "Set up your LawMate workspace in 5 minutes.", href: "/legalai", tag: "5 min" },
      { title: "Workspace overview", desc: "Navigate the dashboard, sidebar and command palette.", href: "/legalai", tag: "3 min" },
      { title: "Your first matter", desc: "Create and configure a legal matter.", href: "/legalai/matters", tag: "5 min" },
    ],
  },
  {
    title: "AI Features",
    icon: Bot,
    items: [
      { title: "AI Assistant", desc: "Conversational legal research with citations.", href: "/legalai/assistant", tag: "AI" },
      { title: "Document drafting", desc: "Generate legal documents with AI assistance.", href: "/legalai/drafting", tag: "AI" },
      { title: "AI Copilot (agent)", desc: "Autonomous multi-step legal workflows.", href: "/legalai/agent", tag: "AI" },
      { title: "Citation validation", desc: "Verify legal citations against authoritative sources.", href: "/legalai/research", tag: "AI" },
    ],
  },
  {
    title: "Workflows",
    icon: FileSignature,
    items: [
      { title: "Document drafting workflow", desc: "From template to AI-assisted draft to finalised document.", href: "/legalai/drafting", tag: "Guide" },
      { title: "Legal research workflow", desc: "Search, evaluate and save legal sources.", href: "/legalai/research", tag: "Guide" },
      { title: "Matter management", desc: "Organise documents, research and tasks by matter.", href: "/legalai/matters", tag: "Guide" },
    ],
  },
  {
    title: "Governance & security",
    icon: Shield,
    items: [
      { title: "AI governance controls", desc: "Encryption, audit logging, RBAC and human review.", href: "/legalai/governance", tag: "Admin" },
      { title: "BYOK & providers", desc: "Configure your own AI provider keys.", href: "/legalai/settings/byok", tag: "Admin" },
      { title: "Audit trail", desc: "View all security-sensitive operations.", href: "/legalai/audit", tag: "Admin" },
    ],
  },
  {
    title: "Keyboard shortcuts",
    icon: Keyboard,
    items: [
      { title: "Command palette", desc: "Open search and commands.", keys: ["⌘", "K"] },
      { title: "Quick search", desc: "Focus global search.", keys: ["/"] },
      { title: "Toggle sidebar", desc: "Collapse or expand the sidebar.", keys: ["⌘", "B"] },
      { title: "New conversation", desc: "Start a new AI conversation.", keys: ["⌘", "N"] },
    ],
  },
];

export default function DocsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Library className="size-5 text-primary" />
            Documentation
          </h1>
          <p className="text-sm text-muted-foreground">
            Guides, references and tutorials for LawMate.
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation…"
                className="pl-10 h-10 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  {section.title}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.title}
                      href={"href" in item ? item.href : "/legalai"}
                      className="group flex flex-col rounded-md border bg-card/30 p-4 hover:border-primary/30 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        {"tag" in item && item.tag && (
                          <Badge variant="outline" className="text-[10px] shrink-0">{item.tag}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex-1">
                        {"desc" in item ? item.desc : ""}
                      </p>
                      {"keys" in item && item.keys ? (
                        <div className="mt-3 flex items-center gap-1">
                          {item.keys.map((k, i) => (
                            <Kbd key={i}>{k}</Kbd>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          Read more <ArrowRight className="size-3" />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
