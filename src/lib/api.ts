import { supabase } from "./supabase";

export interface UserProfilePayload {
  user_id: string;
  email?: string;
  full_name?: string;
  school_id?: string;
  role?: string;
  updated_at?: string;
}

export async function upsertUserProfile(payload: UserProfilePayload) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: payload.user_id,
        email: payload.email,
        full_name: payload.full_name,
        school_id: payload.school_id,
        role: payload.role || "student",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user profile:", error);
    throw error;
  }
  return data;
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
  return data;
}
