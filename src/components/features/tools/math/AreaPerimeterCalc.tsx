import React, { useState } from "react";
import { Calculator } from "lucide-react";

const ToolCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-math">
        <Calculator className="h-5 w-5 text-primary-foreground" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

const Result = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) return null;
  return (
    <div className="mt-4 rounded-lg bg-math/10 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-math">{value}</p>
    </div>
  );
};

const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="mt-3 w-full rounded-lg bg-math py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 shadow-sm active:scale-[0.98]"
  >
    {children}
  </button>
);

export const AreaPerimeterCalc = () => {
  const [shape, setShape] = useState<"rectangle" | "triangle" | "circle">("rectangle");
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const n1 = parseFloat(v1),
      n2 = parseFloat(v2);
    if (shape === "rectangle") {
      if (isNaN(n1) || isNaN(n2)) return;
      setResult(`Area: ${n1 * n2} | Perimeter: ${2 * (n1 + n2)}`);
    } else if (shape === "triangle") {
      if (isNaN(n1) || isNaN(n2)) return;
      setResult(`Area: ${0.5 * n1 * n2}`);
    } else if (shape === "circle") {
      if (isNaN(n1)) return;
      setResult(
        `Area: ${(Math.PI * n1 * n1).toFixed(2)} | Circumference: ${(2 * Math.PI * n1).toFixed(2)}`,
      );
    }
  };

  return (
    <ToolCard title="Area & Perimeter">
      <div className="mb-3 flex gap-2">
        {(["rectangle", "triangle", "circle"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setShape(s);
              setResult(null);
            }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${shape === s ? "bg-math text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {shape === "rectangle" && (
          <>
            <InputField label="Length" value={v1} onChange={setV1} placeholder="5" />
            <InputField label="Width" value={v2} onChange={setV2} placeholder="3" />
          </>
        )}
        {shape === "triangle" && (
          <>
            <InputField label="Base" value={v1} onChange={setV1} placeholder="6" />
            <InputField label="Height" value={v2} onChange={setV2} placeholder="4" />
          </>
        )}
        {shape === "circle" && (
          <InputField label="Radius" value={v1} onChange={setV1} placeholder="7" />
        )}
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Results" value={result} />
    </ToolCard>
  );
};

export default AreaPerimeterCalc;
