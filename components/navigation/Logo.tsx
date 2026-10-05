import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SIZES = {
  sm: { width: 28, height: 28, textClass: 'text-base' },
  md: { width: 36, height: 36, textClass: 'text-lg' },
  lg: { width: 48, height: 48, textClass: 'text-xl' },
} as const;

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const { width, height, textClass } = SIZES[size];

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawmate-logo/lawmate-logo.svg"
        alt="LAW MATE"
        width={width}
        height={height}
        className="shrink-0"
        style={{ width, height }}
      />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={cn('font-heading font-bold tracking-tight text-foreground', textClass)}>
            <span className="text-[#C9952A]">LAW</span>
            <span className="text-[#C9952A]">MATE</span>{' '}
            <span className="text-blue-400">AI</span>
          </span>
          <span className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Legal Intelligence
          </span>
        </span>
      )}
    </span>
  );
}
