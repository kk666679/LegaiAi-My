"use client";

import type { ReactNode } from "react";
import { DocumentsNav } from "./DocumentsNav";
import { cn } from "@/lib/utils";

/** Shared section composition for every Documents route. */
export function DocumentsShell({
  children,
  header,
  className,
  showNavigation = true,
}: {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  showNavigation?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      {header}
      {showNavigation ? <DocumentsNav /> : null}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export default DocumentsShell;
