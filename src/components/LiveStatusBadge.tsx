import { cn } from "@/lib/utils";

export function LiveStatusBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-500">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
      </span>
      Live
    </span>
  );
}
