import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";

export function TeacherApprovalTable() {
  const { schoolId } = useUserRole();
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchPendingTeachers();
    }
  }, [schoolId]);

  async function fetchPendingTeachers() {
    setLoading(true);
    // Join with public.users to get email and verification status
    // Use any cast to bypass missing relationship types
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select(`
        *,
        users:user_id (
          email,
          is_verified
        )
      `)
      .eq("org_id", schoolId)
      .eq("role", "teacher");

    if (error) {
      console.error("Error fetching pending teachers:", error);
      toast.error("Failed to load pending teachers");
    } else {
      // Filter manually if the join doesn't support nested filtering reliably on all versions
      const filtered = (data || []).filter((p: any) => p.users?.is_verified === false);
      setPendingTeachers(filtered);
    }
    setLoading(false);
  }

  async function handleApprove(userId: string) {
    // Update verification status in the users table
    const { error } = await (supabase as any)
      .from("users")
      .update({ is_verified: true })
      .eq("id", userId);

    if (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve teacher");
    } else {
      toast.success("Teacher approved successfully");
      fetchPendingTeachers();
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending Teacher Verifications</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingTeachers.map((teacher) => (
            <TableRow key={teacher.user_id}>
              <TableCell>{teacher.display_name || teacher.full_name || "N/A"}</TableCell>
              <TableCell>{teacher.users?.email || teacher.email || "N/A"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleApprove(teacher.user_id)}>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
