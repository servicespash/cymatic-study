import { useOrganization } from "@/hooks/useOrganization";

/**
 * @deprecated Prefer `useOrganization` which provides the single source of truth
 * for organization_id (e.g. CSE-2026-97EZ), org UUID, filtering, and administration.
 */
export function useUnifiedSchoolId() {
  const org = useOrganization();

  return {
    org_id: org.organizationId,
    schoolId: org.organizationId,
    schoolName: org.schoolName,
    updateOrgId: org.updateSchoolName,
    updateSchoolId: org.updateSchoolName,
    ...org,
  };
}
