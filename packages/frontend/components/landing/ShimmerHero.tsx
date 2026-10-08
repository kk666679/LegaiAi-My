"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Shimmer } from "@/components/ai-elements/shimmer";

export function ShimmerHero({ children }: { children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px]" />
      <Shimmer className="absolute inset-0 opacity-30">{" "}</Shimmer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
