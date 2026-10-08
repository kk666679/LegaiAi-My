import Link from "next/link";
import { FileText, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "../_components/module-page";

const stats: ModuleStat[] = [
  { label: "Drafts in process", value: "12", hint: "Across matters", tone: "default" },
  { label: "Citation validation", value: "96%", hint: "Recent accuracy", tone: "success" },
  { label: "Awaiting approval", value: "4", hint: "Human review queue", tone: "warning" },
  { label: "AI-generated", value: "26", hint: "This quarter", tone: "default" },
];

export default function DraftPage() {
  return (
    <ModulePage
      title="Document Drafting"
      description="Create, review, and validate draft legal documents with AI-supported workflow controls."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/lawmate/matters/new" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Create draft</Link>
          <Link href="/lawmate/documents" className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium">Open document library</Link>
        </div>
      }
      stats={stats}
      sections={[
        {
          title: "Draft workflow",
          description: "From template selection to approval and export",
          content: (
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[["Select template", "Statement of claim, defence, contract, memo"], ["Generate draft", "AI populates core sections using matter context"], ["Validate citations", "Check references and legal authority"], ["Submit for approval", "Flag for human review before export"]].map(([label, detail]) => (
                <li key={label} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <Sparkles className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="mt-1 text-xs">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ),
        },
        {
          title: "Recent drafts",
          description: "Current work in progress",
          content: (
            <div className="space-y-3">
              {[["Share sale agreement", "Awaiting partner review"], ["Employment dispute memorandum", "Validated citations"], ["Construction claim bundle", "Draft ready for export"]].map(([title, detail]) => (
                <div key={title} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
