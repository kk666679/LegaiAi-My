"use client"
import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

export const GlassCard = ({ 
  className, 
  ...props 
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "bg-gradient-to-br from-white/6 to-white/2 backdrop-blur-xl border border-white/8 rounded-2xl transition-all duration-300 hover:border-cyan-400/25 hover:shadow-[0_20px_60px_rgba(0,200,255,0.08)] hover:-translate-y-1",
      className
    )}
    {...props}
  />
)
