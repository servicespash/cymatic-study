import { ReactNode } from "react";
import {
  ResponsiveContainer,
  type ContainerVariant,
} from "@/components/layout/ResponsiveContainer";
import { cn } from "@/lib/utils";
import { GeminiZeroState } from "@/components/features/tutor/GeminiZeroState";

export interface MainContainerProps {
  children?: ReactNode;
  displayName?: string;
  variant?: ContainerVariant;
  className?: string;
  onSelectPrompt?: (prompt: string) => void;
}

/**
 * Standardized responsive layout container wrapper with Gemini-style dynamic zero-state
 */
export function MainContainer({
  children,
  displayName,
  variant = "default",
  className,
  onSelectPrompt,
}: MainContainerProps) {
  if (children) {
    return (
      <ResponsiveContainer variant={variant} className={className}>
        {children}
      </ResponsiveContainer>
    );
  }

  return (
    <div className={cn("w-full h-full flex items-center justify-center py-6", className)}>
      <GeminiZeroState displayName={displayName} onSelectPrompt={onSelectPrompt} />
    </div>
  );
}

export default MainContainer;
