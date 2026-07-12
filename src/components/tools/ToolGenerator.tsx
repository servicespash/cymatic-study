import React from "react";
import labToolsData from "@/assets/data/lab_tools.json";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export const ToolGenerator: React.FC<{ category: string; toolId: string }> = ({
  category,
  toolId,
}) => {
  const data = (labToolsData.hub_tools as any)[category]?.find((t: any) => t.id === toolId);

  if (!data) return <div>Tool not found.</div>;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground">{data.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">Lab Tool: {data.lab_tool_association}</p>
      </div>

      <div className="mb-6 rounded-lg bg-muted/50 p-4 border border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Scientific Formula
        </p>
        <div className="text-lg text-foreground">
          <InlineMath math={data.latex_formula} />
        </div>
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
          A-Level Pro Logic
        </p>
        <p className="text-xs text-foreground italic">{data.pro_logic}</p>
      </div>
    </div>
  );
};
