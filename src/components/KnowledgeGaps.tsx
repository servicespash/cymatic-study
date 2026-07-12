import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTutorStore } from "@/store/useTutorStore";
import { useGamificationStore } from "@/store/useGamificationStore";
import { BrainCircuit, CheckCircle } from "lucide-react";

export function KnowledgeGaps() {
  const [gaps, setGaps] = useState<{ topic: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const messages = useTutorStore((s) => s.messages);
  const { completeGap, completedGaps } = useGamificationStore();

  useEffect(() => {
    async function analyzeGaps() {
      if (messages.length < 3) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("analyze-gaps", {
          body: { messages },
        });
        if (error) throw error;
        setGaps(data);
      } catch (e) {
        console.error("Failed to analyze gaps:", e);
      } finally {
        setLoading(false);
      }
    }
    analyzeGaps();
  }, [messages.length]);

  if (loading) return <div className="text-sm text-zinc-500">Analyzing your progress...</div>;
  if (gaps.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <BrainCircuit className="h-5 w-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Recommended Review</h3>
      </div>
      <div className="space-y-4">
        {gaps.map((gap, i) => (
          <div
            key={i}
            className="flex justify-between items-center border-l-2 border-cyan-500 pl-4"
          >
            <div>
              <p className="text-sm font-medium text-zinc-200">{gap.topic}</p>
              <p className="text-xs text-zinc-400 mt-1">{gap.reason}</p>
            </div>
            {!completedGaps.includes(gap.topic) && (
              <button
                onClick={() => completeGap(gap.topic)}
                className="text-cyan-400 hover:text-cyan-300"
                aria-label={`Mark ${gap.topic} as learned`}
              >
                <CheckCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
