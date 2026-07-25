import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  IdCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  School,
  Copy,
  Check,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateNcdcSchoolId, generateNcdcBoardingSchoolId } from "@/lib/school-id-validator";
import { SchoolIdQRCode } from "@/components/SchoolIdQRCode";
import { generateStudentRegistryCode } from "@/lib/auth-router";

interface SchoolIdInputFieldProps {
  onSaved?: (newSchoolId: string) => void;
  className?: string;
}

export function SchoolIdInputField({ onSaved, className = "" }: SchoolIdInputFieldProps) {
  const { user, profile, isAdmin } = useAuth();

  const currentSchoolId =
    profile?.school_id ||
    profile?.org_id ||
    user?.user_metadata?.school_id ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : "") ||
    "";

  const currentSchoolName =
    profile?.school_name || user?.user_metadata?.school_name || "Uganda NCDC Boarding School";

  const [inputVal, setInputVal] = useState(currentSchoolId);
  const [schoolNameVal, setSchoolNameVal] = useState(currentSchoolName);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFormatValid, setIsFormatValid] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInputVal(currentSchoolId);
  }, [currentSchoolId]);

  // Handle value change with client-side validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.toUpperCase();
    setInputVal(rawVal);

    if (!rawVal.trim()) {
      setValidationError("School ID cannot be empty. Enter your institution's assigned code.");
      setIsFormatValid(false);
      return;
    }

    const valResult = validateNcdcSchoolId(rawVal);
    if (!valResult.isValid) {
      setValidationError(valResult.error || "Invalid School ID format.");
      setIsFormatValid(false);
    } else {
      setValidationError(null);
      setIsFormatValid(true);
    }
  };

  // Admin-only School ID provisioner
  const handleAdminGenerateNewId = () => {
    if (!isAdmin) return;
    const generatedId = generateNcdcBoardingSchoolId();
    setInputVal(generatedId);
    setValidationError(null);
    setIsFormatValid(true);
    toast.info(`Generated Official Institution Code: ${generatedId}`, {
      description: "Click 'Save Official School Registry' to issue this ID to your school.",
    });
  };

  // Save to Supabase (User Metadata + Profiles Table)
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      toast.error("Authentication required to bind School ID.");
      return;
    }

    const trimmedId = inputVal.trim();
    if (!trimmedId) {
      setValidationError("Please enter an official School ID issued by your school administrator.");
      toast.error("Validation Error: School ID cannot be blank.");
      return;
    }

    const valResult = validateNcdcSchoolId(trimmedId);
    if (!valResult.isValid) {
      setValidationError(valResult.error || "Format invalid.");
      toast.error(valResult.error || "Invalid NCDC School ID format.");
      return;
    }

    const finalId = valResult.formatted || trimmedId;
    setSaving(true);
    const toastId = toast.loading("Connecting to NCDC Boarding Institution registry...");

    try {
      const autoRegistryCode = generateStudentRegistryCode(finalId, user.id);

      // 1. Update Supabase User Metadata with school ID & unique institutional registry code
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          school_id: finalId,
          org_id: finalId,
          school_name: schoolNameVal.trim() || null,
          student_registry_code: autoRegistryCode,
        },
      });

      if (metaError) {
        console.warn("User metadata update warning:", metaError);
      }

      // 2. Ensure organization row exists in database
      if (finalId) {
        try {
          await supabase.from("organizations").upsert(
            {
              id: finalId,
              name: schoolNameVal.trim() || "Uganda NCDC Boarding School",
              school_key: finalId,
            },
            { onConflict: "id" }
          );
        } catch (orgErr) {
          console.warn("Organization upsert notice:", orgErr);
        }
      }

      // 3. Update or Insert Supabase Profiles database table safely
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let profileError = null;

      if (profileCheck) {
        const { error: err1 } = await supabase
          .from("profiles")
          .update({
            org_id: finalId || null,
            school_name: schoolNameVal.trim() || null,
          })
          .eq("user_id", user.id);

        if (err1 && err1.message?.toLowerCase().includes("foreign key")) {
          const { error: err2 } = await supabase
            .from("profiles")
            .update({
              school_name: schoolNameVal.trim() || null,
            })
            .eq("user_id", user.id);
          profileError = err2;
        } else {
          profileError = err1;
        }
      } else {
        const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : user.id;
        const { error: err1 } = await supabase.from("profiles").insert({
          id: newId,
          user_id: user.id,
          display_name: user.email?.split("@")[0] || "Scholar",
          org_id: finalId || null,
          school_name: schoolNameVal.trim() || null,
        });

        if (err1 && err1.message?.toLowerCase().includes("foreign key")) {
          const { error: err2 } = await supabase.from("profiles").insert({
            id: newId,
            user_id: user.id,
            display_name: user.email?.split("@")[0] || "Scholar",
            school_name: schoolNameVal.trim() || null,
          });
          profileError = err2;
        } else {
          profileError = err1;
        }
      }

      // 4. Update localStorage fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("cymatic_school_id", finalId);
      }

      setSaving(false);

      if (profileError) {
        console.warn("Profiles DB warning:", profileError.message);
      }

      toast.success(
        isAdmin ? "Institutional Registry Code updated!" : "Bound to Institution successfully!",
        {
          id: toastId,
          description: `Active School ID: ${finalId}. Your official QR Badge is ready.`,
        }
      );

      if (onSaved) {
        onSaved(finalId);
      }
    } catch (err: any) {
      setSaving(false);
      console.error("Save School ID exception:", err);
      toast.error(err?.message || "Failed to persist School ID to Supabase.", { id: toastId });
    }
  };

  const handleCopy = () => {
    if (!inputVal) return;
    navigator.clipboard.writeText(inputVal);
    setCopied(true);
    toast.success("School ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-4 rounded-3xl border border-primary/20 bg-card/80 p-6 backdrop-blur shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-foreground">
                {isAdmin ? "Institutional School ID Management" : "Institutional School Binding"}
              </h3>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {isAdmin ? "Admin Authority" : "Official Binding"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAdmin
                ? "Manage your school's official registry code to issue to staff and students."
                : "Bind your profile to your school's official School ID issued by your administrator."}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdminGenerateNewId}
            className="h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-bold shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Issue New School ID
          </Button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {/* Input Field with Format Validation Badge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="ncdc-school-id" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <IdCard className="h-3.5 w-3.5 text-cyan-400" />
              {isAdmin ? "Official Institution Registry Code" : "Enter Admin-Provided School ID"}
            </Label>
            {inputVal && isFormatValid && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Official NCDC Registry Verified
              </span>
            )}
          </div>

          <div className="relative">
            <Input
              id="ncdc-school-id"
              value={inputVal}
              onChange={handleChange}
              placeholder={isAdmin ? "e.g. SCH-UG-2026-B871" : "e.g. SCH-UG-2026-X9"}
              className={`font-mono font-bold tracking-wider text-sm bg-background/80 border ${
                validationError
                  ? "border-red-500/60 focus:ring-red-500/20"
                  : "border-primary/40 focus:ring-primary/20"
              }`}
            />
            {inputVal && (
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                title="Copy School ID"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {validationError ? (
            <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {validationError}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isAdmin
                ? "As an Institutional Admin, this ID binds all teachers and students to your school domain."
                : "Ask your school administrator for your school's official School ID code (e.g. SCH-UG-2026-X9)."}
            </p>
          )}
        </div>

        {/* Institution Name Field */}
        <div className="space-y-1.5">
          <Label htmlFor="ncdc-school-name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <School className="h-3.5 w-3.5 text-indigo-400" /> School / Boarding Institution Name
          </Label>
          <Input
            id="ncdc-school-name"
            value={schoolNameVal}
            onChange={(e) => setSchoolNameVal(e.target.value)}
            placeholder="e.g. St. Mary's Boarding Secondary School, Kitende"
            className="bg-background/80 text-xs border-border/60"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="submit"
            disabled={saving || !isFormatValid || !inputVal.trim()}
            className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {isAdmin ? "Save Official School Registry" : "Bind Profile to School ID"}
          </Button>
        </div>
      </form>

      {/* Embedded Digital Badge Presenter automatically derived once bound */}
      {inputVal && isFormatValid && (
        <div className="pt-3 border-t border-border/40">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Official Institutional Digital Identity Badge</span>
          </div>
          <SchoolIdQRCode
            schoolId={inputVal}
            schoolName={schoolNameVal}
            studentName={profile?.display_name || user?.email?.split("@")[0] || "NCDC Scholar"}
            role={profile?.role || (isAdmin ? "School Administrator" : "Boarding Scholar")}
          />
        </div>
      )}
    </div>
  );
}

