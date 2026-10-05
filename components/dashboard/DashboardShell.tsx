"use client";

import { ReactNode, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarWithCollapse,
} from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/lawmate/TopBar";
import { MobileBottomNav } from "@/components/lawmate/MobileBottomNav";
import { AppBreadcrumbs } from "@/components/shared/Breadcrumbs";

interface DashboardShellProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  fullBleed?: boolean;
}

export function DashboardShell({
  children,
  showBreadcrumbs = true,
  fullBleed = false,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <SidebarWithCollapse />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-72 max-w-[85vw] p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenu={() => setMobileOpen(true)} />
          {showBreadcrumbs && (
            <div className="border-b bg-card/20 px-3 py-1.5 sm:px-4">
              <AppBreadcrumbs />
            </div>
          )}
          <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0">
            <div
              className={
                fullBleed
                  ? "min-w-0"
                  : "mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
              }
            >
              {children}
            </div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </TooltipProvider>
  );
}