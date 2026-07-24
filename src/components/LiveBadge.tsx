import React from "react";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function LiveBadge({ className, showIcon = true }: LiveBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-red-500/20",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
      </span>
      {showIcon && <Radio className="h-3 w-3" />}
      Live
    </div>
  );
}
