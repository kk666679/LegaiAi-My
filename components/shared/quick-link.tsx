import Link from "next/link";
import type { ComponentType } from "react";

interface QuickLinkProps {
  href: string;
  label: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
}

export function QuickLink({ href, label, desc, icon: Icon }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md border bg-card/30 p-3 hover:border-primary/30 hover:bg-accent/30 transition-colors"
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
