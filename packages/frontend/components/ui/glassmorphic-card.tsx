import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassmorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "interactive";
}

const GlassmorphicCard = React.forwardRef<HTMLDivElement, GlassmorphicCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-background/50 backdrop-blur-sm",
          variant === "hover" && "hover:bg-background/60 transition-colors",
          variant === "interactive" && "cursor-pointer hover:bg-background/60 transition-all hover:scale-[1.02]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassmorphicCard.displayName = "GlassmorphicCard";

export { GlassmorphicCard };
export default GlassmorphicCard;
