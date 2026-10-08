import { AlertTriangle } from "lucide-react";

export function LegalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        LawMate provides AI-assisted legal information and drafting support. Verify
        important legal conclusions against current authoritative sources and
        seek qualified legal advice where appropriate.
      </p>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-muted-foreground leading-relaxed">
        <strong className="text-foreground">AI assistance, not legal advice.</strong>{" "}
        LawMate provides AI-assisted legal information and drafting support.
        Verify important legal conclusions against current authoritative sources
        and seek qualified legal advice where appropriate.
      </p>
    </div>
  );
}