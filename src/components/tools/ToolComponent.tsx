import React, { useState, useEffect } from "react";
import toolsData from "@/assets/data/tools.json";
import { Calculator } from "lucide-react";

interface ToolContent {
  explanation: string;
  formula: string;
  example: string;
  shortNotes: string;
}

const ToolComponent: React.FC<{ toolId: string }> = ({ toolId }) => {
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const tool = toolsData.tools.find((t) => t.id === toolId);
  if (!tool) return <div>Tool not found</div>;

  const { name, content } = tool;

  // Logic map for A-Level Pro requirements
  const executeLogic = () => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);

    if (toolId === "math-quadratic-almighty") {
      // Logic for ax^2 + bx + c = 0
      const a = v1,
        b = v2,
        c = parseFloat(prompt("Enter c:") || "0");
      const D = b * b - 4 * a * c;
      if (D < 0)
        setResult(
          `Complex: ${(-b / (2 * a)).toFixed(2)} ± ${(Math.sqrt(-D) / (2 * a)).toFixed(2)}i`,
        );
      else
        setResult(
          `Real: ${((-b + Math.sqrt(D)) / (2 * a)).toFixed(2)}, ${((-b - Math.sqrt(D)) / (2 * a)).toFixed(2)}`,
        );
    } else if (toolId === "physics-ohms-law") {
      setResult(`V = ${v1 * v2} V`);
    }
  };

  return (
    <div className="p-6 bg-card rounded-2xl border border-border shadow-sm">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-4">{content.formula}</div>
      <p className="text-sm mb-4 text-muted-foreground">{content.explanation}</p>

      <div className="grid grid-cols-2 gap-4">
        <input
          className="p-2 border rounded"
          placeholder="Value 1"
          onChange={(e) => setVal1(e.target.value)}
        />
        <input
          className="p-2 border rounded"
          placeholder="Value 2"
          onChange={(e) => setVal2(e.target.value)}
        />
      </div>
      <button className="mt-4 w-full bg-primary text-white py-2 rounded-lg" onClick={executeLogic}>
        Calculate
      </button>
      {result && <div className="mt-4 p-3 bg-accent rounded font-bold">{result}</div>}
    </div>
  );
};

export default ToolComponent;
