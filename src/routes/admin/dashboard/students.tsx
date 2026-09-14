import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentMatrix } from "@/components/admin/StudentMatrix";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/dashboard/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentOrgId = profile?.organization_id || user?.user_metadata?.school_id || "";

  useEffect(() => {
    if (currentOrgId) {
      loadStudents();
    }
  }, [currentOrgId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      let stdData: any[] = [];
      try {
        const res = await (supabase.from("student_records") as any)
          .select("id, user_id, display_name, org_id, school_name, role")
          .eq("org_id", currentOrgId);
        if (res.error) throw res.error;
        stdData = res.data || [];
      } catch (e: any) {
        console.error("Error loading student records:", e);
        // Fallback to profiles if student_records is missing
        const res = await supabase.from("profiles")
          .select("id, display_name, school_id, school_name, role")
          .eq("school_id", currentOrgId);
        stdData = res.data?.map(s => ({...s, user_id: s.id, org_id: s.school_id})) || [];
      }

      let subData: any[] = [];
      try {
        const res = await (supabase.from("project_submissions") as any)
          .select("student_id, total_competency_score, school_key")
          .eq("school_key", currentOrgId);
        if (!res.error && res.data) {
          subData = res.data;
        }
      } catch (e) {
        console.warn("Could not load submissions for scores", e);
      }

      if (stdData.length > 0) {
        const mappedStudents = stdData
          .filter((s: any) => s.role === "student" || s.role === "student_monitor")
          .map((s: any) => {
            const studentSubs = subData?.filter((sub: any) => sub.student_id === (s.user_id || s.id)) || [];
            const gradedSubs = studentSubs.filter((sub: any) => sub.total_competency_score !== null && sub.total_competency_score !== undefined);
            const totalScore = gradedSubs.reduce((acc: number, sub: any) => acc + (sub.total_competency_score || 0), 0);
            const avgScore = gradedSubs.length > 0 ? Math.round(totalScore / gradedSubs.length) : 75;

            return {
              user_id: s.user_id || s.id,
              display_name: s.display_name || "Scholar",
              role: s.role || "student",
              level: s.level || "S1",
              stream: s.stream || "Stream A",
              org_id: s.org_id || s.school_id,
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
        currentOrgId={currentOrgId}
      />
    </div>
  );
}
