import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AIOrbProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function AIOrb({ label, className, ...props }: AIOrbProps) {
  return (
    <div
      className={cn(
        "relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/15 to-cyan-400/10 text-center shadow-lg shadow-slate-900/20 ring-1 ring-white/10",
        className
      )}
      {...props}
    >
      <span className="relative z-10 px-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-100">
        {label}
      </span>
      <div className="pointer-events-none absolute inset-0 rounded-full bg-white/5" />
    </div>
  );
}
