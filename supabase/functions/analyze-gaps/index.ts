import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: Deno.env.get("GEMINI_API_KEY")!,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const chatHistory = messages.map((m: any) => `${m.sender}: ${m.text}`).join("\n");

    const prompt = `Analyze the following chat history between a student and a tutor. 
    Identify 3-5 clear 'knowledge gaps' or concepts the student is struggling with.
    Return the result as a JSON array of objects with 'topic' and 'reason' fields.
    
    Chat History:
    ${chatHistory}
    
    JSON Response:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return new Response(response.text, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
