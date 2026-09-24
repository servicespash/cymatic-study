import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const isUuid = (val: string | null | undefined): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export function useUnifiedSchoolId() {
  const { profile, org_id: userRoleOrgId, isAdmin } = useUserRole();
  const { user } = useAuth();

  const rawOrgId =
    profile?.org_id ||
    userRoleOrgId ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_org_id") : null) ||
    "";

  const org_id = isUuid(rawOrgId) || !rawOrgId ? "" : rawOrgId;

  const schoolName = profile?.school_name || user?.user_metadata?.school_name || "";

  const updateOrgId = async (newOrgId: string, newSchoolName: string) => {
    if (!user) return;
    if (!isAdmin) {
      toast.error("Unauthorized: Only admins can update institutional settings.");
      return;
    }
    if (isUuid(newOrgId)) {
      toast.error("UUIDs are not permitted as Organizational IDs.");
      return;
    }
    try {
      await supabase.auth.updateUser({
        data: { org_id: newOrgId, school_name: newSchoolName },
      });
      // Also update the database profile org_id securely
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ org_id: newOrgId, school_name: newSchoolName })
        .eq("user_id", user.id);

      localStorage.setItem("cymatic_org_id", newOrgId);
      toast.success("Institutional ID updated successfully!");
    } catch (err) {
      toast.error("Failed to update Institutional ID");
    }
  };

  return { org_id, schoolId: org_id, schoolName, updateOrgId, updateSchoolId: updateOrgId };
}
