import { Navbar } from "@/components/landing/marketing/Navbar";
import { Hero } from "@/components/landing/marketing/Hero";
import { TrustBar } from "@/components/landing/marketing/TrustBar";
import { FeatureBento } from "@/components/landing/marketing/FeatureBento";
import { AgentSwarm } from "@/components/landing/marketing/AgentSwarm";
import { ProductPathways } from "@/components/landing/marketing/ProductPathways";
import { ProductDashboard } from "@/components/landing/marketing/ProductDashboard";
import { DraftingStudioPreview } from "@/components/landing/marketing/DraftingStudioPreview";
import { RegulatoryTimeline } from "@/components/landing/marketing/RegulatoryTimeline";
import { Security } from "@/components/landing/marketing/Security";
import { Workflow } from "@/components/landing/marketing/Workflow";
import { FinalCTA } from "@/components/landing/marketing/FinalCTA";
import { SiteFooter } from "@/components/landing/marketing/SiteFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <FeatureBento />
        <AgentSwarm />
        <ProductPathways />
        <ProductDashboard />
        <DraftingStudioPreview />
        <RegulatoryTimeline />
        <Security />
        <Workflow />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
