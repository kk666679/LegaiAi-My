"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { FileText, Menu } from "lucide-react";
import { DocumentsSidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function DocumentsLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  React.useEffect(() => setMobileNavOpen(false), [pathname]);

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 md:block">
        <DocumentsSidebar />
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open document navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Document navigation</SheetTitle>
              <DocumentsSidebar />
            </SheetContent>
          </Sheet>
          <FileText className="size-4 text-primary" />
          <span className="text-sm font-medium">Documents</span>
        </div>
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
