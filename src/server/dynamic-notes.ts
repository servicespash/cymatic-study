import { GoogleGenAI } from "@google/genai";

export async function handleDynamicNotesRequest(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { subject, level, topicTitle } = body;

    if (!subject || !level || !topicTitle) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `You are an expert Ugandan secondary school teacher. Generate comprehensive, highly accurate study notes for a student in Senior ${level} studying ${subject}.
Topic: ${topicTitle}

Requirements:
1. Align strictly with the Uganda National Curriculum Development Centre (NCDC) syllabus.
2. Include modern world research where applicable to make it engaging.
3. Structure the notes in JSON format containing an array of 'sections'. Each section should have a 'heading' and 'content' (detailed paragraph or bullet points).
4. Output ONLY the JSON array. Do not include markdown formatting like \`\`\`json.
Example format:
[
  { "heading": "Introduction", "content": "..." },
  { "heading": "Key Principles", "content": "..." }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "";
    if (!text) throw new Error("No response from AI service");

    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    let parsedNotes;
    try {
      parsedNotes = JSON.parse(text);
    } catch (err) {
      throw new Error("Failed to parse AI response as JSON.");
    }

    return new Response(JSON.stringify({ sections: parsedNotes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Dynamic notes generation error:", error);

    // Check for specific API key or configuration errors
    const errorMessage = error.message || "";
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
      return new Response(
        JSON.stringify({ error: "AI service configuration error. Please check API key." }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to generate dynamic notes", details: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
