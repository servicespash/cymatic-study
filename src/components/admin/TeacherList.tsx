import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function TeacherList() {
  const { schoolId } = useUserRole();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchTeachers();
    }
  }, [schoolId]);

  async function fetchTeachers() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("user_id, display_name, email, role, is_verified")
      .eq("org_id", schoolId)
      .eq("role", "teacher");

    if (error) {
      console.error("Error fetching teachers list:", error);
      toast.error("Failed to load teachers");
    } else {
      setTeachers(data || []);
    }
    setLoading(false);
  }

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Teachers Directory</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher.user_id}>
              <TableCell>{teacher.display_name || "N/A"}</TableCell>
              <TableCell>{teacher.email || "N/A"}</TableCell>
              <TableCell className="capitalize">{teacher.role}</TableCell>
              <TableCell>
                <Badge variant={teacher.is_verified ? "default" : "secondary"}>
                  {teacher.is_verified ? "Verified" : "Pending"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {teachers.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No teachers found for this institution.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
