import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Building2,
  RefreshCw,
  Copy,
  Check,
  Users,
  ShieldCheck,
  Share2,
  UserCheck,
  Save,
  Sparkles,
  ExternalLink,
  CheckSquare,
  Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@/hooks/useOrganization";
import {
  getSchoolShortCode,
  generateNcdcBoardingSchoolId,
  validateOrgId,
} from "@/lib/school-id-validator";

interface MemberItem {
  id: string;
  user_id: string;
  display_name: string | null;
  role: string | null;
  school_name: string | null;
  org_id: string | null;
  created_at?: string;
  selected?: boolean;
}

export function AdminSettings() {
  const { user, profile } = useAuth();
  const org = useOrganization();

  const [currentSchoolName, setCurrentSchoolName] = useState(org.schoolName);
  const [activeOrgId, setActiveOrgId] = useState(org.organizationId);
  const [savingName, setSavingName] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedStudentLink, setCopiedStudentLink] = useState(false);
  const [copiedTeacherLink, setCopiedTeacherLink] = useState(false);

  useEffect(() => {
    if (org.schoolName) setCurrentSchoolName(org.schoolName);
    if (org.organizationId) setActiveOrgId(org.organizationId);
  }, [org.schoolName, org.organizationId]);

  // Members state for resync
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  // Dynamic short code derived from current typed school name
  const currentShortCode = getSchoolShortCode(currentSchoolName);

  // Load members on mount or when org updates
  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const orgUUID = org.orgId || profile?.org_id;
      let query = supabase
        .from("profiles")
        .select("id, user_id, display_name, role, school_name, org_id, created_at");

      if (orgUUID) {
        query = query.or(`org_id.eq.${orgUUID},school_name.ilike.%${currentSchoolName.trim()}%`);
      } else {
        query = query.ilike("school_name", `%${currentSchoolName.trim()}%`);
      }

      let { data, error } = await query.limit(50);
      if (error || !data || data.length === 0) {
        // Fallback: check all recent members so the admin can discover and resync them
        const { data: recent } = await supabase
          .from("profiles")
          .select("id, user_id, display_name, role, school_name, org_id, created_at")
          .limit(30);
        if (recent && recent.length > 0) {
          data = recent;
        }
      }

      if (data && data.length > 0) {
        setMembers(
          data.map((m: any) => ({
            ...m,
            selected: true, // Default to selected for convenience
          })),
        );
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.warn("Notice loading institutional members for resync:", err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [org.orgId, profile?.org_id, currentSchoolName]);

  // 1. Save School Name
  const handleSaveSchoolName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchoolName.trim()) {
      toast.error("School name cannot be blank.");
      return;
    }

    setSavingName(true);
    try {
      await org.updateSchoolName(currentSchoolName.trim());
    } finally {
      setSavingName(false);
    }
  };

  // 2. Regenerate Institution ID based on school name short form (e.g. CSE-2026-XXXX)
  const handleRegenerateId = async () => {
    setRegenerating(true);
    try {
      const newId = await org.regenerateOrganizationId();
      setActiveOrgId(newId);
    } catch (err: any) {
      console.error("Regeneration exception:", err);
    } finally {
      setRegenerating(false);
    }
  };

  // 3. Resync Selected Members to the current Institution ID & Name
  const handleResyncMembers = async () => {
    const selectedMembers = members.filter((m) => m.selected);
    if (selectedMembers.length === 0) {
      toast.info("No members selected to resync. Check at least one member below.");
      return;
    }

    setResyncing(true);
    try {
      const targetUserIds = selectedMembers.map((m) => m.user_id).filter(Boolean);
      await org.resyncMembers(targetUserIds);
      await loadMembers();
    } finally {
      setResyncing(false);
    }
  };

  const toggleSelectMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = members.every((m) => m.selected);
    setMembers((prev) => prev.map((m) => ({ ...m, selected: !allSelected })));
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://study.cymatichub.xyz";
  const studentInviteLink = `${origin}/signup?school_id=${encodeURIComponent(activeOrgId)}&role=join-student`;
  const teacherInviteLink = `${origin}/signup?school_id=${encodeURIComponent(activeOrgId)}&role=join-teacher`;

  const copyText = (text: string, setStatus: (val: boolean) => void, label: string) => {
    navigator.clipboard.writeText(text);
    setStatus(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setStatus(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/50 via-zinc-900 to-black border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider">
              Institutional Authority Node
            </Badge>
            <Badge variant="outline" className="border-indigo-400/30 text-indigo-300 font-mono text-xs">
              Prefix: {currentShortCode}
            </Badge>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Source of Truth: <strong className="text-white">{activeOrgId}</strong>
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Institutional Management: {currentSchoolName}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Eliminate all confusion between School ID and Organization ID. There is only one unified ID
            (<strong className="text-indigo-300">{activeOrgId}</strong>), derived directly from your school acronym
            (<strong className="text-indigo-300">{currentShortCode}</strong>). Use it to bind students, verify teachers,
            and manage continuous assessment silos.
          </p>
        </div>
      </div>

      {/* 2. SCHOOL NAME & IDENTITY EDITOR */}
      <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              School Details &amp; Short Form Acronym
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Change your institution name. The system automatically computes your 3-4 letter acronym prefix.
            </p>
          </div>
          <Badge className="bg-zinc-800 text-indigo-400 font-mono text-xs px-3 py-1">
            Short Form: {currentShortCode}
          </Badge>
        </div>

        <form onSubmit={handleSaveSchoolName} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-300">Official School Name</Label>
            <div className="flex gap-2">
              <Input
                value={currentSchoolName}
                onChange={(e) => setCurrentSchoolName(e.target.value)}
                placeholder="e.g. Cymatic Study Ecosystem"
                className="bg-zinc-950 border-zinc-800 text-sm text-white font-medium focus:border-indigo-500"
                required
              />
              <Button
                type="submit"
                disabled={savingName}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 px-4"
              >
                {savingName ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Save Name
              </Button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Derived acronym for this name is: <strong className="text-indigo-400">{currentShortCode}</strong>.
            </p>
          </div>
        </form>
      </div>

      {/* 3. UNIFIED ORGANIZATION ID & REGENERATION COMMAND */}
      <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Unified Institution ID (Source of Truth)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              The single public key used to invite members and link them into your institutional database silo.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={regenerating}
            onClick={handleRegenerateId}
            className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate Institution ID ({currentShortCode}-2026-XXXX)
          </Button>
        </div>

        {/* Big Code Card */}
        <div className="p-5 rounded-2xl bg-zinc-950 border-2 border-dashed border-indigo-500/40 text-center space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            Active Institution Code
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider">
              {activeOrgId}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyText(activeOrgId, setCopiedId, "Institution ID")}
              className="text-zinc-400 hover:text-white"
              title="Copy ID"
            >
              {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
            Share this exact code with teachers and students during signup, or provide them with one-click binding links below.
          </p>
        </div>

        {/* Fast Invitation Links */}
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-400" /> Student Join Link
              </span>
              <Badge className="bg-blue-600 text-[9px]">S1–S6</Badge>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 truncate bg-zinc-900 p-2 rounded border border-zinc-800">
              {studentInviteLink}
            </p>
            <Button
              size="sm"
              onClick={() => copyText(studentInviteLink, setCopiedStudentLink, "Student Invite Link")}
              className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold"
            >
              {copiedStudentLink ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              Copy Student Invite Link
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Faculty / Teacher Join Link
              </span>
              <Badge className="bg-emerald-600 text-[9px]">TEACHER</Badge>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 truncate bg-zinc-900 p-2 rounded border border-zinc-800">
              {teacherInviteLink}
            </p>
            <Button
              size="sm"
              onClick={() => copyText(teacherInviteLink, setCopiedTeacherLink, "Teacher Invite Link")}
              className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold"
            >
              {copiedTeacherLink ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              Copy Teacher Invite Link
            </Button>
          </div>
        </div>
      </div>

      {/* 4. RESYNC SELECTED MEMBERS SECTION */}
      <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              Resync Selected Members to Active Institution ID
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select members to harmonize their profiles directly under{" "}
              <strong className="text-white">{currentSchoolName}</strong> ({activeOrgId}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSelectAll}
              className="border-zinc-700 text-zinc-300 text-xs h-8"
            >
              {members.every((m) => m.selected) ? "Deselect All" : "Select All"}
            </Button>
            <Button
              size="sm"
              disabled={resyncing || members.filter((m) => m.selected).length === 0}
              onClick={handleResyncMembers}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 shadow-glow"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${resyncing ? "animate-spin" : ""}`} />
              Resync Selected ({members.filter((m) => m.selected).length})
            </Button>
          </div>
        </div>

        {/* Members Roster List */}
        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
          {loadingMembers ? (
            <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">
              Scanning institutional member roster...
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-zinc-400 font-medium">
                No external scholars or teachers linked yet under this school name.
              </p>
              <p className="text-[11px] text-zinc-600">
                Share your active code <strong className="text-indigo-400">{activeOrgId}</strong> or student invite link to register cohorts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80 max-h-72 overflow-y-auto">
              {members.map((m) => {
                const isMemberTeacher = m.role === "teacher" || m.role === "instructor";
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleSelectMember(m.id)}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button type="button" className="text-indigo-400 shrink-0">
                        {m.selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-zinc-600" />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {m.display_name || "Scholar"}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate font-mono">
                          ID: {m.user_id?.slice(0, 12)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={`text-[9px] ${
                          isMemberTeacher
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {isMemberTeacher ? "TEACHER" : "STUDENT"}
                      </Badge>
                      <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                        {m.school_name || "Unlinked"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default AdminSettings;
