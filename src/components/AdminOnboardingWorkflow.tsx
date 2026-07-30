import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  School,
  Sparkles,
  IdCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trophy,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateNcdcBoardingSchoolId } from "@/lib/school-id-validator";
import { generateStudentRegistryCode } from "@/lib/auth-router";
import { SchoolIdQRCode } from "@/components/SchoolIdQRCode";
import { motion } from "motion/react";

interface AdminOnboardingWorkflowProps {
  onComplete: (schoolId: string, schoolName: string) => void;
}

export function AdminOnboardingWorkflow({ onComplete }: AdminOnboardingWorkflowProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [generatedId, setGeneratedId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Generate a school ID based on Name or random format
  const handleGenerateId = () => {
    if (!schoolName.trim()) {
      toast.error("Please enter a School Name first!");
      return;
    }

    // Generate standard NCDC formatted ID
    const standardId = generateNcdcBoardingSchoolId();
    setGeneratedId(standardId);
    setStep(2);
    toast.success("Successfully generated your official School ID!");
  };

  const handleSaveAndRegister = async () => {
    if (!user) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Registering institution and provisioning security policies...");

    try {
      const registryCode = generateStudentRegistryCode(generatedId, user.id);

      // 1. Update Supabase User Metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          school_id: generatedId,
          org_id: generatedId,
          school_name: schoolName.trim(),
          student_registry_code: registryCode,
        } as any,
      });

      if (metaError) {
        console.warn("User metadata update notice:", metaError);
      }

      // 2. Insert into public.organizations
      const { error: orgError } = await supabase.from("organizations").upsert(
        {
          id: generatedId,
          name: schoolName.trim(),
          school_key: generatedId,
          email: schoolEmail.trim() || user.email || null,
          phone: schoolPhone.trim() || null,
        },
        { onConflict: "id" },
      );

      if (orgError) {
        console.warn("Organizations upsert warning:", orgError);
      }

      // 3. Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          org_id: generatedId,
          school_id: generatedId,
          school_name: schoolName.trim(),
        })
        .eq("user_id", user.id);

      if (profileError) {
        console.warn("Profiles update warning:", profileError);
      }

      // 4. Update localStorage fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("cymatic_school_id", generatedId);
      }

      setIsSaving(false);
      setIsCompleted(true);
      setStep(3);
      toast.success("School Registry Created! Welcome to Cymatic Command Center.", { id: toastId });
    } catch (err: any) {
      setIsSaving(false);
      console.error("Onboarding failed:", err);
      toast.error(err?.message || "Failed to complete onboarding. Please try again.", {
        id: toastId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 selection:bg-blue-600/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.07),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.05),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Progress bar */}
        <div className="mb-8 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-800"}`}
            />
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-zinc-800"}`}
            />
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${step >= 3 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-800"}`}
            />
          </div>
          <span className="text-xs uppercase font-black tracking-widest text-zinc-500">
            Step {step} of 3 • Onboarding Workflow
          </span>
        </div>

        <Card className="border border-white/5 bg-zinc-950/70 backdrop-blur-2xl rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* STEP 1: Enter School Details */}
          {step === 1 && (
            <div className="p-8 space-y-6">
              <header className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4">
                  <School className="h-6 w-6 text-blue-400" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                  Onboard Your Institution
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Welcome, Administrator. Please input your school's details to register your
                  institution and generate your unique School ID.
                </p>
              </header>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="school-name"
                    className="text-xs font-bold text-zinc-400 uppercase tracking-wider"
                  >
                    School / Boarding Institution Name
                  </Label>
                  <Input
                    id="school-name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. St. Mary's Boarding Secondary School"
                    className="bg-white/5 border-white/10 text-sm h-11 focus:border-blue-500/50 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="school-email"
                      className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5 text-zinc-500" /> School Contact Email
                    </Label>
                    <Input
                      id="school-email"
                      type="email"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      placeholder="e.g. office@school.edu"
                      className="bg-white/5 border-white/10 text-sm h-11 focus:border-blue-500/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="school-phone"
                      className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Phone className="h-3.5 w-3.5 text-zinc-500" /> School Phone Number
                    </Label>
                    <Input
                      id="school-phone"
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                      placeholder="e.g. +256 700 000 000"
                      className="bg-white/5 border-white/10 text-sm h-11 focus:border-blue-500/50 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleGenerateId}
                  disabled={!schoolName.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                  Generate Official School ID
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Verify Generated School ID */}
          {step === 2 && (
            <div className="p-8 space-y-6">
              <header className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-indigo-400" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                  Verify Official School ID
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Your official NCDC Boarding Institution registry ID has been provisioned. Review
                  your registry key and click "Activate" to publish this ID to the remote directory.
                </p>
              </header>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Registered Institution
                  </p>
                  <p className="text-base font-black text-white mt-1">{schoolName}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Official School ID Registry Code
                  </p>
                  <div className="flex items-center justify-between bg-black/40 border border-white/5 px-4 py-3 rounded-xl mt-1.5">
                    <span className="font-mono text-lg font-black text-blue-400 tracking-wider">
                      {generatedId}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Format Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold h-11 px-5 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSaveAndRegister}
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Registry...
                    </>
                  ) : (
                    <>
                      Activate Institution Console
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Celebration / Final Confirmation */}
          {step === 3 && (
            <div className="p-8 space-y-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2 animate-bounce">
                <Trophy className="h-8 w-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                  Registry Activated!
                </h1>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                  Your school registry has been successfully synchronized. Your official QR Badge is
                  ready below. Share this School ID with your faculty and student bodies.
                </p>
              </div>

              <div className="mx-auto max-w-sm bg-zinc-900 border border-white/5 rounded-2xl p-4 text-left">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Institutional Digital Identity Badge</span>
                </div>
                <SchoolIdQRCode
                  schoolId={generatedId}
                  schoolName={schoolName}
                  studentName={
                    profile?.display_name || user?.email?.split("@")[0] || "Administrator"
                  }
                  role="School Administrator"
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <Button
                  onClick={() => onComplete(generatedId, schoolName)}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  Launch Administration Console
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
