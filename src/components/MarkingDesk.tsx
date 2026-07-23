import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  AlertCircle,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Submission {
  id: string;
  student_user_id: string;
  student_email: string;
  student_id: string;
  status: string;
  project_data: any;
  created_at: string;
  updated_at: string;
  awarded_score: number | null;
  awarded_grade: string | null;
  is_verified: boolean;
  profiles?: {
    display_name: string | null;
    level: string | null;
  };
}

export function MarkingDesk() {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");

  useEffect(() => {
    if (!user || !profile) return;
    fetchSubmissions();
  }, [user, profile]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("project_submissions")
        .select(
          `
          *,
          profiles:student_user_id (
            display_name,
            level
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (profile?.org_id) {
        query = query.eq("org_id", profile.org_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions((data as any[]) || []);
    } catch (error: any) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.student_email?.toLowerCase().includes(search.toLowerCase()) ||
      s.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "pending") return matchesSearch && !s.is_verified;
    if (filter === "verified") return matchesSearch && s.is_verified;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            Teacher Marking Desk
          </h2>
          <p className="text-zinc-500 text-sm">Review and verify student project submissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            {submissions.filter((s) => !s.is_verified).length} Pending Verification
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by student name, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
            className={filter === "all" ? "bg-blue-600" : "border-zinc-800 text-zinc-400"}
          >
            All
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            size="sm"
            className={filter === "pending" ? "bg-blue-600" : "border-zinc-800 text-zinc-400"}
          >
            Pending
          </Button>
          <Button
            variant={filter === "verified" ? "default" : "outline"}
            onClick={() => setFilter("verified")}
            size="sm"
            className={filter === "verified" ? "bg-blue-600" : "border-zinc-800 text-zinc-400"}
          >
            Verified
          </Button>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="border-zinc-800">
              <TableRow className="hover:bg-transparent border-zinc-800 text-zinc-500 uppercase text-[10px] font-bold">
                <TableHead>Student</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                      <Clock className="h-4 w-4 animate-spin" />
                      Loading submissions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-zinc-500 italic">
                    No submissions found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((s) => (
                  <TableRow key={s.id} className="border-zinc-800 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-100">
                          {s.profiles?.display_name || "Unknown Student"}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {s.student_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-zinc-700 bg-zinc-900 text-zinc-300"
                      >
                        {s.profiles?.level || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {s.is_verified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none flex items-center w-fit gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-500 border-none flex items-center w-fit gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.awarded_score !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-400">
                            {s.awarded_score}%
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-blue-500/30 text-blue-300"
                          >
                            {s.awarded_grade}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">Not graded</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        onClick={() => (window.location.href = `/project/evaluate/${s.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {s.is_verified ? "Review" : "Mark"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-800 bg-zinc-950/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-400" />
              Teacher Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500 space-y-2 leading-relaxed">
            <p>1. Review the student's project against the NCDC competency criteria.</p>
            <p>2. Use the "Mark" action to award scores across the 4 phases of the project.</p>
            <p>
              3. Provide constructive feedback to help the student improve their curriculum mastery.
            </p>
            <p>
              4. Verified marks are instantly visible to the student and recorded in the
              institutional ledger.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Student Support Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500 space-y-2 leading-relaxed">
            <p>Encourage your students to use the AI Tutor for preliminary guidance.</p>
            <p>Monitor the chat engagement to identify students struggling with specific topics.</p>
            <p>
              You can initiate a direct mentor chat if a project shows significant curriculum gaps.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
