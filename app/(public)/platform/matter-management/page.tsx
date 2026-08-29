import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, FeatureCard, Section } from '@/components/navigation/PageComponents';
import {
  Briefcase, Calendar, Clock, AlertTriangle, Users, FileText,
  Bot, Shield, Activity, TrendingUp, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Matter Management — ${BRAND.name}`,
  description: 'Full matter lifecycle with AI-powered risk scores, deadlines, HITL controls, and intelligent automation.',
};

export default function MatterManagementPage() {
  return (
    <>
      <PageHeader
        title="Matter Management"
        description="Manage your entire matter lifecycle — from intake to closure — with AI-powered risk intelligence, deadline tracking, and human-in-the-loop controls."
        breadcrumbs={[
          { label: 'Platform', href: '/platform' },
          { label: 'Matter Management' },
        ]}
        actions={
          <Button asChild>
            <Link href="/legalai/matters">Open Matter Registry <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="What's Included">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Briefcase className="size-5" />}
            title="Matter Registry"
            description="Searchable registry with risk scores, priority levels, matter types, responsible lawyers, and client relationships."
          />
          <FeatureCard
            icon={<TrendingUp className="size-5" />}
            title="Risk Intelligence"
            description="Evidence-grounded risk scores updated in real-time. Every score links to its underlying evidence — deadlines, obligations, authorities."
          />
          <FeatureCard
            icon={<Calendar className="size-5" />}
            title="Deadline Tracking"
            description="Court deadlines, filing dates, hearing schedules, and internal milestones. Proactive alerts before deadlines approach."
          />
          <FeatureCard
            icon={<Clock className="size-5" />}
            title="Case Timeline"
            description="Chronological event tracking — filings, hearings, communications, decisions. AI-generated timeline summaries."
          />
          <FeatureCard
            icon={<Users className="size-5" />}
            title="Responsible Lawyers"
            description="Assign lawyers, track utilization, monitor matter distribution, and manage team workload across the firm."
          />
          <FeatureCard
            icon={<FileText className="size-5" />}
            title="Document Management"
            description="Version-controlled documents with court metadata, jurisdiction tracking, and AI-powered classification."
          />
          <FeatureCard
            icon={<Bot className="size-5" />}
            title="AI Insights"
            description="Automated analysis of matter patterns, risk trends, and strategic recommendations grounded in evidence."
          />
          <FeatureCard
            icon={<Shield className="size-5" />}
            title="HITL Controls"
            description="Authorization levels ensure no high-impact action is taken without explicit human approval. Full audit trail."
          />
          <FeatureCard
            icon={<Activity className="size-5" />}
            title="Activity Feed"
            description="Real-time activity stream showing agent actions, lawyer updates, deadline changes, and risk score movements."
          />
        </div>
      </Section>

      <Section title="Matter Lifecycle">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <div className="grid gap-4 md:grid-cols-6">
            {[
              { step: '1', title: 'Intake', desc: 'Client onboarding, conflict check, matter creation' },
              { step: '2', title: 'Assignment', desc: 'Lawyer assignment, team allocation, role setup' },
              { step: '3', title: 'Active Work', desc: 'Research, drafting, filings, communications' },
              { step: '4', title: 'AI Analysis', desc: 'Risk scoring, timeline generation, insights' },
              { step: '5', title: 'Human Review', desc: 'HITL approval, evidence verification, judgment' },
              { step: '6', title: 'Resolution', desc: 'Closure, audit trail, knowledge capture' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {item.step}
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">See it in action</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Experience the full matter management workflow with AI-powered risk intelligence and human oversight.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/legalai/matters">Open Matter Registry</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform">Back to Platform</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
