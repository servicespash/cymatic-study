import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { useTutor } from "@/lib/TutorService";
import { VisionLiveSession } from "./VisionLiveSession";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

import { useUserMood } from "@/lib/user-mood-context";

import { fetchWeatherSummary } from "@/lib/greetings";
import { getTimeContext } from "@/lib/empathy-engine";

export const MiraFAB: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { persona, voice, speak } = useTutor();
  const { user } = useAuth();
  const { mood: userMood } = useUserMood();

  const handleSend = async ({ dataUrl, transcript }: { dataUrl: string; transcript: string }) => {
    // Basic implementation of sending from FAB
    // In a real app, this might go to a global chat state or just trigger a one-off response
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) return;

      const weather = await fetchWeatherSummary();

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: transcript || "What do you see?" },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          persona: voice,
          userMood: userMood ?? "",
          userName: user?.user_metadata?.display_name || user?.email?.split("@")[0] || "learner",
          user_id: user?.id,
          context: {
            weather,
            district: weather?.split(" in ")[1],
            points: 0, // FAB context might not have points easily available
            timeContext: getTimeContext(),
            route: "FAB / Mira Overlay",
          },
        }),
      });

      if (r.ok && r.body) {
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let assistant = "";
        let sentenceBuffer = "";
        let done = false;

        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          const chunk = dec.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const j = line.slice(6).trim();
              if (j === "[DONE]") {
                done = true;
                break;
              }
              try {
                const p = JSON.parse(j);
                const c = p.choices?.[0]?.delta?.content;
                if (c) {
                  assistant += c;
                  sentenceBuffer += c;

                  // Handle Applause
                  if (assistant.includes("[APPLAUSE]")) {
                    toast.success("Adams & Haawa are applauding your progress! 👏✨");
                    assistant = assistant.replace("[APPLAUSE]", "👏✨");
                  }

                  // Handle System Messages (Tasks)
                  if (assistant.includes("[SYSTEM:")) {
                    const match = assistant.match(/\[SYSTEM: (.*?)\]/);
                    if (match) {
                      toast.info(match[1], { duration: 5000 });
                      assistant = assistant.replace(match[0], `📅 ${match[1]}`);
                    }
                  }

                  if (/[.!?]\s$/.test(sentenceBuffer) || /[.!?]$/.test(sentenceBuffer)) {
                    void speak(sentenceBuffer.trim(), { queue: true });
                    sentenceBuffer = "";
                  }
                }
              } catch (e) {
                // Ignore parsing errors for non-JSON chunks
              }
            }
          }
        }
        if (sentenceBuffer.trim()) void speak(sentenceBuffer.trim(), { queue: true });
      }
    } catch (e) {
      console.error("FAB send failed", e);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center border border-white/20 backdrop-blur-md",
          voice === "male"
            ? "bg-blue-600/80 shadow-blue-500/50"
            : "bg-purple-600/80 shadow-purple-500/50",
        )}
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
        <Sparkles className="h-6 w-6 text-white" />
      </button>

      <VisionLiveSession open={open} onClose={() => setOpen(false)} />
    </>
  );
};
