import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher");

      if (schoolId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(schoolId);
        if (isUuid) {
          query = query.eq("org_id", schoolId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching teachers list:", error);
        toast.error("Failed to load teachers");
      } else {
        const flattened = (data || []).map((p: any) => ({
          ...p,
          email: p.email || `${p.display_name?.toLowerCase().replace(/\s+/g, "") || "teacher"}@school.edu`,
          is_verified: p.is_verified ?? true,
        }));
        setTeachers(flattened);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTeachers:", err);
    } finally {
      setLoading(false);
    }
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
