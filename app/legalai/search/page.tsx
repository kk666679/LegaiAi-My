import { Database, FileSearch, Search } from "lucide-react";
import { ModulePage, type ModuleStat } from "../_components/module-page";

const stats: ModuleStat[] = [
  { label: "Indexed sources", value: "3.2k", hint: "Cases, statutes, and templates", tone: "default" },
  { label: "Matches today", value: "124", hint: "Across practice areas", tone: "success" },
  { label: "Saved searches", value: "18", hint: "Active alerts", tone: "warning" },
  { label: "Precision score", value: "94%", hint: "Model confidence", tone: "default" },
];

export default function SearchPage() {
  return (
    <ModulePage
      title="Universal Search"
      description="Search legal knowledge, documents, matters, and prior work in one place."
      stats={stats}
      sections={[
        {
          title: "Search summary",
          description: "Most relevant sources across the workspace",
          content: (
            <div className="space-y-3">
              {[
                ["Employment law", "High relevance · 12 matches"],
                ["PDPA obligations", "3 recent documents and 2 prior memos"],
                ["Contract drafting", "Template references and precedent language"],
              ].map(([label, note]) => (
                <div key={label} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <Search className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Recent results",
          description: "Latest high-signal matches",
          content: (
            <div className="space-y-3">
              {[
                ["Company directors duties", "Case law + statute"],
                ["Drafting considerations for shareholder agreements", "Templates and precedents"],
                ["Cross-border data transfer compliance", "Regulatory references"],
              ].map(([label, note]) => (
                <div key={label} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <FileSearch className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Knowledge sources",
          description: "Coverage and freshness",
          content: (
            <div className="space-y-3">
              {[
                ["Local case law", "Updated within 24 hours"],
                ["Legislation index", "Linked to active practice groups"],
                ["Internal templates", "Available to current workspace"],
              ].map(([label, note]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-primary" />
                    <p className="text-sm font-medium">{label}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{note}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
