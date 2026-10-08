import type { ComponentType } from "react";

interface HintCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

export function HintCard({ icon: Icon, title, desc }: HintCardProps) {
  return (
    <div className="rounded-md border bg-card/50 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-3.5 text-primary" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}
