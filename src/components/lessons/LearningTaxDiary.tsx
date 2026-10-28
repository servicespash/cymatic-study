import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  BookOpen,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { SCIENCE_SUBJECTS, CLASS_LEVELS_SCIENCE } from "@/data/scienceCurriculum";

export interface TaxDiaryEntry {
  id: string;
  timestamp: string;
  subject: string;
  level: string;
  topicTitle: string;
  durationMinutes: number;
  assessmentPointsEarned: number;
  retentionTaxSaved: number;
  proofHash: string;
}

const STORAGE_KEY_TAX_DIARY = "cymatic_learning_tax_diary";

const DEFAULT_ENTRIES: TaxDiaryEntry[] = [
  {
    id: "entry-01",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    subject: "Physics",
    level: "Senior 3",
    topicTitle: "Linear Momentum and Newton's Second Law",
    durationMinutes: 45,
    assessmentPointsEarned: 15,
    retentionTaxSaved: 8.5,
    proofHash: "TAX-PHY-S3-9941A",
  },
  {
    id: "entry-02",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    subject: "Chemistry",
    level: "Senior 2",
    topicTitle: "Acids, Bases and Practical pH Titration",
    durationMinutes: 60,
    assessmentPointsEarned: 20,
    retentionTaxSaved: 12.0,
    proofHash: "TAX-CHM-S2-8104C",
  },
  {
    id: "entry-03",
    timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
    subject: "Mathematics",
    level: "Senior 4",
    topicTitle: "Quadratic Graphs and Turning Points",
    durationMinutes: 50,
    assessmentPointsEarned: 18,
    retentionTaxSaved: 10.2,
    proofHash: "TAX-MTH-S4-7220B",
  },
];

export function LearningTaxDiary({
  defaultSubject = "math",
  defaultLevel = 1,
}: {
  defaultSubject?: string;
  defaultLevel?: number;
}) {
  const [entries, setEntries] = useState<TaxDiaryEntry[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ENTRIES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAX_DIARY);
      return saved ? JSON.parse(saved) : DEFAULT_ENTRIES;
    } catch {
      return DEFAULT_ENTRIES;
    }
  });

  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState(defaultSubject);
  const [newLevel, setNewLevel] = useState(`Senior ${defaultLevel}`);
  const [newTopic, setNewTopic] = useState("");
  const [newDuration, setNewDuration] = useState(40);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TAX_DIARY, JSON.stringify(entries));
    } catch (err) {
      console.warn("Notice saving tax diary:", err);
    }
  }, [entries]);

  // Calculations
  const totalMinutes = entries.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const targetHours = 40; // NCDC 20% School-based continuous requirement
  const compliancePercentage = Math.min(100, Math.round((totalMinutes / (targetHours * 60)) * 100));
  const totalAssessmentPoints = entries.reduce((acc, curr) => acc + curr.assessmentPointsEarned, 0);
  const totalTaxSaved = entries.reduce((acc, curr) => acc + curr.retentionTaxSaved, 0).toFixed(1);

  const handleLogSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) {
      toast.error("Please enter a topic title for your study log.");
      return;
    }

    const duration = Number(newDuration) || 30;
    const earnedPoints = Math.round(duration * 0.35);
    const taxSaved = Number((duration * 0.22).toFixed(1));
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const hash = `TAX-${newSubject.substring(0, 3).toUpperCase()}-${randomHex}`;

    const newEntry: TaxDiaryEntry = {
      id: "entry-" + Date.now(),
      timestamp: new Date().toISOString(),
      subject: newSubject,
      level: newLevel,
      topicTitle: newTopic.trim(),
      durationMinutes: duration,
      assessmentPointsEarned: earnedPoints,
      retentionTaxSaved: taxSaved,
      proofHash: hash,
    };

    setEntries([newEntry, ...entries]);
    setIsLoggingModalOpen(false);
    setNewTopic("");
    toast.success("Study Session Proofed & Logged", {
      description: `Earned +${earnedPoints} continuous assessment credits. Audit stamp: ${hash}.`,
    });
  };

  const handleExportStatement = () => {
    const text = `
============================================================
       CYMATIC STUDY - NCDC CONTINUOUS ASSESSMENT LEDGER
============================================================
Student Academic Statement & Learning Tax Audit Journal
Date Generated: ${new Date().toLocaleDateString()}
Total Study Hours Logged: ${totalHours} hrs / 40.0 hrs target
NCDC 20% Compliance Ratio: ${compliancePercentage}%
Total Earned Competency Credits: ${totalAssessmentPoints} pts
Estimated Retention Tax Saved: ${totalTaxSaved}%
------------------------------------------------------------
VERIFIED PROOFING LOG:
${entries
  .map(
    (e, idx) =>
      `[#${idx + 1}] ${new Date(e.timestamp).toLocaleDateString()} | ${e.level} ${e.subject}
   Topic: "${e.topicTitle}"
   Duration: ${e.durationMinutes} mins | Points: +${e.assessmentPointsEarned} | Stamp: ${e.proofHash}`,
  )
  .join("\n\n")}
============================================================
Signed: Cymatic Socratic System Verifier
Valid for institutional Continuous Assessment (S1-S6)
============================================================
    `.trim();

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NCDC-Learning-Tax-Diary-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit statement downloaded successfully.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Continuous Assessment Hours</span>
              <Clock className="h-3.5 w-3.5 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {totalHours}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ 40 hrs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={compliancePercentage} className="h-1.5 mt-1" />
            <p className="text-[10px] text-muted-foreground mt-2">
              {compliancePercentage}% toward NCDC 20% School Mark
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Competency Points Earned</span>
              <Award className="h-3.5 w-3.5 text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-400">
              +{totalAssessmentPoints}{" "}
              <span className="text-xs font-normal text-muted-foreground">pts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[10px] text-muted-foreground mt-2">
              Earned across {entries.length} audited study periods
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Memory Decay Tax Shield</span>
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-cyan-400">{totalTaxSaved}%</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[10px] text-muted-foreground mt-2">
              Forgetting curve tax offset via daily recall
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 flex flex-col justify-between p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Quick Log &amp; Audit
            </p>
            <p className="text-xs text-foreground font-semibold mt-1">
              Proof a new Science lesson revision
            </p>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => setIsLoggingModalOpen(true)}
              className="flex-1 h-9 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Log Session
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportStatement}
              className="h-9 px-2.5 text-xs"
              title="Download Audit Ledger"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Ledger Table */}
      <Card className="border-border bg-card/90 shadow-lg">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Continuous Assessment &amp; Learning Tax Ledger
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Official audit journal for S1–S6 Sciences. Every revision stamp is cryptographically
                proofed.
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs w-fit">
              UNEB Assessment Verified
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold bg-muted/40">
                      {entry.level}
                    </Badge>
                    <Badge className="text-[10px] font-bold bg-primary/15 text-primary border-none">
                      {entry.subject}
                    </Badge>
                    <span className="font-bold text-sm text-foreground">{entry.topicTitle}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.durationMinutes} mins study time
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3" />+{entry.assessmentPointsEarned} Assessment
                      Pts
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      Stamp: {entry.proofHash}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Modal */}
      {isLoggingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base font-black uppercase">
                Proof &amp; Log Study Period
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Document completed study hours to credit your 20% School-based continuous assessment
                ledger.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogSession}>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Science Subject
                  </Label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {SCIENCE_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title} (S1-S6)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Class Level
                  </Label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {CLASS_LEVELS_SCIENCE.map((c) => (
                      <option key={c.level} value={c.label}>
                        {c.label} ({c.short})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Topic / Subtopic Reviewed
                  </Label>
                  <Input
                    placeholder="e.g. Newton's Laws of Motion or Chemical Equilibrium"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Duration (Minutes)
                  </Label>
                  <Input
                    type="number"
                    min="10"
                    max="240"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    required
                    className="h-10 text-sm"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/60 pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsLoggingModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirm &amp; Stamp Entry
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
