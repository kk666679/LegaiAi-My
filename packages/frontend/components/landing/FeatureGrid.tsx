import { SectionHeading } from "@/components/shared/section-heading";
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card";
import {
  Scale,
  FileText,
  Clock,
  Shield,
  BrainCircuit,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Regulatory Timeline",
    description: "Stay ahead of changes across ESG, cyber, AI & more.",
  },
  {
    icon: BrainCircuit,
    title: "AI Agents",
    description: "Autonomous research, drafting, and compliance checks.",
  },
  {
    icon: FileText,
    title: "Document Gen",
    description: "Generate contracts, briefs, and memos in seconds.",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Live amendments and regulatory alerts.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "End-to-end encryption with on-prem options.",
  },
  {
    icon: Globe,
    title: "Multi-jurisdiction",
    description: "Coverage for Malaysian, UK, and EU law.",
  },
];

export function FeatureGrid() {
  return (
    <section className="container-responsive py-24">
      <SectionHeading
        title="Everything a modern legal team needs"
        subtitle="Powered by specialised AI agents that understand the law."
      />

      <div className="responsive-grid mt-16">
        {features.map(({ icon: Icon, title, description }) => (
          <GlassmorphicCard
            key={title}
            className="space-y-4 p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Icon className="h-5 w-5 text-blue-400" />
            </div>

            <h3 className="text-lg font-semibold">
              {title}
            </h3>

            <p className="text-sm text-slate-400">
              {description}
            </p>
          </GlassmorphicCard>
        ))}
      </div>
    </section>
  );
}