import { useCurriculum } from "@/lib/curriculum-context";
import { Button } from "@/components/ui/button";

export function CurriculumToggle() {
  const { mode, setMode } = useCurriculum();
  return (
    <div className="flex bg-muted rounded-lg p-1">
      <Button
        variant={mode === "lower-secondary" ? "default" : "ghost"}
        onClick={() => setMode("lower-secondary")}
        className="flex-1 text-xs"
      >
        Lower Secondary (S1-S4)
      </Button>
      <Button
        variant={mode === "a-level" ? "default" : "ghost"}
        onClick={() => setMode("a-level")}
        className="flex-1 text-xs"
      >
        A-Level (S5-S6)
      </Button>
    </div>
  );
}
