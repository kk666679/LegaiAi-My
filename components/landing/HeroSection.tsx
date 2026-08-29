import { ShimmerHero } from "./ShimmerHero";
import { GradientText } from "@/components/shared/gradient-text";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <ShimmerHero>
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight">
            <GradientText>Legal AI</GradientText> that works
            <br />
            for the real world
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            From compliance timelines to automated drafting, our agent swarm
            handles the heavy lifting – leaving lawyers to focus on strategy.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="glass-button text-white px-8 py-6 text-lg">
              Request early access
            </Button>
            <Button size="lg" variant="ghost" className="border border-white/20">
              Watch demo
            </Button>
          </div>
        </div>
      </section>
    </ShimmerHero>
  );
}