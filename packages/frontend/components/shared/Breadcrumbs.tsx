"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const LABEL_MAP: Record<string, string> = {
  legalai: "Workspace",
  assistant: "AI Assistant",
  agent: "AI Copilot",
  research: "Legal Research",
  search: "Universal Search",
  documents: "Documents",
  drafting: "Document Drafting",
  draft: "Drafting Studio",
  contracts: "Contracts",
  analysis: "Document Analysis",
  docs: "Documentation",
  matters: "Matters",
  clients: "Clients",
  tasks: "Tasks",
  risk: "Risk Engine",
  monitor: "Change Monitor",
  analytics: "Executive Analytics",
  debate: "Debate Simulation",
  hitl: "Agent Control",
  governance: "AI Governance",
  compliance: "Compliance",
  audit: "Audit Trail",
  billing: "Billing Intelligence",
  notifications: "Notifications",
  settings: "Settings",
  saved: "Saved Items",
  history: "Activity History",
  insights: "Insights & Timeline",
  profile: "Profile",
  security: "Security",
  ai: "AI Settings",
  byok: "AI Providers",
  appearance: "Appearance",
  integrations: "Integrations",
  organization: "Organisation",
  users: "Users",
  roles: "Roles & Permissions",
  models: "Models",
  usage: "Usage",
};

function humanize(segment: string): string {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment];
  if (segment.match(/^[a-f0-9-]{20,}$/i)) return "Details";
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface AppBreadcrumbsProps {
  className?: string;
  items?: Array<{ label: string; href?: string }>;
  showHome?: boolean;
}

export function AppBreadcrumbs({ className, items, showHome = true }: AppBreadcrumbsProps) {
  const pathname = usePathname();

  const crumbs = items ?? buildCrumbsFromPath(pathname, showHome);

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !c.href ? (
                  <BreadcrumbPage className="truncate max-w-[200px] sm:max-w-none">
                    {c.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href} className="truncate max-w-[160px] sm:max-w-none">
                      {c.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function buildCrumbsFromPath(pathname: string, showHome: boolean) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; href?: string }> = [];

  if (showHome) {
    crumbs.push({
      label: "Home",
      href: "/lawmate",
    });
  }

  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    acc += "/" + seg;
    const isLast = i === segments.length - 1;
    const label = humanize(seg);
    crumbs.push({
      label,
      href: isLast ? undefined : acc,
    });
  }

  return crumbs;
}
