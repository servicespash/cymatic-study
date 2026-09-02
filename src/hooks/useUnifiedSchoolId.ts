import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const isUuid = (val: string | null | undefined): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export function useUnifiedSchoolId() {
  const { profile, schoolId: userRoleSchoolId } = useUserRole();
  const { user } = useAuth();

  const rawSchoolId =
    profile?.school_id ||
    profile?.org_id ||
    userRoleSchoolId ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : null) ||
    "";

  const schoolId = isUuid(rawSchoolId) || !rawSchoolId ? "" : rawSchoolId;

  const schoolName = profile?.school_name || user?.user_metadata?.school_name || "";

  const updateSchoolId = async (newSchoolId: string, newSchoolName: string) => {
    if (!user) return;
    if (isUuid(newSchoolId)) {
      toast.error("UUIDs are not permitted as School IDs.");
      return;
    }
    try {
      await supabase.auth.updateUser({
        data: { school_id: newSchoolId, org_id: newSchoolId, school_name: newSchoolName },
      });
      // Also update the database profile org_id and school_id securely if possible
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ org_id: newSchoolId, school_name: newSchoolName })
        .eq("user_id", user.id);

      localStorage.setItem("cymatic_school_id", newSchoolId);
      toast.success("School ID updated successfully!");
    } catch (err) {
      toast.error("Failed to update School ID");
    }
  };

  return { schoolId, schoolName, updateSchoolId };
}
