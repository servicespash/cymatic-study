import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  Copy,
  CheckCircle2,
  Share2,
  Search,
  Building2,
  Trash2,
  Mail,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateStudentRegistryCode } from "@/lib/auth-router";
import { useRegistryMembers } from "@/hooks/useRegistryMembers";

export interface RegistryMember {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  level?: string; // S1 - S6 for students
  stream?: string;
  subject?: string; // For teachers
  registryCode: string;
  status: "active" | "invited";
  created_at: string;
}

export function InstitutionalRegistryModule() {
  const { user, profile } = useAuth();
  const currentSchoolId =
    profile?.school_id ||
    profile?.org_id ||
    user?.user_metadata?.school_id ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : "") ||
    "SCH-UG-2026";

  const { members: roster, loading: rosterLoading } = useRegistryMembers(currentSchoolId);

  const schoolName = profile?.school_name || "Uganda NCDC Boarding Institution";

  const [activeFilter, setActiveFilter] = useState<"ALL" | "teacher" | "student">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);

  const [memberType, setMemberType] = useState<"teacher" | "student">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("S1");
  const [stream, setStream] = useState("");
  const [subject, setSubject] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Generate official secure invite / binding link
  const generateOfficialInviteLink = (targetRole: string, targetEmail?: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://app.cymaticstudy.ug";
    const cleanId = encodeURIComponent(currentSchoolId.trim());
    let link = `${origin}/signup?school_id=${cleanId}&role=${targetRole}`;
    if (targetEmail) {
      link += `&email=${encodeURIComponent(targetEmail.trim())}`;
    }
    return link;
  };

  // Add member to Supabase
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please provide both name and valid email address.");
      return;
    }

    setIsAdding(true);
    const toastId = toast.loading("Adding member to Institutional Registry...");

    try {
      const uniqueCode = generateStudentRegistryCode(
        currentSchoolId,
        Math.random().toString(36).slice(2, 6),
      );

      const { error: dbErr } = await supabase.from("registry_members").insert({
        org_id: currentSchoolId,
        full_name: fullName.trim(),
        email: email.trim(),
        role: memberType,
        level: memberType === "student" ? level : null,
        registry_code: uniqueCode,
        status: "invited",
      });

      if (dbErr) throw dbErr;

      const inviteLink = generateOfficialInviteLink(memberType, email);
      setLastGeneratedLink(inviteLink);

      setIsAdding(false);
      setFullName("");
      setEmail("");

      toast.success(
        `Added ${fullName.trim()} as ${memberType === "teacher" ? "Faculty Teacher" : `Student (${level})`}!`,
        {
          id: toastId,
          description: `Official registry code ${uniqueCode} generated. Share binding link below.`,
        },
      );
    } catch (err) {
      setIsAdding(false);
      toast.error("Failed to register member.", { id: toastId });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    const { error } = await supabase.from("registry_members").delete().eq("id", id);
    if (error) {
      toast.error(`Failed to remove ${name}.`);
    } else {
      toast.info(`Removed ${name} from Institutional Registry.`);
    }
  };

  const filteredRoster = roster.filter((m) => {
    const matchesRole = activeFilter === "ALL" || m.role === activeFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.registryCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/30 to-black border border-blue-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white font-bold text-[10px] uppercase">
              Institutional Registry Command
            </Badge>
            <span className="text-xs font-mono text-blue-400 font-bold">
              School ID: {currentSchoolId}
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-400" />
            {schoolName} Member Management
          </h2>
          <p className="text-xs text-zinc-400">
            Manually register teachers and student cohorts (S1-S6). Generate secure school ID
            binding invite links for automated onboarding.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() =>
              copyToClipboard(generateOfficialInviteLink("student"), "General Student Binding Link")
            }
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-600 hover:text-white text-xs"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Copy Student Join Link
          </Button>
          <Button
            onClick={() =>
              copyToClipboard(generateOfficialInviteLink("teacher"), "Faculty Teacher Binding Link")
            }
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Copy Teacher Join Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MANUAL MEMBER ADDITION FORM (5 COLS) */}
        <Card className="lg:col-span-5 border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-400" /> Register New Member
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Generates an official registry code and school binding token.
            </p>
          </div>

          <form onSubmit={handleAddMember} className="space-y-4">
            {/* ROLE SELECTOR */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Member Role</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={memberType === "student" ? "default" : "outline"}
                  onClick={() => setMemberType("student")}
                  className={
                    memberType === "student"
                      ? "bg-blue-600 text-white font-bold text-xs"
                      : "border-white/10 bg-white/5 text-zinc-400 text-xs"
                  }
                >
                  <GraduationCap className="h-4 w-4 mr-1.5" /> Student (S1-S6)
                </Button>
                <Button
                  type="button"
                  variant={memberType === "teacher" ? "default" : "outline"}
                  onClick={() => setMemberType("teacher")}
                  className={
                    memberType === "teacher"
                      ? "bg-blue-600 text-white font-bold text-xs"
                      : "border-white/10 bg-white/5 text-zinc-400 text-xs"
                  }
                >
                  <Users className="h-4 w-4 mr-1.5" /> Teacher / Faculty
                </Button>
              </div>
            </div>

            {/* NAME FIELD */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Full Legal Name</Label>
              <Input
                placeholder={memberType === "student" ? "e.g., Kato Paul" : "e.g., Dr. Mukasa Alex"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-white/5 border-white/10 text-xs text-white"
                required
              />
            </div>

            {/* EMAIL FIELD */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Email Address</Label>
              <Input
                type="email"
                placeholder="e.g., paul.kato@school.ac.ug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-xs text-white"
                required
              />
            </div>

            {/* STUDENT SPECIFIC FIELDS */}
            {memberType === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300">Class Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-xs text-white">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      <SelectItem value="S1">Senior 1 (S1)</SelectItem>
                      <SelectItem value="S2">Senior 2 (S2)</SelectItem>
                      <SelectItem value="S3">Senior 3 (S3)</SelectItem>
                      <SelectItem value="S4">Senior 4 (S4)</SelectItem>
                      <SelectItem value="S5">Senior 5 (S5)</SelectItem>
                      <SelectItem value="S6">Senior 6 (S6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300">Stream / Class</Label>
                  <Input
                    placeholder="e.g., Stream A / Science"
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="bg-white/5 border-white/10 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* TEACHER SPECIFIC FIELDS */}
            {memberType === "teacher" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-300">
                  Primary Subject Specialization
                </Label>
                <Input
                  placeholder="e.g., Physics, Chemistry, Pure Math"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-white/5 border-white/10 text-xs text-white"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isAdding}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs py-5 shadow-lg shadow-blue-600/30 mt-2"
            >
              <ShieldCheck className="h-4 w-4 mr-2" /> Add & Issue Registry Code
            </Button>
          </form>

          {/* GENERATED LINK HIGHLIGHT */}
          {lastGeneratedLink && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-blue-400">
                <span>Direct Binding Invitation Link</span>
                <Badge className="bg-blue-600 text-white text-[9px]">READY</Badge>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 break-all bg-black/60 p-2 rounded border border-white/5">
                {lastGeneratedLink}
              </p>
              <Button
                size="sm"
                onClick={() => copyToClipboard(lastGeneratedLink, "Official Binding Link")}
                className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Binding Link
              </Button>
            </div>
          )}
        </Card>

        {/* ROSTER MANAGEMENT TABLE (7 COLS) */}
        <Card className="lg:col-span-7 border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" /> Institutional Registry Directory
              </h3>
              <p className="text-xs text-zinc-400">
                Official register of scholars and faculty linked to School ID:{" "}
                <span className="font-mono text-blue-400">{currentSchoolId}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={activeFilter === "ALL" ? "default" : "outline"}
                onClick={() => setActiveFilter("ALL")}
                className="text-[10px] h-7 px-2.5"
              >
                All ({roster.length})
              </Button>
              <Button
                size="sm"
                variant={activeFilter === "teacher" ? "default" : "outline"}
                onClick={() => setActiveFilter("teacher")}
                className="text-[10px] h-7 px-2.5"
              >
                Teachers ({roster.filter((r) => r.role === "teacher").length})
              </Button>
              <Button
                size="sm"
                variant={activeFilter === "student" ? "default" : "outline"}
                onClick={() => setActiveFilter("student")}
                className="text-[10px] h-7 px-2.5"
              >
                Students ({roster.filter((r) => r.role === "student").length})
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Filter by name, email, or registry code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-xs"
            />
          </div>

          <div className="border border-white/5 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5 border-white/5">
                <TableRow className="border-white/5 text-[10px] uppercase text-zinc-400">
                  <TableHead>Member Name</TableHead>
                  <TableHead>Role & Level</TableHead>
                  <TableHead>Registry Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoster.map((m: any) => {
                  const inviteLink = generateOfficialInviteLink(m.role, m.email);
                  return (
                    <TableRow key={m.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-bold text-white text-xs">
                        <div>
                          <p>{m.full_name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono font-normal">
                            {m.email}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {m.role === "teacher" ? (
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px]">
                            Teacher • {m.subject || "Faculty"}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">
                            Student • {m.level || "S1"} ({m.stream || "A"})
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-[11px] text-blue-300 font-bold">
                        {m.registry_code}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            m.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px]"
                          }
                        >
                          {m.status === "active" ? "ACTIVE" : "INVITED"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(inviteLink, `Invite link for ${m.full_name}`)
                            }
                            title="Copy Official Binding Link"
                            className="h-7 w-7 text-zinc-400 hover:text-white"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteMember(m.id, m.full_name)}
                            title="Remove from Registry"
                            className="h-7 w-7 text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredRoster.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-zinc-500 italic text-xs"
                    >
                      No matching records found in institutional registry.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
