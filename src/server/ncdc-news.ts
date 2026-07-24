import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function handleNcdcNewsRequest(request: Request) {
  console.log("NCDC News & Media Synchronization called");

  let forceRefresh = false;
  try {
    const body = await request.json();
    forceRefresh = !!body?.forceRefresh;
  } catch (e) {
    // Body empty or not JSON, default to false
  }

  // Default High-Quality Podcasts
  const DEFAULT_PODCASTS = [
    {
      title: "The Magic of Matrices in Real Life",
      body: JSON.stringify({
        description:
          "Discover how S5/S6 matrix algebra powers modern computer graphics, video game mechanics, and complex transformations.",
        subject: "Mathematics",
        speaker: "Sir Latif Isabirye",
        duration: "12:45",
      }),
      media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      media_type: "podcast",
      is_ad: false,
      is_active: true,
    },
    {
      title: "Quantum Mechanics & Semiconductor Electronics",
      body: JSON.stringify({
        description:
          "Dive into wave-particle duality, Planck's constant, and how modern diodes and transistors are designed to power our devices.",
        subject: "Physics",
        speaker: "Dr. Florence Nakayiza",
        duration: "15:20",
      }),
      media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      media_type: "podcast",
      is_ad: false,
      is_active: true,
    },
    {
      title: "The Energy Landscapes of Thermodynamics",
      body: JSON.stringify({
        description:
          "A deep-dive into physical chemistry principles, explaining how Enthalpy, Entropy, and Gibbs Free Energy govern natural reactions.",
        subject: "Chemistry",
        speaker: "Prof. Herbert Mukasa",
        duration: "10:15",
      }),
      media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      media_type: "podcast",
      is_ad: false,
      is_active: true,
    },
    {
      title: "DNA Replication & The Molecular Clock",
      body: JSON.stringify({
        description:
          "Syllabus review of the molecular processes of transcription and translation, and how cell division maintains biological lifespans.",
        subject: "Biology",
        speaker: "Teacher Brenda Namubiru",
        duration: "14:10",
      }),
      media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      media_type: "podcast",
      is_ad: false,
      is_active: true,
    },
  ];

  // Default High-Quality Live Sessions
  const DEFAULT_LIVE_SESSIONS = [
    {
      title: "Cymatic Masterclass: Oscillating Systems & Resonance",
      body: JSON.stringify({
        description:
          "An intensive visual lecture on mechanical resonance, sound wave amplification, and the mathematical equations of simple harmonic motion.",
        subject: "Physics",
        instructor: "Sir Latif Isabirye",
        scheduled_at: new Date(Date.now() + 3600000 * 24).toISOString(), // Tomorrow
        duration: "1h 30m",
      }),
      media_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      media_type: "live_session",
      is_ad: false,
      is_active: true,
    },
    {
      title: "S5/S6 Organic Chemistry Synthesis Pathway Review",
      body: JSON.stringify({
        description:
          "Step-by-step breakdown of aliphatic and aromatic reaction mechanisms, functional groups, and esterification practical questions.",
        subject: "Chemistry",
        instructor: "Prof. Herbert Mukasa",
        scheduled_at: new Date(Date.now() + 3600000 * 48).toISOString(), // In 2 days
        duration: "1h",
      }),
      media_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      media_type: "live_session",
      is_ad: false,
      is_active: true,
    },
  ];

  // Default Student Spotlights
  const DEFAULT_STUDENT_SHOUTOUTS = [
    {
      title: "Student Spotlight: Joy Mary Alupo Tops National STEM Challenge",
      body: JSON.stringify({
        description:
          "Joy Mary Alupo, a Senior 5 student from Tororo, has won the National Youth STEM Cup using Cymatic Study's interactive physics calculators to design a miniature eco-friendly irrigation sensor. We are incredibly proud of Joy! Keep shining!",
        subject: "Physics",
        achievement: "National STEM Cup Winner",
        school: "Tororo Girls' School",
      }),
      media_url: null,
      media_type: "student_shoutout",
      is_ad: false,
      is_active: true,
    },
    {
      title: "Student Spotlight: Ronald Okello Designs Matrix Calculator",
      body: JSON.stringify({
        description:
          "Ronald Okello, an S6 student from Gulu, built an offline matrix solver tool using Cymatic Study's documentation. His tool helps classmates verify linear transformation determinants. Truly excellent innovation, Ronald!",
        subject: "Mathematics",
        achievement: "Matrix Solver App Creator",
        school: "St. Joseph's College Layibi",
      }),
      media_url: null,
      media_type: "student_shoutout",
      is_ad: false,
      is_active: true,
    },
  ];

  let isEmpty = true;
  const hasAdminKey = !!(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  );

  if (hasAdminKey) {
    try {
      const { count } = await supabaseAdmin
        .from("news_broadcasts")
        .select("*", { count: "exact", head: true });
      isEmpty = count === 0;
    } catch (e) {
      console.warn("Supabase admin client failed to check news count:", e);
    }
  } else {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing, skipping database news check.");
  }

  let generatedNews: Array<{ title: string; body: string }> = [];

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_KEY;

  if (apiKey) {
    console.log(
      `[GeminiNews] API key present (len: ${apiKey.length}, starts with: ${apiKey.substring(0, 5)}...)`,
    );
  } else {
    console.warn("[GeminiNews] No Gemini API key found in environment variables.");
  }
  // Use Gemini for grounded news if API key is present
  if (apiKey) {
    const ai = new GoogleGenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    try {
      console.log("Fetching live news from Gemini 3.1 Flash-lite search grounding...");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Provide exactly 3 distinct, highly professional real-time news items about the National Curriculum Development Centre (NCDC) or Uganda National Examinations Board (UNEB) regarding Ugandan secondary school curriculum updates, syllabus rollouts, or mocks schedules for Advanced/Ordinary Level science subjects (Mathematics, Physics, Chemistry, Biology). Return the result in JSON format as an array of objects with 'title' and 'body' fields. Keep the body text clear, descriptive, and academic. Do not include markdown formatting like ```json.",
              },
            ],
          },
        ],
        tools: [{ googleSearch: {} }],
        config: {
          responseMimeType: "application/json",
        },
      });
      let text = response.text || "";
      if (text) {
        text = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          generatedNews = parsed;
        } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.news)) {
          generatedNews = parsed.news;
        }
      }
    } catch (e: any) {
      if (e?.message?.includes("API key not valid")) {
        console.warn("[GeminiNews] API key invalid, skipping grounded search.");
      } else {
        console.error("Gemini grounding news search failed:", e);
      }
    }
  }

  try {
    const hasAdminKey = !!(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // 1. Handle curriculum updates insertions/replacements
    if (generatedNews.length > 0 && hasAdminKey) {
      try {
        // Delete old dynamic updates
        await supabaseAdmin.from("news_broadcasts").delete().eq("media_type", "curriculum_update");

        const payload = generatedNews.map((item) => ({
          title: item.title,
          body: typeof item.body === "object" ? JSON.stringify(item.body) : item.body,
          media_type: "curriculum_update",
          is_ad: false,
          is_active: true,
          published_at: new Date().toISOString(),
        }));
        await supabaseAdmin.from("news_broadcasts").insert(payload);
      } catch (innerError) {
        console.warn("Could not update news_broadcasts in database:", innerError);
      }
    } else if (forceRefresh && hasAdminKey) {
      try {
        // if it failed to generate news, we should probably not delete existing news to avoid empty feed,
        // or we can insert fallback news if it's completely empty.
        const { count: currCount } = await supabaseAdmin
          .from("news_broadcasts")
          .select("*", { count: "exact", head: true })
          .eq("media_type", "curriculum_update");
        if (currCount === 0) {
          const fallbackCurriculum = [
            {
              title: "NCDC Rollout of New S5 & S6 Syllabi for Scientific Subjects",
              body: "The National Curriculum Development Centre (NCDC) has officially released the updated Advanced Level (UACE) syllabus guidelines for Mathematics, Physics, Chemistry, and Biology. Focus is now on research-driven investigations, continuous project assessments, and practical application modules.",
              media_type: "curriculum_update",
              is_ad: false,
              is_active: true,
              published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            },
            {
              title: "UNEB S4 (UCE) Chemistry and Biology Mock Exams Schedule",
              body: "The Uganda National Examinations Board (UNEB) has announced the nationwide dates for lower secondary mock practicals. Students are encouraged to practice their laboratory drawings, titration analysis, and biology specimen classifications.",
              media_type: "curriculum_update",
              is_ad: false,
              is_active: true,
              published_at: new Date(Date.now() - 3600000 * 12).toISOString(),
            },
          ];
          await supabaseAdmin.from("news_broadcasts").insert(fallbackCurriculum);
        }
      } catch (innerError) {
        console.warn("Could not check/insert fallback curriculum in database:", innerError);
      }
    }

    // 2. Seed default tables if database is completely empty
    if (isEmpty && hasAdminKey) {
      try {
        console.log("First-time seeding of Podcasts, Live Sessions, and Student Shoutouts...");
        await supabaseAdmin.from("news_broadcasts").insert(DEFAULT_PODCASTS);
        await supabaseAdmin.from("news_broadcasts").insert(DEFAULT_LIVE_SESSIONS);
        await supabaseAdmin.from("news_broadcasts").insert(DEFAULT_STUDENT_SHOUTOUTS);

        // Fallback curriculum seeds if Gemini fetch was empty
        if (generatedNews.length === 0) {
          const fallbackCurriculum = [
            {
              title: "NCDC Rollout of New S5 & S6 Syllabi for Scientific Subjects",
              body: "The National Curriculum Development Centre (NCDC) has officially released the updated Advanced Level (UACE) syllabus guidelines for Mathematics, Physics, Chemistry, and Biology. Focus is now on research-driven investigations, continuous project assessments, and practical application modules.",
              media_type: "curriculum_update",
              is_ad: false,
              is_active: true,
              published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            },
            {
              title: "UNEB S4 (UCE) Chemistry and Biology Mock Exams Schedule",
              body: "The Uganda National Examinations Board (UNEB) has announced the nationwide dates for lower secondary mock practicals. Students are encouraged to practice their laboratory drawings, titration analysis, and biology specimen classifications.",
              media_type: "curriculum_update",
              is_ad: false,
              is_active: true,
              published_at: new Date(Date.now() - 3600000 * 12).toISOString(),
            },
          ];
          await supabaseAdmin.from("news_broadcasts").insert(fallbackCurriculum);
        }
      } catch (innerError) {
        console.warn("Could not seed default news in database:", innerError);
      }
    } else if (hasAdminKey) {
      try {
        // Check for missing categories and patch them so they exist
        const { data: podcasts } = await supabaseAdmin
          .from("news_broadcasts")
          .select("id")
          .eq("media_type", "podcast")
          .limit(1);
        if (!podcasts || podcasts.length === 0) {
          await supabaseAdmin.from("news_broadcasts").insert(DEFAULT_PODCASTS);
        }

        const { data: sessions } = await supabaseAdmin
          .from("news_broadcasts")
          .select("id")
          .eq("media_type", "live_session")
          .limit(1);
        if (!sessions || sessions.length === 0) {
          await supabaseAdmin.from("news_broadcasts").insert(DEFAULT_LIVE_SESSIONS);
        }

        const { data: shoutouts } = await supabaseAdmin
          .from("news_broadcasts")
          .select("id")
          .eq("media_type", "student_shoutout")
          .limit(1);
        if (!shoutouts || shoutouts.length === 0) {
          await supabaseAdmin.from("news_broadcasts").insert(DEFAULT_STUDENT_SHOUTOUTS);
        }
      } catch (innerError) {
        console.warn("Could not patch missing news categories in database:", innerError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: generatedNews.length, news: generatedNews }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (dbError) {
    console.warn(
      "News database operations failed (likely missing SUPABASE_SERVICE_ROLE_KEY):",
      dbError,
    );
    return new Response(
      JSON.stringify({
        success: true,
        count: generatedNews.length,
        news: generatedNews,
        warning: "Database sync failed",
      }),
      {
        status: 200, // Return 200 even if DB failed, since we might have generated news
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
