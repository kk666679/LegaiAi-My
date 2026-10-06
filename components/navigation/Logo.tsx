"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "mark" | "wordmark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  "aria-label"?: string;
}

const SIZES = {
  xs: { width: 20, height: 20, textSize: "text-xs" },
  sm: { width: 28, height: 28, textSize: "text-sm" },
  md: { width: 36, height: 36, textSize: "text-base" },
  lg: { width: 48, height: 48, textSize: "text-lg" },
  xl: { width: 64, height: 64, textSize: "text-xl" },
} as const;

const MARK_SIZES = {
  xs: { width: 16, height: 16 },
  sm: { width: 20, height: 20 },
  md: { width: 28, height: 28 },
  lg: { width: 36, height: 36 },
  xl: { width: 48, height: 48 },
} as const;

function LawMateMark({ size = "md", className, "aria-label": ariaLabel = "LawMate" }: { size?: keyof typeof MARK_SIZES; className?: string; "aria-label"?: string }) {
  const { width, height } = MARK_SIZES[size];
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id="lmTile" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B4CA8" />
          <stop offset="0.55" stopColor="#0E6FC4" />
          <stop offset="1" stopColor="#14A0DF" />
        </linearGradient>
        <linearGradient id="lmGlyph" x1="16" y1="7.8" x2="16" y2="25.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCF3FF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9.5" fill="url(#lmTile)" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8.75" stroke="#7FE0FF" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M7.6 12.0 16 7.8l8.4 4.2" stroke="url(#lmGlyph)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10.35" y="14.3" width="2.9" height="6.6" rx="1.45" fill="url(#lmGlyph)" />
      <rect x="18.75" y="14.3" width="2.9" height="6.6" rx="1.45" fill="url(#lmGlyph)" />
      <rect x="8.3" y="22.5" width="15.4" height="2.6" rx="1.3" fill="url(#lmGlyph)" />
    </svg>
  );
}

function LawMateWordmark({ size = "md", className, "aria-label": ariaLabel = "LawMate" }: { size?: keyof typeof SIZES; className?: string; "aria-label"?: string }) {
  const { width, height } = SIZES[size];
  const scale = width / 36;
  const textX = 42 * scale;
  const fontSize = 19 * scale;
  const yOffset = 21.5 * scale;
  return (
    <svg
      width={width + textX}
      height={height}
      viewBox={`0 0 ${152 * scale} ${32 * scale}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
      style={{ width: width + textX, height }}
    >
      <defs>
        <linearGradient id="lmTile" x1={3 * scale} y1={2 * scale} x2={29 * scale} y2={30 * scale} gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B4CA8" />
          <stop offset="0.55" stopColor="#0E6FC4" />
          <stop offset="1" stopColor="#14A0DF" />
        </linearGradient>
        <linearGradient id="lmGlyph" x1={16 * scale} y1={7.8 * scale} x2={16 * scale} y2={25.1 * scale} gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCF3FF" />
        </linearGradient>
      </defs>
      <rect width={32 * scale} height={32 * scale} rx={9.5 * scale} fill="url(#lmTile)" />
      <rect x={0.75 * scale} y={0.75 * scale} width={30.5 * scale} height={30.5 * scale} rx={8.75 * scale} stroke="#7FE0FF" strokeOpacity="0.35" strokeWidth={1.5 * scale} />
      <path d={`M${7.6 * scale} ${12.0 * scale} ${16 * scale} ${7.8 * scale}l${8.4 * scale} ${4.2 * scale}`} stroke="url(#lmGlyph)" strokeWidth={2.5 * scale} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={10.35 * scale} y={14.3 * scale} width={2.9 * scale} height={6.6 * scale} rx={1.45 * scale} fill="url(#lmGlyph)" />
      <rect x={18.75 * scale} y={14.3 * scale} width={2.9 * scale} height={6.6 * scale} rx={1.45 * scale} fill="url(#lmGlyph)" />
      <rect x={8.3 * scale} y={22.5 * scale} width={15.4 * scale} height={2.6 * scale} rx={1.3 * scale} fill="url(#lmGlyph)" />
      <text x={textX} y={yOffset} fontFamily="Outfit, Space Grotesk, ui-sans-serif, system-ui, sans-serif" fontWeight="700" fontSize={fontSize} fill="currentColor" letterSpacing="-0.02em">LawMate</text>
    </svg>
  );
}

function LawMateFullLockup({ size = "md", className, "aria-label": ariaLabel = "LawMate" }: { size?: keyof typeof SIZES; className?: string; "aria-label"?: string }) {
  const { width, height } = SIZES[size];
  const scale = width / 36;
  return (
    <svg
      width={152 * scale}
      height={32 * scale}
      viewBox="0 0 152 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
      style={{ width: 152 * scale, height: 32 * scale }}
    >
      <defs>
        <linearGradient id="lmTile" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B4CA8" />
          <stop offset="0.55" stopColor="#0E6FC4" />
          <stop offset="1" stopColor="#14A0DF" />
        </linearGradient>
        <linearGradient id="lmGlyph" x1="16" y1="7.8" x2="16" y2="25.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCF3FF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9.5" fill="url(#lmTile)" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8.75" stroke="#7FE0FF" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M7.6 12.0 16 7.8l8.4 4.2" stroke="url(#lmGlyph)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10.35" y="14.3" width="2.9" height="6.6" rx="1.45" fill="url(#lmGlyph)" />
      <rect x="18.75" y="14.3" width="2.9" height="6.6" rx="1.45" fill="url(#lmGlyph)" />
      <rect x="8.3" y="22.5" width="15.4" height="2.6" rx="1.3" fill="url(#lmGlyph)" />
      <text x="42" y="21.5" fontFamily="Outfit, Space Grotesk, ui-sans-serif, system-ui, sans-serif" fontWeight="700" fontSize="19" fill="currentColor" letterSpacing="-0.02em">LawMate</text>
    </svg>
  );
}

export function Logo({ className, variant = "wordmark", size = "md", showText = true, "aria-label": ariaLabel }: LogoProps) {
  const renderLogo = () => {
    switch (variant) {
      case "full":
        return <LawMateFullLockup size={size} aria-label={ariaLabel} />;
      case "mark":
        return <LawMateMark size={size} aria-label={ariaLabel} />;
      case "wordmark":
      default:
        return <LawMateWordmark size={size} aria-label={ariaLabel} />;
    }
  };

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {renderLogo()}
      {showText && variant !== "full" && (
        <span className="flex flex-col leading-none font-heading font-bold tracking-tight text-foreground">
          <span className="text-gradient-brand">{SIZES[size].textSize === "text-xs" ? "LAW MATE" : "LawMate"}</span>
          <span className="text-[8px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Legal Intelligence
          </span>
        </span>
      )}
    </span>
  );
}

export { LawMateMark, LawMateWordmark, LawMateFullLockup };