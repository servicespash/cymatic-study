import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ContainerVariant = "default" | "fluid" | "narrow" | "dashboard" | "grid" | "centered";

export interface ResponsiveContainerProps {
  children: ReactNode;
  variant?: ContainerVariant;
  className?: string;
  id?: string;
  as?: keyof JSX.IntrinsicElements;
  noPadding?: boolean;
}

/**
 * Standardized Responsive Container Wrapper
 * Controls desktop/mobile padding, max-width thresholds, and container query context.
 */
export function ResponsiveContainer({
  children,
  variant = "default",
  className,
  id,
  as: Component = "div",
  noPadding = false,
}: ResponsiveContainerProps) {
  const variantClasses: Record<ContainerVariant, string> = {
    default: "max-w-7xl mx-auto w-full",
    fluid: "max-w-[1720px] mx-auto w-full",
    narrow: "max-w-4xl mx-auto w-full",
    dashboard: "max-w-[1600px] mx-auto w-full dashboard-container",
    grid: "max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6",
    centered: "max-w-lg mx-auto w-full flex flex-col items-center justify-center min-h-[70vh]",
  };

  const paddingClasses = noPadding
    ? ""
    : "px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8";

  return (
    <Component
      id={id}
      className={cn(
        variantClasses[variant],
        paddingClasses,
        "box-border transition-all",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export default ResponsiveContainer;
