import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentRecord } from "@/types/admin";
import { MoreVertical, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentMatrixProps {
  students: StudentRecord[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setInspectedStudent: (student: StudentRecord | null) => void;
  onRefresh: () => void;
  currentOrgId: string;
}

export const StudentMatrix = ({ students, loading, searchTerm, setSearchTerm, setInspectedStudent, onRefresh, currentOrgId }: StudentMatrixProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Students</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <Table>
        <TableHeader className="border-white/5">
          <TableRow className="hover:bg-transparent border-white/5 text-zinc-500 uppercase text-[10px] font-bold">
            <TableHead>Student Name</TableHead>
            <TableHead>Class & Stream</TableHead>
            <TableHead>Bound School ID</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead>Avg Score</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell colSpan={6} className="py-4">
                    <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-zinc-500 italic">No students registered.</TableCell>
            </TableRow>
          ) : (
            students.map((s) => (
              <TableRow key={s.user_id} className="border-border hover:bg-muted/40">
                <TableCell className="font-bold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30 flex items-center justify-center font-black text-xs uppercase">
                    {s.display_name.slice(0, 2)}
                  </div>
                  {s.display_name}
                </TableCell>
                <TableCell>
                  <Badge className="bg-blue-600/10 text-blue-400 border-none shrink-0 text-[10px] py-0.5">
                    {s.level} - {s.stream || "Stream A"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {currentOrgId || "UNLINKED"}
                </TableCell>
                <TableCell className="font-bold text-foreground">
                  {s.submissionCount || 0}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={s.avgScore || 75} className="h-1.5 w-16 bg-muted" />
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {s.avgScore || 75}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={s.role || "student"}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        const toastId = toast.loading(`Assigning role ${newRole.toUpperCase()}...`);
                        try {
                          const { error } = await supabase
                            .from("profiles")
                            .update({ role: newRole })
                            .eq("id", s.user_id);
                          if (error) throw error;
                          toast.success(`Assigned role ${newRole.toUpperCase()}!`, { id: toastId });
                          onRefresh();
                        } catch (err: any) {
                          toast.error(`Failed to assign: ${err.message}`, { id: toastId });
                        }
                      }}
                      className="bg-muted text-foreground text-[10px] font-black uppercase tracking-tight py-1 px-2.5 rounded-full outline-none border border-border cursor-pointer hover:bg-muted/80 transition-colors"
                    >
                      <option value="student">Student</option>
                      <option value="student_monitor">Student Monitor</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInspectedStudent(s)}
                      className="border-blue-600/30 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-xs shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
