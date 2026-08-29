"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, Users, FileSignature, BookOpen, Bell } from "lucide-react";

const ALL_RESULTS = [
  { type: "MATTER", icon: Briefcase, title: "Tan Ah Kow v. ABC Sdn Bhd", sub: "MY-2026-001 · Litigation · Active", href: "/legalai/matters" },
  { type: "CLIENT", icon: Users, title: "XYZ Corporation Bhd", sub: "Corporate · 1 active matter", href: "/legalai/clients" },
  { type: "CONTRACT", icon: FileSignature, title: "Lee & Partners — Commercial Lease", sub: "MY-2026-003 · Negotiation", href: "/legalai/contracts" },
  { type: "AUTHORITY", icon: BookOpen, title: "Contracts Act 1950 (Act 136)", sub: "Statute · Malaysian law", href: "/legalai/research" },
  { type: "ALERT", icon: Bell, title: "SC Malaysia filing deadline — 8 days", sub: "Critical · MY-2026-004", href: "/legalai/risk" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const filtered = query.trim() ? ALL_RESULTS.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.sub.toLowerCase().includes(query.toLowerCase())) : ALL_RESULTS;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1"><Search className="size-6" /> Universal Search</h1>
        <p className="text-sm text-muted-foreground">Search across matters, clients, contracts, authorities, alerts, and more</p>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Try: "contracts with renewal clauses" or "Mega Holdings"' className="pl-12 h-12 text-base" autoFocus />
      </div>
      <div className="space-y-2">
        {filtered.map((r, i) => (
          <Card key={i} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30">
            <CardContent className="p-4 flex items-center gap-3">
              <r.icon className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.sub}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">{r.type}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
