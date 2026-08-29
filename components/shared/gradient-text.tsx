"use client";
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export const GradientText = ({ 
  className, 
  ...props 
}: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-[length:200%_200%] bg-clip-text text-transparent animate-[gradShift_6s_ease-in-out_infinite]",
      className
    )}
    {...props}
  />
)
