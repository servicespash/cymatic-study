import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, CheckCircle2, Clock, Filter, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface StudentPerformanceTableProps {
  schoolId?: string | null;
}

export function StudentPerformanceTable({ schoolId }: StudentPerformanceTableProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStream, setSelectedStream] = useState("all");

  useEffect(() => {
    void fetchPerformanceRecords();
  }, [schoolId]);

  async function fetchPerformanceRecords() {
    setLoading(true);
    try {
      let query = supabase
        .from("project_submissions")
        .select(
          `
          id,
          student_id,
          status,
          project_data,
          total_competency_score,
          teacher_name,
          teacher_comments,
          updated_at,
          profiles:student_id (
            display_name,
            level,
            stream,
            org_id
          )
        `,
        )
        .order("updated_at", { ascending: false });

      if (schoolId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          schoolId,
        );
        if (isUuid) {
          query = query.eq("school_key", schoolId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.warn("Could not load project submissions gradebook:", error.message);
        // Fallback query without profiles join
        const { data: fallbackData } = await supabase
          .from("project_submissions")
          .select("*")
          .order("updated_at", { ascending: false });
        setSubmissions(fallbackData || []);
      } else {
        setSubmissions(data || []);
      }
    } catch (err) {
      console.error("Error loading performance records:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredSubmissions = submissions.filter((sub) => {
    const studentName = sub.profiles?.display_name || "Learner";
    const projectTitle =
      sub.project_data?.title || sub.project_data?.projectName || "Curriculum Project";
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projectTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const level = sub.profiles?.level || "Senior 1";
    const matchesClass =
      selectedClass === "all" || level.toLowerCase().includes(selectedClass.toLowerCase());

    const stream = sub.profiles?.stream || "East";
    const matchesStream =
      selectedStream === "all" || stream.toLowerCase() === selectedStream.toLowerCase();

    return matchesSearch && matchesClass && matchesStream;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search student or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl bg-secondary/40 border-border/70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[130px] bg-secondary/40 border-border/70">
              <SelectValue placeholder="Class Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="senior 1">Senior 1</SelectItem>
              <SelectItem value="senior 2">Senior 2</SelectItem>
              <SelectItem value="senior 3">Senior 3</SelectItem>
              <SelectItem value="senior 4">Senior 4</SelectItem>
              <SelectItem value="senior 5">Senior 5</SelectItem>
              <SelectItem value="senior 6">Senior 6</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStream} onValueChange={setSelectedStream}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[120px] bg-secondary/40 border-border/70">
              <SelectValue placeholder="Stream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="arts">Arts</SelectItem>
              <SelectItem value="east">East Stream</SelectItem>
              <SelectItem value="west">West Stream</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PERFORMANCE GRADEBOOK TABLE */}
      <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/40 text-[11px] uppercase font-mono tracking-wider">
            <TableRow>
              <TableHead className="font-bold">Learner &amp; Stream</TableHead>
              <TableHead className="font-bold">Project Title</TableHead>
              <TableHead className="font-bold">Class Level</TableHead>
              <TableHead className="font-bold">Competency Score</TableHead>
              <TableHead className="font-bold">Evaluator</TableHead>
              <TableHead className="font-bold text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <GraduationCap className="w-8 h-8 opacity-40 text-primary" />
                    <p className="font-semibold">
                      No student project records found matching your filter.
                    </p>
                    <p className="text-[11px] opacity-75">
                      Student marked papers and projects will appear here automatically.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((sub) => {
                const studentName = sub.profiles?.display_name || "Enrolled Learner";
                const level = sub.profiles?.level || "Senior 1";
                const stream = sub.profiles?.stream || "General";
                const title =
                  sub.project_data?.title ||
                  sub.project_data?.projectName ||
                  "NCDC Practical Project";
                const score = sub.total_competency_score || (sub.status === "verified" ? 2.5 : "-");
                const evaluator = sub.teacher_name || "Pending Faculty";
                const isVerified = sub.status === "verified" || sub.is_verified;

                return (
                  <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold">
                      <div>{studentName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Stream: {stream}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]">{title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-primary">
                      {score} / 3.0
                    </TableCell>
                    <TableCell className="text-muted-foreground">{evaluator}</TableCell>
                    <TableCell className="text-right">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Marked &amp; Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
