import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Lock,
  Sparkles,
  BookOpen,
  UserCheck,
  AlertCircle,
  Check,
  RefreshCw,
  Loader2,
  Atom,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  Shield,
  KeyRound,
  PenTool,
  FolderTree,
  Layers,
  ArrowRight,
  FileCode,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  ADMIN_STRUCTURED_PASSCODE,
  PRIMARY_ADMIN_EMAIL,
  isAdminSessionAuthorized,
  setAdminSessionAuthorized,
  clearAdminSession,
  getVerifiedAdminEmail,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import {
  parseCurriculumText,
  ParsedCurriculumDocument,
  ScienceSubjectId,
} from "@/lib/curriculum-parser";
import {
  stageParsedDocument,
  useCurriculumStore,
  PublishedCurriculumTopic,
} from "@/lib/curriculum-store";
import { ensureSampleDiagramsSeeded } from "@/lib/diagram-seeds";
import { ManualCurriculumWriter } from "@/components/curriculum/ManualCurriculumWriter";
import { DiagramManager } from "@/components/curriculum/DiagramManager";
import { StagedCurriculumDeck } from "@/components/curriculum/StagedCurriculumDeck";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/developer-console")({
  head: () => ({
    meta: [
      { title: "Developer Console | Cymatic Study" },
      {
        name: "description",
        content:
          "Developer-only architecture console for curriculum ingestion, diagram management, and educator verification.",
      },
    ],
  }),
  component: DeveloperConsolePage,
});

interface PendingEducator {
  id: string;
  user_id: string;
  reason?: string;
  school_id?: string;
  school_name?: string;
  created_at?: string;
  status: "pending" | "approved" | "denied";
  profiles?: {
    display_name?: string;
    email?: string;
    role?: string;
  };
}

function DeveloperConsolePage() {
  const { user } = useAuth();
  const { stagedTopics, publishedTopics, refresh } = useCurriculumStore();

  // Authentication State (Isolated Developer Session, never affects Supabase user role)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => isAdminSessionAuthorized());
  const [authEmail, setAuthEmail] = useState<string>(user?.email || PRIMARY_ADMIN_EMAIL);
  const [authPasscode, setAuthPasscode] = useState<string>("");
  const [showAuthPasscode, setShowAuthPasscode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Educator Requests State (Real Supabase data only, zero mock data)
  const [requests, setRequests] = useState<PendingEducator[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);

  // Main navigation tab: "curriculum" or "educators"
  const [activeMainTab, setActiveMainTab] = useState<"curriculum" | "educators">("curriculum");

  // Ingestion Workspace sub-tab: "document" | "writer" | "diagrams" | "staging"
  const [activeIngestSubTab, setActiveIngestSubTab] = useState<
    "document" | "writer" | "diagrams" | "staging"
  >("document");

  // Document Upload State
  const [actionPasscode, setActionPasscode] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastParsedDoc, setLastParsedDoc] = useState<ParsedCurriculumDocument | null>(null);

  useEffect(() => {
    ensureSampleDiagramsSeeded();
    if (isAuthorized) {
      fetchRealRequests();
    }
  }, [isAuthorized]);

  const handleDeveloperLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const result = verifyAdminCredentials(authEmail, authPasscode);
    if (!result.success) {
      setAuthError(result.message);
      toast.error("Access Denied", { description: result.message });
      return;
    }

    setAdminSessionAuthorized(authEmail);
    setIsAuthorized(true);
    setActionPasscode(authPasscode); // Pre-arm the action passcode for this session
    setAuthPasscode("");
    toast.success("Developer Console Unlocked", {
      description: "Welcome, System Architect. Session authorized.",
    });
  };

  const handleDeveloperLogout = () => {
    clearAdminSession();
    setIsAuthorized(false);
    setActionPasscode("");
    setLastParsedDoc(null);
    toast.info("Developer Session Locked");
  };

  const fetchRealRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from("pending_educators")
        .select("*, profiles:user_id(display_name, email, role)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase query error for pending_educators:", error.message);
        setRequests([]);
      } else {
        setRequests(data || []);
      }
    } catch (err: any) {
      console.warn("Notice fetching pending educators:", err.message);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (id: string, userId: string) => {
    try {
      await supabase.from("pending_educators").update({ status: "approved" }).eq("id", id);
      await supabase.from("profiles").update({ role: "educator" }).eq("user_id", userId);
      toast.success("Educator Approved", {
        description: "Educator privileges granted in database.",
      });
      fetchRealRequests();
    } catch (err: any) {
      toast.error("Approval failed: " + err.message);
    }
  };

  const handleDeny = async (id: string) => {
    try {
      await supabase.from("pending_educators").update({ status: "denied" }).eq("id", id);
      toast.info("Educator Request Denied");
      fetchRealRequests();
    } catch (err: any) {
      toast.error("Denial failed: " + err.message);
    }
  };

  // Deterministic Document Ingestion Handler (PDF, TXT, MD)
  const handleProcessDocument = async () => {
    if (!selectedFile) {
      toast.error("Please select a curriculum document file (PDF, TXT, MD).");
      return;
    }

    if (actionPasscode.trim() !== ADMIN_STRUCTURED_PASSCODE) {
      setUploadError(
        "Invalid master authorization key. Enter your secret passcode to authorize upload.",
      );
      toast.error("Authentication Error", {
        description: "Valid developer passcode required to authorize curriculum changes.",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const toastId = toast.loading("Processing document through Deterministic Parser...");

    try {
      let parsedDocument: ParsedCurriculumDocument | null = null;
      const fileName = selectedFile.name;
      const isPdf = fileName.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        // Send to backend endpoint which uses pdf-parse and deterministic parsing (zero AI quota streaming)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (sessionError || !accessToken) {
          throw new Error("Your authenticated session is missing or expired. Sign in again before uploading.");
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("uploader_email", getVerifiedAdminEmail() || authEmail);

        const response = await fetch("/api/curriculum-ingest", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });

        const responseText = await response.text();
        let json: { error?: string; data?: ParsedCurriculumDocument; message?: string };

        try {
          json = JSON.parse(responseText) as typeof json;
        } catch {
          const detail = responseText.trim().slice(0, 180);
          throw new Error(
            responseText.trim().length === 0
              ? `PDF ingestion endpoint returned an empty response (HTTP ${response.status}). Check the deployed server route and runtime logs.`
              : `PDF ingestion endpoint returned non-JSON content (HTTP ${response.status}). ${detail || "Check the deployed server route and runtime logs."}`,
          );
        }

        if (!response.ok) {
          throw new Error(json.error || json.message || `PDF ingestion failed (HTTP ${response.status}).`);
        }
        if (!json.data || !Array.isArray(json.data.topics)) {
          throw new Error("PDF ingestion response is missing the structured topics array.");
        }
        parsedDocument = json.data;
      } else {
        // Plain text or Markdown: parse client-side directly
        const textContent = await selectedFile.text();
        parsedDocument = parseCurriculumText(textContent, fileName);
      }

      if (!parsedDocument || !parsedDocument.topics || parsedDocument.topics.length === 0) {
        throw new Error("Unable to extract structured topics from this document.");
      }

      // AEP documents are persisted to the programme-specific Supabase index.
      // Never route AEP Level 1/2 into the ordinary Senior 1/2 localStorage deck.
      if (parsedDocument.curriculumProgramme === "Uganda Accelerated Education Programme (AEP)" && parsedDocument.sourceDocumentId) {
        const aepRows = parsedDocument.topics.map((topic) => ({
          source_document_id: parsedDocument.sourceDocumentId,
          level_label: topic.curriculumLevelLabel,
          topic_number: topic.topicNumber,
          title: topic.title,
          source_page: topic.sourcePage,
          review_status: "needs_review",
        }));

        const { error: saveError } = await (supabase as any)
          .from("curriculum_document_topics")
          .upsert(aepRows, { onConflict: "source_document_id,level_label,topic_number" });

        if (saveError) {
          throw new Error(`PDF text extracted, but saving the AEP topic index failed: ${saveError.message}`);
        }

        setLastParsedDoc(parsedDocument);
        refresh();
        toast.success("AEP syllabus extracted and saved for review", {
          id: toastId,
          description: `Verified ${parsedDocument.topics.length} topic headings for ${parsedDocument.subjectTitle}. Source page references retained; notes still require review.`,
        });
        setActiveIngestSubTab("document");
        return;
      }

      // Standard S1-S6 material continues through the existing local staging deck.
      stageParsedDocument(
        parsedDocument,
        isPdf ? "pdf" : "txt",
        fileName,
        getVerifiedAdminEmail() || authEmail,
      );

      setLastParsedDoc(parsedDocument);
      refresh();

      toast.success("Document Parsed & Staged Successfully", {
        id: toastId,
        description: `Extracted ${parsedDocument.topics.length} topics for ${parsedDocument.subjectTitle} (${parsedDocument.levelLabel}). Ready for verification.`,
      });

      setActiveIngestSubTab("staging");
    } catch (err: any) {
      const msg = err.message || "Failed to parse curriculum file.";
      setUploadError(msg);
      toast.error("Ingestion Failed", {
        id: toastId,
        description: msg,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 1. GATE VIEW: If developer session is not authorized, render isolated passcode form
  if (!isAuthorized) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />

        <Card className="w-full max-w-md border-border bg-card/95 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-glow">
              <Shield className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">
              Developer Console
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
              System architect portal for multi-format curriculum ingestion, diagram management, and
              educator permissions. Isolated from school tenant roles.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleDeveloperLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="dev-email"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Developer Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dev-email"
                    type="email"
                    placeholder="latifisabirye123@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="pl-10 h-11 text-sm bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="dev-passcode"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Security Passcode
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dev-passcode"
                    type={showAuthPasscode ? "text" : "password"}
                    placeholder="Enter security key"
                    value={authPasscode}
                    onChange={(e) => setAuthPasscode(e.target.value)}
                    required
                    className="pl-10 pr-10 h-11 text-sm font-mono bg-background border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPasscode(!showAuthPasscode)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    aria-label={showAuthPasscode ? "Hide password" : "Show password"}
                  >
                    {showAuthPasscode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive animate-fade-in">
                  {authError}
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              >
                Authenticate Developer Console
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // 2. AUTHORIZED DEVELOPER PORTAL VIEW
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Session Bar */}
      <div className="border-b border-border/80 bg-card/60 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase tracking-wide">
                  Developer Console
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  Active
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Authorized as{" "}
                <span className="text-foreground font-semibold">
                  {getVerifiedAdminEmail() || authEmail}
                </span>{" "}
                · Independent of tenant roles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/lessons"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>Sciences Room</span>
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDeveloperLogout}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Lock Console
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Navigation Tabs: Curriculum Ingestion vs Educator Access */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/60 border border-border">
            <Button
              size="sm"
              variant={activeMainTab === "curriculum" ? "default" : "ghost"}
              onClick={() => setActiveMainTab("curriculum")}
              className="text-xs font-bold rounded-lg"
            >
              <Atom className="h-3.5 w-3.5 mr-1.5" />
              Curriculum Ingestion Studio
              {stagedTopics.length > 0 && (
                <Badge className="ml-1.5 h-4 px-1.5 text-[9px] bg-amber-500 text-black font-extrabold rounded-full">
                  {stagedTopics.length}
                </Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant={activeMainTab === "educators" ? "default" : "ghost"}
              onClick={() => setActiveMainTab("educators")}
              className="text-xs font-bold rounded-lg"
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              Pending Educator Requests
              {requests.filter((r) => r.status === "pending").length > 0 && (
                <Badge className="ml-1.5 h-4 px-1.5 text-[9px] bg-amber-500 text-black font-extrabold rounded-full">
                  {requests.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </Button>
          </div>

          <span className="text-xs text-muted-foreground font-mono">
            Platform Architect Authority
          </span>
        </div>

        {/* TAB 1: CURRICULUM INGESTION WORKSPACE */}
        {activeMainTab === "curriculum" && (
          <div className="space-y-6">
            {/* Sub-Tabs: Document Ingest, Manual Writer, Diagram Assets, Staged Deck */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/40">
              <button
                onClick={() => setActiveIngestSubTab("document")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeIngestSubTab === "document"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Document Ingestion (PDF / TXT / MD)</span>
              </button>

              <button
                onClick={() => setActiveIngestSubTab("writer")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeIngestSubTab === "writer"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Manual Note Writer</span>
              </button>

              <button
                onClick={() => setActiveIngestSubTab("diagrams")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeIngestSubTab === "diagrams"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderTree className="h-3.5 w-3.5" />
                <span>Diagram Directory &amp; Assets</span>
              </button>

              <button
                onClick={() => setActiveIngestSubTab("staging")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeIngestSubTab === "staging"
                    ? "bg-amber-500 text-black shadow-sm font-black"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Staged Review &amp; Publishing Deck</span>
                {stagedTopics.length > 0 && (
                  <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-black text-amber-400 font-extrabold rounded-full">
                    {stagedTopics.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* SUBTAB 1: DOCUMENT INGESTION (PDF / TXT / MD) */}
            {activeIngestSubTab === "document" && (
              <div className="space-y-6">
                <Card className="border-border bg-card/90 shadow-xl overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/50 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
                          <Atom className="h-5 w-5 text-primary" />
                          Multi-Format Science Curriculum Ingestion
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Upload syllabus notes as PDF, TXT, or Markdown. The deterministic engine
                          extracts S1–S6 classes, topics, subtopics, and formulas without AI quota
                          streaming.
                        </CardDescription>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                        0 AI Quota Streaming
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Passcode Authorization Key (Passcode is never shown in UI) */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <Label
                          htmlFor="upload-passcode"
                          className="text-xs font-bold uppercase tracking-wider text-foreground"
                        >
                          Authorization Passcode Required for Update
                        </Label>
                      </div>
                      <Input
                        id="upload-passcode"
                        type="password"
                        placeholder="Enter security key to authorize section update"
                        value={actionPasscode}
                        onChange={(e) => setActionPasscode(e.target.value)}
                        className="h-10 text-sm font-mono bg-background border-border"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Passcode authorization required before staging notes into the curriculum
                        tree.
                      </p>
                    </div>

                    {/* Document File Picker */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Select Curriculum Document (PDF, TXT, Markdown)
                      </Label>
                      <div className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-2xl p-6 sm:p-8 text-center bg-muted/10">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {selectedFile
                            ? selectedFile.name
                            : "Select or drag curriculum notes document"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedFile
                            ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready for deterministic extraction`
                            : "Senior 1–6 Notes (.pdf, .txt, .md) for Math, Physics, Chemistry, Biology, Agriculture"}
                        </p>
                        <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold cursor-pointer hover:bg-muted transition-colors shadow-sm">
                          <Upload className="h-3.5 w-3.5 text-primary" />
                          <span>Browse Files</span>
                          <input
                            type="file"
                            accept=".pdf,.txt,.md"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                                setUploadError(null);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="bg-muted/10 border-t border-border/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      Deterministic engine: Notes will automatically enter the Staged Deck for
                      developer review.
                    </div>
                    <Button
                      onClick={handleProcessDocument}
                      disabled={isUploading || !selectedFile}
                      className="w-full sm:w-auto h-11 px-6 font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Parsing via Deterministic Engine...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Parse &amp; Stage Notes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Last Parsed Result Summary */}
                {lastParsedDoc && (
                  <Card className="border-emerald-500/30 bg-emerald-950/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="border-b border-emerald-500/20 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <CardTitle className="text-base font-black uppercase text-emerald-400">
                            Parsed Document: {lastParsedDoc.documentTitle}
                          </CardTitle>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {lastParsedDoc.levelLabel} · {lastParsedDoc.subjectTitle}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Extracted {lastParsedDoc.topics.length} topic blocks with{" "}
                        {lastParsedDoc.totalWordCount} words. All units have been placed into the
                        Staged Deck for your review.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setActiveIngestSubTab("staging")}
                        className="text-xs font-bold bg-amber-500 text-black hover:bg-amber-400"
                      >
                        <Layers className="h-3.5 w-3.5 mr-1.5" />
                        Open Staged Deck to Verify &amp; Publish
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* SUBTAB 2: MANUAL NOTE WRITER */}
            {activeIngestSubTab === "writer" && (
              <ManualCurriculumWriter
                onSavedToStaging={(topic) => {
                  refresh();
                  setActiveIngestSubTab("staging");
                }}
                authorEmail={getVerifiedAdminEmail() || authEmail}
              />
            )}

            {/* SUBTAB 3: DIAGRAM ASSET MANAGER */}
            {activeIngestSubTab === "diagrams" && <DiagramManager />}

            {/* SUBTAB 4: STAGED CURRICULUM DECK */}
            {activeIngestSubTab === "staging" && (
              <StagedCurriculumDeck
                sessionPasscode={actionPasscode}
                onTopicPublished={(published) => {
                  refresh();
                }}
              />
            )}
          </div>
        )}

        {/* TAB 2: EDUCATOR ACCESS VERIFICATION MATRIX (REAL DATA ONLY) */}
        {activeMainTab === "educators" && (
          <Card className="border-border bg-card/90 shadow-xl">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Pending Educator Verification Requests
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Live Supabase database records (`pending_educators`). Only the developer can
                    grant educator upload permissions.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchRealRequests}
                  disabled={loadingRequests}
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingRequests ? "animate-spin" : ""}`} />
                  Refresh Database
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingRequests ? (
                <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>Querying Supabase database...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-bold text-foreground">No Pending Requests</p>
                  <p className="text-xs text-muted-foreground">
                    There are currently no pending educator verification requests in the Supabase
                    database.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {req.profiles?.display_name || "Applicant Educator"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {req.status.toUpperCase()}
                          </span>
                        </div>

                        {req.school_name && (
                          <p className="text-xs font-medium text-primary">{req.school_name}</p>
                        )}

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {req.reason || "Application for educator privileges."}
                        </p>

                        {req.created_at && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                            <Clock className="h-3 w-3" />
                            Requested on {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {req.status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeny(req.id)}
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Deny
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req.id, req.user_id)}
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium italic">
                            Status: {req.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
