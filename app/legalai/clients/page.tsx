"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ArrowRight,
  MoreHorizontal,
  Globe,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_MATTERS } from "@/lib/lawmate/data";
import { relativeTime } from "@/lib/lawmate/utils";

interface Client {
  id: string;
  name: string;
  type: "individual" | "corporate";
  email: string;
  phone: string;
  industry?: string;
  mattersCount: number;
  activeMatters: number;
  joinedAt: string;
  status: "active" | "inactive" | "prospect";
}

const MOCK_CLIENTS: Client[] = [
  {
    id: "c-1",
    name: "TechNova Sdn Bhd",
    type: "corporate",
    email: "legal@technova.my",
    phone: "+60 3-2168 5000",
    industry: "Technology",
    mattersCount: 3,
    activeMatters: 1,
    joinedAt: "2024-03-15",
    status: "active",
  },
  {
    id: "c-2",
    name: "GreenHostel Malaysia",
    type: "corporate",
    email: "admin@greenhostel.my",
    phone: "+60 3-2273 1000",
    industry: "Property",
    mattersCount: 1,
    activeMatters: 1,
    joinedAt: "2024-08-22",
    status: "active",
  },
  {
    id: "c-3",
    name: "DataShield Technologies",
    type: "corporate",
    email: "privacy@datashield.io",
    phone: "+60 3-2287 3000",
    industry: "Technology",
    mattersCount: 2,
    activeMatters: 1,
    joinedAt: "2023-11-10",
    status: "active",
  },
  {
    id: "c-4",
    name: "Valley Foods Group",
    type: "corporate",
    email: "corp@valleyfoods.com",
    phone: "+60 3-5634 8000",
    industry: "F&B",
    mattersCount: 1,
    activeMatters: 0,
    joinedAt: "2025-06-01",
    status: "active",
  },
  {
    id: "c-5",
    name: "BumiWage Sdn Bhd",
    type: "corporate",
    email: "hr@bumiwage.my",
    phone: "+60 3-7728 2000",
    industry: "HR Services",
    mattersCount: 1,
    activeMatters: 0,
    joinedAt: "2024-01-20",
    status: "inactive",
  },
  {
    id: "c-6",
    name: "Lim Wei Jian",
    type: "individual",
    email: "lim.weijian@example.my",
    phone: "+60 12-345 6789",
    mattersCount: 1,
    activeMatters: 1,
    joinedAt: "2026-01-15",
    status: "active",
  },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "corporate" | "individual">("all");

  const filtered = MOCK_CLIENTS.filter((c) => {
    if (filter !== "all" && c.type !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clients & Parties</h1>
            <p className="text-sm text-muted-foreground">
              Manage client relationships and contacts.
            </p>
          </div>
          <Button
            className="gap-2 self-start md:self-auto"
            onClick={() =>
              toast.info("Add-client form opens", {
                description: "Capture name, contact, type (corporate / individual) and industry.",
              })
            }
          >
            <Plus className="size-4" /> Add client
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Total clients" value={MOCK_CLIENTS.length} icon={Users} accent="bg-primary/10 text-primary" />
          <StatTile label="Corporate" value={MOCK_CLIENTS.filter(c => c.type === "corporate").length} icon={Building2} accent="bg-blue-500/10 text-blue-500" />
          <StatTile label="Individual" value={MOCK_CLIENTS.filter(c => c.type === "individual").length} icon={Users} accent="bg-emerald-500/10 text-emerald-500" />
          <StatTile label="Active matters" value={MOCK_CLIENTS.reduce((a, c) => a + c.activeMatters, 0)} icon={Briefcase} accent="bg-amber-500/10 text-amber-500" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                {(["all", "corporate", "individual"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                      filter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="size-8 text-muted-foreground opacity-40 mb-3" />
                <p className="font-medium">No clients found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first client to start tracking matters and contacts.
                </p>
<Button
            className="mt-4 gap-2"
            onClick={() =>
              toast.info("Add-client form opens", {
                description: "Capture name, contact, type (corporate / individual) and industry.",
              })
            }
          >
            <Plus className="size-4" /> Add client
          </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/30 transition-colors"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{c.name}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {c.type}
                        </Badge>
                        {c.industry && (
                          <Badge variant="secondary" className="text-[10px]">
                            {c.industry}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" /> {c.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" /> {c.phone}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{c.activeMatters} active</span>
                      <span>{c.mattersCount} total</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/legalai/matters" className="gap-2">
                            <Briefcase className="size-3.5" /> View matters
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.message(`Drafting message to ${c.name}`, {
                              description: `${c.email} · ${c.phone}`,
                            })
                          }
                          className="gap-2"
                        >
                          <Mail className="size-3.5" /> Send message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.success(`Creating new matter for ${c.name}`, {
                              description: "Matter-creation dialog will open.",
                            })
                          }
                          className="gap-2"
                        >
                          <Plus className="size-3.5" /> New matter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon-sm" asChild aria-label="View">
                      <Link href="/legalai/matters">
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function StatTile({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md p-2 ${accent}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
