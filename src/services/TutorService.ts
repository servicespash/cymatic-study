import { supabase } from "@/integrations/supabase/client";

export class TutorService {
  async sendMessage(
    messages: { role: string; content: string }[],
    userName: string,
    activeSubject: string,
    onChunk: (chunk: string) => void,
  ) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;

    let res: Response;
    const body = JSON.stringify({
      messages,
      userName,
      subject: activeSubject,
      persona: activeSubject === "physics" || activeSubject === "mathematics" ? "male" : "female",
    });

    try {
      // Primary API
      res = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
      });

      if (!res.ok) throw new Error(`Local API failed: ${res.status}`);
    } catch (err) {
      console.warn("[TutorService] Local API failed, falling back to Edge Function:", err);
      // Fallback
      res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Tutor APIs failed (${res.status}): ${errText}`);
      }
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const j = JSON.parse(payload);
          const delta = j.choices?.[0]?.delta?.content;
          if (typeof delta === "string") onChunk(delta);
        } catch (e) {
          // Ignore
        }
      }
    }
  }
}

export const tutorService = new TutorService();
