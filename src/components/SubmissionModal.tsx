import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send,
  MessageSquare,
  Mail,
  Copy,
  CheckCircle2,
  Loader2,
  User,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { type Project, useProjects } from "@/lib/projects-store";
import { newToken, buildWhatsAppUrl, buildMailtoUrl, buildMarkingLink } from "@/lib/project-link";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type SubmissionModalProps = {
  project: Project;
  onSend: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function SubmissionModal({
  project,
  onSend,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: SubmissionModalProps) {
  const { user, profile, isInstitutional } = useAuth();
  const { update } = useProjects();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("direct");

  // Direct submission state
  const [teacherId, setTeacherId] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teachers, setTeachers] = useState<
    { id: string; user_id: string; display_name: string; teacher_license_id: string }[]
  >([]);
  const [selectedTeacher, setSelectedTeacher] = useState<{
    id: string;
    user_id: string;
    display_name: string;
  } | null>(null);
  const [directSending, setDirectSending] = useState(false);

  // WhatsApp state
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  // Email state
  const [emailAddress, setEmailAddress] = useState("");

  // Token for marking link
  const [markingToken, setMarkingToken] = useState<string>("");

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Generate marking token when modal opens
  useEffect(() => {
    if (open && !markingToken) {
      setMarkingToken(project.markingToken || newToken());
    }
  }, [open, markingToken, project.markingToken]);

  // Fetch teachers for direct submission (institutional mode)
  useEffect(() => {
    if (!open || !isInstitutional) return;

    const fetchTeachers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, teacher_license_id")
        .or("role.eq.teacher,role.eq.independent_teacher")
        .eq("org_id", profile?.org_id)
        .limit(20);

      if (data) {
        setTeachers(data.filter((t) => t.display_name) as any);
      }
    };

    fetchTeachers();
  }, [open, isInstitutional, profile?.org_id]);

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    const search = teacherSearch.toLowerCase();
    return teachers
      .filter(
        (t) =>
          t.display_name?.toLowerCase().includes(search) ||
          t.teacher_license_id?.toLowerCase().includes(search),
      )
      .slice(0, 6);
  }, [teachers, teacherSearch]);

  const fullMarkingLink = useMemo(() => {
    if (!markingToken) return "";
    return buildMarkingLink(markingToken);
  }, [markingToken]);

  // WhatsApp message template
  const whatsappMessage = useMemo(
    () =>
      `
Salaam Teacher,

I have completed my NCDC project and would like to submit it for your review.

*Project:* ${project.title || "Untitled Project"}
*Subject:* ${project.subject || "N/A"}
*Student:* ${project.studentName || profile?.display_name || "Student"}

Please use this link to review and mark:
${fullMarkingLink}

Thank you!
`.trim(),
    [project, profile, fullMarkingLink],
  );

  // Email template
  const emailSubject = `NCDC Project Submission: ${project.title || "Untitled Project"}`;
  const emailBody = useMemo(
    () =>
      `
Dear Teacher,

I have completed my NCDC project and would like to submit it for review.

Project: ${project.title || "Untitled Project"}
Subject: ${project.subject || "N/A"}
Student: ${project.studentName || profile?.display_name || "Student"}
School: ${project.schoolName || profile?.school_name || "N/A"}

Please use this link to review and mark:
${fullMarkingLink}

Best regards,
${project.studentName || profile?.display_name || "Student"}
`.trim(),
    [project, profile, fullMarkingLink],
  );

  // Update local project status
  const markAsPending = (submissionId?: string) => {
    update(project.id, {
      status: "pending",
      markingToken,
      submissionId,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle direct submission to teacher's dashboard
  const handleDirectSend = async () => {
    if (!selectedTeacher && !teacherId) {
      toast.error("Please select or enter a Teacher ID");
      return;
    }

    setDirectSending(true);

    try {
      let teacherPayload = selectedTeacher;

      if (!isInstitutional) {
        const cleanTeacherId = teacherId.trim();
        if (!cleanTeacherId) {
          toast.error("Please enter a valid teacher identifier.");
          setDirectSending(false);
          return;
        }

        const query = supabase
          .from("profiles")
          .select("id, user_id, display_name, teacher_license_id, role")
          .or(`user_id.eq.${cleanTeacherId},teacher_license_id.eq.${cleanTeacherId}`)
          .in("role", ["teacher", "independent_teacher"])
          .limit(1);

        const { data: teacherRows, error: teacherError } = await query;
        if (teacherError) {
          throw teacherError;
        }

        if (!teacherRows || teacherRows.length === 0) {
          toast.error("No matching teacher found. Use a valid teacher ID or license.");
          setDirectSending(false);
          return;
        }

        teacherPayload = teacherRows[0] as any;
      }

      const { data, error } = await supabase
        .from("project_submissions")
        .upsert({
          id: project.submissionId || undefined,
          student_id: user?.id,
          teacher_id: teacherPayload?.user_id || null,
          teacher_name: teacherPayload?.display_name || null,
          teacher_license: teacherPayload?.teacher_license_id || null,
          school_key: profile?.org_id || null,
          project_data: { ...project, markingToken, status: "pending" } as any,
          marking_token: markingToken,
          status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      markAsPending(data.id);
      toast.success("Project sent to teacher!", {
        description: teacherPayload?.display_name
          ? `Sent to ${teacherPayload.display_name}'s marking desk`
          : "Project submitted for marking",
      });

      onSend();
      setOpen(false);
    } catch (err: any) {
      toast.error("Submission failed", {
        description: err.message || "Please try again",
      });
    } finally {
      setDirectSending(false);
    }
  };

  // Handle WhatsApp share
  const handleWhatsAppShare = async () => {
    if (!whatsappPhone) {
      toast.error("Enter a valid WhatsApp number first.");
      return;
    }

    const phone = whatsappPhone.replace(/[^\d]/g, "");
    const url = buildWhatsAppUrl(phone, whatsappMessage);

    const { data, error } = await supabase
      .from("project_submissions")
      .upsert({
        id: project.submissionId || undefined,
        student_id: user?.id,
        org_id: profile?.org_id || null,
        project_data: { ...project, markingToken, status: "pending" } as any,
        marking_token: markingToken,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Could not create submission record.", { description: error.message });
      return;
    }

    markAsPending(data?.id);
    window.open(url, "_blank");
    onSend();
    setOpen(false);
  };

  // Handle copy marking link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullMarkingLink);
      setWhatsappCopied(true);
      toast.success("Marking link copied!");
      setTimeout(() => setWhatsappCopied(false), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Handle email share
  const handleEmailShare = async () => {
    if (!emailAddress) {
      toast.error("Enter a teacher email address first.");
      return;
    }

    const { data, error } = await supabase
      .from("project_submissions")
      .upsert({
        id: project.submissionId || undefined,
        student_id: user?.id,
        org_id: profile?.org_id || null,
        project_data: { ...project, markingToken, status: "pending" } as any,
        marking_token: markingToken,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Could not create submission record.", { description: error.message });
      return;
    }

    markAsPending(data?.id);
    const mailtoUrl = buildMailtoUrl(emailAddress, emailSubject, emailBody);
    window.location.href = mailtoUrl;
    onSend();
    setOpen(false);
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Send for Marking
        </DialogTitle>
      </DialogHeader>

      <div className="rounded-lg border border-border bg-muted/30 p-3 mb-4">
        <h4 className="font-bold truncate">{project.title || "Untitled Project"}</h4>
        <p className="text-xs text-muted-foreground">
          {project.subject || "No subject"} - {project.studentName || "Student"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="direct" className="text-xs">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Direct
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="text-xs">
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direct" className="space-y-4 pt-4">
          {isInstitutional ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Teacher from Your School</Label>
                <Input
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Search by name or license..."
                  className="mb-2"
                />
                <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                  {filteredTeachers.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      No teachers found in your institution
                    </p>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => setSelectedTeacher(teacher)}
                        className={`w-full rounded-md border p-2 text-left text-sm transition-all ${
                          selectedTeacher?.id === teacher.id
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:bg-muted"
                        }`}
                      >
                        <div className="font-semibold">{teacher.display_name}</div>
                        {teacher.teacher_license_id && (
                          <div className="text-[10px] text-muted-foreground">
                            License: {teacher.teacher_license_id}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
              {selectedTeacher && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Will be sent to: {selectedTeacher.display_name}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Enter Teacher ID or License Number</Label>
              <Input
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="e.g., REG/2024/001 or teacher@email.com"
              />
              <p className="text-[10px] text-muted-foreground">
                Independent mode: Enter your teacher&apos;s verification ID
              </p>
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={handleDirectSend}
            disabled={directSending || (!selectedTeacher && !teacherId)}
          >
            {directSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send to Teacher&apos;s Desk
          </Button>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Teacher&apos;s WhatsApp Number</Label>
            <Input
              type="tel"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="e.g., 0771234567 or +256771234567"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <Label className="mb-2 block text-xs font-semibold">Secure Marking Link</Label>
            <div className="flex gap-2">
              <Input value={fullMarkingLink} readOnly className="text-xs bg-background" />
              <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                {whatsappCopied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20BD5A]"
              onClick={handleWhatsAppShare}
              disabled={!whatsappPhone}
            >
              <MessageSquare className="h-4 w-4" />
              Open WhatsApp
            </Button>
            <Button variant="outline" onClick={handleCopyLink} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Teacher&apos;s Email Address</Label>
            <Input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="teacher@school.edu"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <Label className="mb-1 block text-xs font-semibold">Email Preview</Label>
            <p className="text-xs text-muted-foreground line-clamp-3">Subject: {emailSubject}</p>
          </div>

          <Button className="w-full gap-2" onClick={handleEmailShare} disabled={!emailAddress}>
            <Mail className="h-4 w-4" />
            Open Email Client
          </Button>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Security:</strong> Only teachers with the marking link can access and grade your
          project.
        </div>
      </div>
    </DialogContent>
  );

  if (controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" className="gap-2">
            <Send className="h-4 w-4" />
            Send for Marking
          </Button>
        )}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
