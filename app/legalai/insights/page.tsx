'use client';

import { ClipboardList, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentCard } from '@/components/legalai/shared/agent-card';
import LegalTimeline from '@/components/legalai/LegalTimeline/LegalTimeline';

export default function InsightsPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Legal Insights &amp; Timeline
                </h1>
                <p className="text-sm text-muted-foreground">
                  Regulatory developments, legislative amendments, and legal
                  landscape changes across Malaysia
                </p>
              </div>
            </div>
            <Badge className="rounded-full px-3 py-1">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Live Feed
            </Badge>
          </div>

          {/* Agent Card */}
          <AgentCard
            name="Legal Monitor"
            model="Regulatory Intelligence"
            jurisdiction="Malaysia"
            tools={['legal_monitor', 'citation_verify', 'trend_analysis']}
          />

          {/* Timeline */}
          <Card className="mt-6 border shadow-sm">
            <div className="p-5">
              <LegalTimeline />
            </div>
          </Card>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden w-[340px] border-l bg-background xl:block">
        <div className="sticky top-0 p-5">
          <Card className="border shadow-sm">
            <div className="space-y-5 p-5">
              <div>
                <h3 className="font-semibold">Monitoring Coverage</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Active legislative tracking across key practice areas.
                </p>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { area: 'ESG & Sustainability', count: 1 },
                  { area: 'Digital Assets', count: 2 },
                  { area: 'AI Regulation', count: 1 },
                  { area: 'Human Rights', count: 2 },
                  { area: 'Cyber Security', count: 1 },
                  { area: 'Estate & Probate', count: 1 },
                  { area: 'Arbitration', count: 1 },
                ].map((item) => (
                  <div
                    key={item.area}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span>{item.area}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs leading-6 text-muted-foreground">
                  Events are sourced from official Malaysian gazettes, court
                  bulletins, and regulatory publications. AI-powered analysis
                  identifies material changes affecting active matters.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
