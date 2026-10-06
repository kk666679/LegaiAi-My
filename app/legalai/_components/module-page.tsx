import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ModuleStat {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}

export interface ModuleSection {
  title: string;
  description?: string;
  action?: ReactNode;
  content: ReactNode;
}

export interface ModulePageProps {
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: ModuleStat[];
  sections: ModuleSection[];
}

export function ModulePage({
  title,
  description,
  actions,
  stats,
  sections,
}: ModulePageProps) {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader title={title} description={description} actions={actions} />

        {stats && stats.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border/70">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Badge
                      variant={
                        stat.tone === "success"
                          ? "secondary"
                          : stat.tone === "warning"
                            ? "outline"
                            : stat.tone === "danger"
                              ? "destructive"
                              : "default"
                      }
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-[0.14em]",
                        stat.tone === "warning" && "border-amber-500/40 text-amber-600",
                        stat.tone === "danger" && "border-red-500/40 text-red-600",
                      )}
                    >
                      {stat.tone ?? "default"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                  {stat.hint ? (
                    <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title} className="border-border/70 bg-card/80">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  {section.description ? (
                    <CardDescription className="mt-1 text-xs">
                      {section.description}
                    </CardDescription>
                  ) : null}
                </div>
                {section.action ?? (
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    Open <ArrowUpRight className="size-3.5" />
                  </div>
                )}
              </CardHeader>
              <CardContent>{section.content}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
