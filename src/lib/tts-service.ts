// High-fidelity TTS via Lovable AI Gateway (server-side edge function).
// Returns { audioData } as base64 MP3 for the client to play, or throws so
// speech-engine falls back to native/browser TTS when offline.

import { supabase } from "@/integrations/supabase/client";

export const generateTts = async (opts: {
  text: string;
  persona: "Adams" | "Haawa";
}): Promise<{ audioData: string; mime: string }> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("offline");
  }

  const { data, error } = await supabase.functions.invoke("tts-speak", {
    body: { text: opts.text, persona: opts.persona },
  });

  if (error) throw error;
  if (!data?.audioData) throw new Error("No audio returned");

  return { audioData: data.audioData, mime: data.mime ?? "audio/mp3" };
};
