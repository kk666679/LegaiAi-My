"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "mark" | "wordmark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  "aria-label"?: string;
}

const SIZES = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
} as const;

const VARIANT_DEFAULT_SIZES = {
  mark: "md" as const,
  wordmark: "md" as const,
  full: "lg" as const,
};

export function Logo({
  className,
  variant = "wordmark",
  size,
  "aria-label": ariaLabel = "LawMate",
}: LogoProps) {
  const resolvedSize = size ?? VARIANT_DEFAULT_SIZES[variant];
  const dimensions = SIZES[resolvedSize];

  return (
    <img
      src="/lawmate-logo/lawmate.svg"
      alt={ariaLabel}
      width={dimensions}
      height={dimensions}
      className={cn("shrink-0", className)}
      style={{ width: dimensions, height: dimensions }}
    />
  );
}

export function LawMateMark(props: Omit<LogoProps, "variant">) {
  return <Logo {...props} variant="mark" />;
}

export function LawMateWordmark(props: Omit<LogoProps, "variant">) {
  return <Logo {...props} variant="wordmark" />;
}

export function LawMateFullLockup(props: Omit<LogoProps, "variant">) {
  return <Logo {...props} variant="full" />;
}
