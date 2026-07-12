import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// Persona -> voice mapping. Adams = deep male, Haawa = warm female.
const VOICE_BY_PERSONA: Record<string, string> = {
  Adams: "onyx",
  Haawa: "shimmer",
};

// Per-persona instructions to color prosody (accent, warmth, pace).
const INSTRUCTIONS_BY_PERSONA: Record<string, string> = {
  Adams:
    "Speak as a confident, protective young Ugandan male mentor. Warm baritone, calm, grounded, unhurried. Slight East African English cadence. No robotic tone.",
  Haawa:
    "Speak as a wise, supportive Ugandan female tutor. Bright, articulate, gentle, encouraging. Soft East African English cadence.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.slice(0, 4000).trim() : "";
    const personaRaw = typeof body?.persona === "string" ? body.persona : "Adams";
    const persona = personaRaw === "Haawa" ? "Haawa" : "Adams";

    if (!text) {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voice = VOICE_BY_PERSONA[persona];
    const instructions = INSTRUCTIONS_BY_PERSONA[persona];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: text,
        voice,
        instructions,
        response_format: "mp3",
      }),
    });

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      console.error("tts upstream failed", upstream.status, errBody);
      return new Response(
        JSON.stringify({ error: "TTS upstream failed", status: upstream.status, details: errBody }),
        {
          status: upstream.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const audioBuffer = await upstream.arrayBuffer();
    const audioData = base64Encode(new Uint8Array(audioBuffer));

    return new Response(JSON.stringify({ audioData, mime: "audio/mp3", persona, voice }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tts-speak error", e);
    return new Response(JSON.stringify({ error: (e as Error).message ?? "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
