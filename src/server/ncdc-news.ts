import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function handleNcdcNewsRequest(request: Request) {
  console.log("NCDC News & Media Synchronization called");

  // Just return the current news from the database
  try {
    const { data: news, error } = await supabaseAdmin
      .from("news_broadcasts")
      .select("*")
      .eq("is_active", true)
      .order("published_at", { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: news.length, news }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("News database operations failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Database sync failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
