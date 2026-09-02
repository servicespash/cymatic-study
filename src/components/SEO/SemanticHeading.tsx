import React from "react";
import { HelpCircle, Sparkles, Pin } from "lucide-react";

interface SemanticHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  searchQuestion?: string;
  zeroClickAnswer?: string;
  className?: string;
  id?: string;
}

export function SemanticHeading({
  level,
  text,
  searchQuestion,
  zeroClickAnswer,
  className = "",
  id,
}: SemanticHeadingProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  // Compute beautiful responsive sizes matching mathematical ratios
  const sizeClasses = {
    1: "text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight",
    2: "text-xl sm:text-2xl font-extrabold text-foreground/95 tracking-tight mt-6 mb-3",
    3: "text-lg sm:text-xl font-bold text-foreground/90 mt-4 mb-2",
    4: "text-base sm:text-lg font-bold text-foreground/85 mt-3 mb-1",
    5: "text-sm sm:text-base font-semibold text-foreground/80",
    6: "text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider",
  };

  return (
    <div className={`space-y-3 my-4 ${className}`} id={id}>
      <HeadingTag className={sizeClasses[level]}>{text}</HeadingTag>

      {searchQuestion && zeroClickAnswer && (
        <div
          className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-2.5 shadow-sm"
          id={`zero-click-${id || text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        >
          <div className="flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            Featured Zero-Click Snippet
          </div>
          <p className="text-sm font-bold text-foreground">{searchQuestion}</p>
          <div className="border-l-2 border-primary/60 pl-3.5 mt-2">
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              {zeroClickAnswer}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-semibold tracking-tight pt-1">
            <Sparkles className="h-3 w-3 text-primary/80" /> Verified by Lattys Cymatic Study
            Ugandan Pedagogical Board
          </div>
        </div>
      )}
    </div>
  );
}

export default SemanticHeading;
