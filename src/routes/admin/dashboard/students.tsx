import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentMatrix } from "@/components/admin/StudentMatrix";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export const Route = createFileRoute("/admin/dashboard/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const {
    orgId,
    organizationId,
    schoolName,
    filterByOrganization,
    loading: orgLoading,
  } = useOrganization();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!orgLoading) {
      loadStudents();
    }
  }, [orgId, organizationId, schoolName, orgLoading]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      let stdData: any[] = [];
      let query = supabase.from("profiles").select("id, user_id, display_name, org_id, school_name, role");
      
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId?.trim() || "");

      if (orgId) {
        if (isUuid) {
           query = query.eq("org_id", orgId);
        } else {
           query = query.eq("school_name", schoolName);
        }
      } else if (schoolName) {
        query = query.ilike("school_name", `%${schoolName}%`);
      }

      const res = await query;
      if (res.error) throw res.error;
      stdData = res.data?.map((s) => ({ ...s, user_id: s.user_id || s.id, org_id: s.org_id })) || [];

      // Filter with single source of truth helper
      const matchedProfiles = filterByOrganization(stdData);

      let subData: any[] = [];
      try {
        let subQuery = (supabase.from("project_submissions") as any).select(
          "student_id, total_competency_score, school_key",
        );
        if (organizationId) {
          subQuery = subQuery.eq("school_key", organizationId);
        }
        const res = await subQuery;
        if (!res.error && res.data) {
          subData = res.data;
        }
      } catch (e) {
        console.warn("Could not load submissions for scores", e);
      }

      if (matchedProfiles.length > 0) {
        const mappedStudents = matchedProfiles
          .filter((s: any) => s.role === "student" || s.role === "student_monitor")
          .map((s: any) => {
            const studentSubs =
              subData?.filter((sub: any) => sub.student_id === (s.user_id || s.id)) || [];
            const gradedSubs = studentSubs.filter(
              (sub: any) =>
                sub.total_competency_score !== null && sub.total_competency_score !== undefined,
            );
            const totalScore = gradedSubs.reduce(
              (acc: number, sub: any) => acc + (sub.total_competency_score || 0),
              0,
            );
            const avgScore =
              gradedSubs.length > 0 ? Math.round(totalScore / gradedSubs.length) : 75;

            return {
              user_id: s.user_id || s.id,
              display_name: s.display_name || "Scholar",
              role: s.role || "student",
              level: s.level || "S1",
              stream: s.stream || "Stream A",
              org_id: s.org_id || s.school_id || organizationId,
              school_name: s.school_name || schoolName,
              avgScore,
              submissionCount: studentSubs.length || 0,
            };
          });
        setStudents(mappedStudents);
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error("Error mapping students:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <StudentMatrix
        students={students}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setInspectedStudent={() => {}}
        onRefresh={loadStudents}
        currentOrgId={orgId}
      />
    </div>
  );
}
