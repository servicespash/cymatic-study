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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, GraduationCap, Users, Shield, RefreshCw, Mail, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface DirectoryMember {
  id: string;
  user_id: string;
  display_name: string;
  level?: string;
  stream?: string;
  role?: string;
  created_at?: string;
}

interface UnifiedInstitutionalDirectoryProps {
  schoolId: string;
}

export function UnifiedInstitutionalDirectory({ schoolId }: UnifiedInstitutionalDirectoryProps) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ADMIN" | "TEACHER" | "STUDENT">("ALL");

  useEffect(() => {
    if (schoolId) {
      fetchDirectory();
    }
  }, [schoolId]);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, level, stream, role, created_at")
        .or(`org_id.eq.${schoolId},school_id.eq.${schoolId}`);

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error("Error fetching directory:", err);
      toast.error("Failed to load official institutional roster.");
    } finally {
      setLoading(false);
    }
  };

  // Filter roster based on search and role filters
  const filteredMembers = members.filter((m) => {
    const nameMatch = (m.display_name || "Scholar").toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (m.user_id || m.id || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    let roleType = "STUDENT";
    const rawRole = (m.role || "").toUpperCase();
    if (rawRole.includes("ADMIN")) {
      roleType = "ADMIN";
    } else if (rawRole.includes("TEACHER") || rawRole.includes("INSTRUCTOR")) {
      roleType = "TEACHER";
    }

    const matchesRole = activeFilter === "ALL" || roleType === activeFilter;
    return (nameMatch || idMatch) && matchesRole;
  });

  const getRoleBadge = (role?: string) => {
    const rawRole = (role || "").toUpperCase();
    if (rawRole.includes("ADMIN")) {
      return (
        <Badge className="bg-red-500/10 hover:bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
          <Shield className="h-3 w-3" />
          Administrator
        </Badge>
      );
    }
    if (rawRole.includes("TEACHER") || rawRole.includes("INSTRUCTOR") || rawRole.includes("FACULTY")) {
      return (
        <Badge className="bg-indigo-500/10 hover:bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
          <Users className="h-3 w-3" />
          Faculty Teacher
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/10 hover:bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
        <GraduationCap className="h-3 w-3" />
        Boarding Scholar
      </Badge>
    );
  };

  return (
    <Card className="border border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Users className="h-5.5 w-5.5 text-blue-400" />
            Official School Directory
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs mt-0.5">
            Synchronized directory roster of all active profiles associated with School ID: <span className="font-mono text-blue-400 font-bold">{schoolId}</span>
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDirectory}
            disabled={loading}
            className="h-9 border-white/10 bg-white/5 text-zinc-400 hover:text-white rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* FILTERS & SEARCH */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by name or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-xs h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(["ALL", "ADMIN", "TEACHER", "STUDENT"] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={activeFilter === filter ? "default" : "outline"}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-xl text-[10px] font-black uppercase tracking-wider h-8 ${
                  activeFilter === filter
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {filter === "ALL" ? "All" : filter}s
              </Button>
            ))}
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="rounded-2xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/5">
              <TableRow className="border-b border-white/5">
                <TableHead className="text-zinc-400 font-black uppercase tracking-wider text-[10px] py-4 px-6">Name</TableHead>
                <TableHead className="text-zinc-400 font-black uppercase tracking-wider text-[10px] py-4 px-6">Role / Classification</TableHead>
                <TableHead className="text-zinc-400 font-black uppercase tracking-wider text-[10px] py-4 px-6">Cohort / Class</TableHead>
                <TableHead className="text-zinc-400 font-black uppercase tracking-wider text-[10px] py-4 px-6">Registry ID</TableHead>
                <TableHead className="text-zinc-400 font-black uppercase tracking-wider text-[10px] py-4 px-6">Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-zinc-600">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Querying registry database...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-zinc-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-bold text-white">No active members found</p>
                      <p className="text-xs text-zinc-500">
                        Ask teachers and student cohorts to register using your unique School ID to link them dynamically to this dashboard.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <TableCell className="py-4 px-6 font-bold text-white text-xs">
                      {member.display_name || "Scholar"}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {getRoleBadge(member.role)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-zinc-400 text-xs">
                      {member.level ? (
                        <span className="font-bold text-blue-400">
                          {member.level} {member.stream || ""}
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic">N/A (Staff)</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-zinc-500 font-mono text-[11px]">
                      {member.user_id || member.id}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-zinc-500 text-xs">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : "Just now"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple helper icon loader
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
