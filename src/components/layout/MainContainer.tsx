import { ReactNode } from "react";
import { ResponsiveContainer, type ContainerVariant } from "./layout/ResponsiveContainer";
import { cn } from "@/lib/utils";

export interface MainContainerProps {
  children?: ReactNode;
  displayName?: string;
  variant?: ContainerVariant;
  className?: string;
}

/**
 * Standardized responsive layout container wrapper
 * Backward-compatible with prompt-grid and modern children layouts
 */
export function MainContainer({
  children,
  displayName,
  variant = "default",
  className,
}: MainContainerProps) {
  if (children) {
    return (
      <ResponsiveContainer variant={variant} className={className}>
        {children}
      </ResponsiveContainer>
    );
  }

  const prompts = [
    "Explain photosynthesis in plants",
    "Solve quadratic equations with factorization",
    "Draft a UNEB physics laboratory report",
    "Analyze biology ecological trends",
  ];

  return (
    <ResponsiveContainer
      variant="centered"
      className={cn("text-center space-y-10 animate-in fade-in duration-700", className)}
    >
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Hello, {displayName || "Scholar"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          What concept from the Uganda Secondary Syllabus would you like to explore today?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            className="p-4 bg-card hover:bg-card/80 border border-border/80 rounded-xl text-left text-xs sm:text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:shadow-sm"
          >
            {p}
          </button>
        ))}
      </div>
    </ResponsiveContainer>
  );
}

export default MainContainer;
