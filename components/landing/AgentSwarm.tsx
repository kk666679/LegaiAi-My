"use client";

import { AIOrb } from "@/components/legalai/AIOrb";
import { SectionHeading } from "@/components/shared/section-heading";
import { motion } from "framer-motion";

const agents = [
  "Legal Research",
  "Compliance Check",
  "Doc Drafter",
  "Timeline Analyst",
];

export function AgentSwarm() {
  return (
    <section className="container-responsive py-24 text-center">
      <SectionHeading
        title="Meet your AI legal team"
        subtitle="Each agent specialises in a task – together they form a swarm that scales with your firm."
      />

      <div className="mt-16 flex flex-wrap justify-center gap-8">
        {agents.map((agent, index) => (
          <motion.div
            key={agent}
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.5,
              delay: index * 0.15,
              ease: "easeOut",
            }}
            className="flex flex-col items-center gap-3"
          >
            <AIOrb label={agent} />

            <p className="text-sm font-medium text-slate-300">
              {agent}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}