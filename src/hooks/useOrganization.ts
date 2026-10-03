import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getSchoolShortCode,
  generateNcdcBoardingSchoolId,
  validateOrgId,
} from "@/lib/school-id-validator";

const isUUID = (val?: string | null): boolean =>
  Boolean(
    val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()),
  );

export interface UseOrganizationReturn {
  // Identity
  organizationId: string; // The canonical human-readable ID (e.g. "CSE-2026-97EZ")
  orgId: string | null; // Database UUID (foreign key in PostgreSQL)
  organizationUuid: string | null; // Alias for orgId
  schoolId: string; // Backward compatibility alias for organizationId
  schoolName: string; // Canonical Institution Name (e.g. "Cymatic Study Ecosystem")
  shortCode: string; // 2-5 letter uppercase acronym (e.g. "CSE")

  // Status & Role
  role: string;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isInstitutional: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  updateSchoolName: (newName: string) => Promise<void>;
  regenerateOrganizationId: () => Promise<string>;
  resyncMembers: (userIds: string[]) => Promise<number>;
  refetch: () => Promise<void>;

  // Filtering helpers
  filterByOrganization: <T extends Record<string, any>>(
    items: T[],
    options?: {
      idField?: string;
      nameField?: string;
      allowGlobal?: boolean;
    },
  ) => T[];
  matchesOrganization: (itemOrgId?: string | null, itemName?: string | null) => boolean;

  // Sharing & Invites
  studentInviteLink: string;
  teacherInviteLink: string;
  inviteMessage: string;
}

/**
 * Unified Organization Hook
 * Serves as the single source of truth for organization_id (e.g. 'CSE-2026-XXXX'),
 * school name, and relational org_id across all roles and pages.
 */
export function useOrganization(): UseOrganizationReturn {
  const {
    user,
    profile,
    organizationId: authOrgId,
    org_id: authOrgUuid,
    schoolName: authSchoolName,
    role: authRole,
    isAdmin: authIsAdmin,
    isTeacher: authIsTeacher,
    isStudent: authIsStudent,
    isInstitutional: authIsInstitutional,
    loading: authLoading,
    refreshProfile,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Resolve Canonical School Name
  const schoolName = useMemo(() => {
    let name =
      authSchoolName ||
      profile?.school_name ||
      user?.user_metadata?.school_name ||
      (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_name") : null);

    if (
      authIsAdmin &&
      (!name || name === "Your Institution" || name === "Uganda NCDC Boarding Institution")
    ) {
      name = "Cymatic Study Ecosystem";
    }
    return (name || "Cymatic Study Ecosystem").trim();
  }, [authSchoolName, profile?.school_name, user?.user_metadata?.school_name, authIsAdmin]);

  // 2. Derive Short Form Acronym from School Name (e.g. "Cymatic Study Ecosystem" -> "CSE")
  const shortCode = useMemo(() => {
    return getSchoolShortCode(schoolName);
  }, [schoolName]);

  // 3. Resolve Canonical Database UUID (relational foreign key)
  const orgId = useMemo(() => {
    let uuid =
      authOrgUuid ||
      profile?.org_id ||
      user?.user_metadata?.org_id ||
      user?.user_metadata?.organization_uuid ||
      (typeof window !== "undefined" ? localStorage.getItem("cymatic_org_uuid") : null);

    if (!isUUID(uuid)) {
      uuid = null;
    }
    return uuid;
  }, [authOrgUuid, profile?.org_id, user?.user_metadata]);

  // 4. Resolve Canonical Human-Readable Organization ID (e.g. "CSE-2026-97EZ")
  const organizationId = useMemo(() => {
    let candidate =
      authOrgId ||
      profile?.organization_id ||
      profile?.school_id ||
      user?.user_metadata?.organization_id ||
      user?.user_metadata?.school_id ||
      user?.user_metadata?.school_key ||
      (typeof window !== "undefined"
        ? localStorage.getItem("cymatic_org_id") || localStorage.getItem("cymatic_school_id")
        : null);

    // Reject UUIDs as public human IDs
    if (isUUID(candidate)) {
      candidate = null;
    }

    // Default for admins or missing: generate matching code with active shortCode
    if (!candidate) {
      candidate = generateNcdcBoardingSchoolId(schoolName);
    }

    return candidate;
  }, [authOrgId, profile?.organization_id, profile?.school_id, user?.user_metadata, schoolName]);

  // 5. Check Roles
  const userEmail = user?.email?.trim().toLowerCase();
  const isAdmin =
    authIsAdmin ||
    userEmail === "latifisabirye123@gmail.com" ||
    user?.user_metadata?.role === "admin" ||
    profile?.role === "admin";
  const isTeacher = !isAdmin && authIsTeacher;
  const isStudent = !isAdmin && !isTeacher;
  const isInstitutional =
    authIsInstitutional || Boolean(orgId) || Boolean(organizationId) || isAdmin;

  // 6. Action: Update School Name
  const updateSchoolName = useCallback(
    async (newName: string) => {
      const cleanName = newName.trim();
      if (!cleanName) {
        toast.error("School name cannot be blank.");
        return;
      }
      setLoading(true);
      setError(null);
      const toastId = toast.loading("Updating institutional name...");

      try {
        let currentUuid = orgId;

        if (currentUuid) {
          await supabase
            .from("organizations")
            .update({ name: cleanName, school_key: organizationId })
            .eq("id", currentUuid);
        } else {
          const newOrgUUID =
            typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
          const { data: createdOrg } = await supabase
            .from("organizations")
            .upsert({
              id: newOrgUUID,
              name: cleanName,
              school_key: organizationId,
              creator_user_id: user?.id,
              email: user?.email,
            })
            .select()
            .maybeSingle();

          if (createdOrg) {
            currentUuid = createdOrg.id;
          }
        }

        if (user?.id) {
          await (supabase as any)
            .from("profiles")
            .update({ school_name: cleanName, org_id: currentUuid })
            .eq("user_id", user.id);

          await supabase.auth.updateUser({
            data: {
              school_name: cleanName,
              organization_id: organizationId,
              school_id: organizationId,
              org_id: currentUuid,
            },
          });
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("cymatic_school_name", cleanName);
          if (currentUuid) localStorage.setItem("cymatic_org_uuid", currentUuid);
        }

        await refreshProfile();
        toast.success(`School name successfully updated to "${cleanName}"!`, { id: toastId });
      } catch (err: any) {
        console.error("Update school name failed:", err);
        setError(err?.message || "Failed to update school name");
        toast.error(err?.message || "Failed to update school name", { id: toastId });
      } finally {
        setLoading(false);
      }
    },
    [orgId, organizationId, user, refreshProfile],
  );

  // 7. Action: Regenerate Organization ID
  const regenerateOrganizationId = useCallback(async (): Promise<string> => {
    const code = getSchoolShortCode(schoolName);
    const newId = generateNcdcBoardingSchoolId(schoolName);

    setLoading(true);
    setError(null);
    const toastId = toast.loading(`Regenerating ${code} Organization ID...`);

    try {
      let currentUuid = orgId;

      if (!currentUuid && user?.id) {
        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id")
          .or(`creator_user_id.eq.${user.id},email.ilike.${userEmail || "none"}`)
          .maybeSingle();
        if (existingOrg) currentUuid = existingOrg.id;
      }

      if (currentUuid) {
        await supabase
          .from("organizations")
          .update({
            school_key: newId,
            name: schoolName,
          })
          .eq("id", currentUuid);
      } else {
        const newOrgUUID =
          typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
        const { data: createdOrg } = await supabase
          .from("organizations")
          .upsert({
            id: newOrgUUID,
            name: schoolName,
            school_key: newId,
            creator_user_id: user?.id,
            email: user?.email,
          })
          .select()
          .maybeSingle();

        if (createdOrg) currentUuid = createdOrg.id;
      }

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: {
          school_id: newId,
          organization_id: newId,
          school_name: schoolName,
          role: isAdmin ? "admin" : profile?.role || "student",
          org_id: currentUuid,
        },
      });

      if (user?.id) {
        await (supabase as any)
          .from("profiles")
          .update({
            school_name: schoolName,
            org_id: currentUuid,
            role: isAdmin ? "admin" : profile?.role || "student",
          })
          .eq("user_id", user.id);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("cymatic_org_id", newId);
        localStorage.setItem("cymatic_school_id", newId);
        localStorage.setItem("cymatic_school_name", schoolName);
        if (currentUuid) localStorage.setItem("cymatic_org_uuid", currentUuid);
      }

      await refreshProfile();
      toast.success(`Organization ID successfully rotated to ${newId}!`, {
        id: toastId,
        description: `Short form "${code}" embedded. New members will link to this ID.`,
      });

      return newId;
    } catch (err: any) {
      console.error("Regenerate organization ID failed:", err);
      setError(err?.message || "Failed to regenerate organization ID");
      toast.error(err?.message || "Failed to regenerate organization ID", { id: toastId });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [schoolName, orgId, user, userEmail, isAdmin, profile?.role, refreshProfile]);

  // 8. Action: Resync Selected Members
  const resyncMembers = useCallback(
    async (userIds: string[]): Promise<number> => {
      if (!userIds || userIds.length === 0) {
        toast.info("No members selected for resync.");
        return 0;
      }

      setLoading(true);
      setError(null);
      const toastId = toast.loading(`Resyncing ${userIds.length} members to ${organizationId}...`);

      try {
        const { error: batchErr } = await (supabase as any)
          .from("profiles")
          .update({
            org_id: orgId || undefined,
            school_name: schoolName,
          })
          .in("user_id", userIds);

        if (batchErr) throw batchErr;

        // Also update authorized_roles table
        try {
          for (const uid of userIds) {
            await supabase.from("authorized_roles").upsert(
              {
                organization_id: organizationId,
                assigned_by: user?.id,
              },
              { onConflict: "organization_id,email" },
            );
          }
        } catch (authErr) {
          console.warn("authorized_roles resync notice:", authErr);
        }

        toast.success(`Successfully resynced ${userIds.length} members to ${organizationId}!`, {
          id: toastId,
          description: `All selected members are now verified under ${schoolName}.`,
        });

        return userIds.length;
      } catch (err: any) {
        console.error("Resync members error:", err);
        setError(err?.message || "Failed to resync members");
        toast.error(err?.message || "Failed to resync members", { id: toastId });
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [organizationId, orgId, schoolName, user?.id],
  );

  // 9. Match helper
  const matchesOrganization = useCallback(
    (itemOrgId?: string | null, itemName?: string | null): boolean => {
      if (!itemOrgId && !itemName) return false;

      const normHumanId = (organizationId || "").trim().toLowerCase();
      const normUuid = (orgId || "").trim().toLowerCase();
      const normName = (schoolName || "").trim().toLowerCase();

      if (itemOrgId) {
        const itemVal = itemOrgId.trim().toLowerCase();
        if (normHumanId && itemVal === normHumanId) return true;
        if (normUuid && itemVal === normUuid) return true;
      }

      if (itemName) {
        const itemSchool = itemName.trim().toLowerCase();
        if (
          normName &&
          (itemSchool === normName ||
            itemSchool.includes(normName) ||
            normName.includes(itemSchool))
        ) {
          return true;
        }
      }

      return false;
    },
    [organizationId, orgId, schoolName],
  );

  // 10. Filter helper
  const filterByOrganization = useCallback(
    <T extends Record<string, any>>(
      items: T[],
      options?: {
        idField?: string;
        nameField?: string;
        allowGlobal?: boolean;
      },
    ): T[] => {
      if (!items || items.length === 0) return [];

      const idField = options?.idField || "organization_id";
      const nameField = options?.nameField || "school_name";
      const allowGlobal = options?.allowGlobal ?? false;

      return items.filter((item) => {
        const itemOrgVal =
          item[idField] || item["org_id"] || item["school_key"] || item["school_id"] || null;

        const itemNameVal = item[nameField] || item["school"] || null;

        if (allowGlobal && !itemOrgVal && !itemNameVal) {
          return true;
        }

        return matchesOrganization(itemOrgVal, itemNameVal);
      });
    },
    [matchesOrganization],
  );

  // 11. Invitation Links & Messages
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://study.cymatichub.xyz";
  const studentInviteLink = `${origin}/signup?school_id=${encodeURIComponent(organizationId)}&role=join-student`;
  const teacherInviteLink = `${origin}/signup?school_id=${encodeURIComponent(organizationId)}&role=join-teacher`;

  const inviteMessage = `Join "${schoolName}" on Cymatic Study.\n\nOrganization ID: ${organizationId}\n\nClick link to join automatically:\n${studentInviteLink}`;

  return {
    organizationId,
    orgId,
    organizationUuid: orgId,
    schoolId: organizationId,
    schoolName,
    shortCode,
    role: authRole,
    isAdmin,
    isTeacher,
    isStudent,
    isInstitutional,
    loading: authLoading || loading,
    error,
    updateSchoolName,
    regenerateOrganizationId,
    resyncMembers,
    refetch: refreshProfile,
    filterByOrganization,
    matchesOrganization,
    studentInviteLink,
    teacherInviteLink,
    inviteMessage,
  };
}
