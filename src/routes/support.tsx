import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Info,
  Landmark,
  ArrowLeft,
  ShieldCheck,
  Wallet,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context"; // Import useAuth

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  const { user, session } = useAuth(); // Get user and session from auth context
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("app_config" as any)
          .select("*")
          .single();

        if (!error && data) {
          setConfig(data);
        }
      } catch (err) {
        console.error("Failed to fetch config:", err);
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const whatsappNumber = config?.whatsapp_number || BRAND.whatsapp;
  const supportEmail = config?.support_email || BRAND.support;
  const merchantId = config?.merchant_id || BRAND.merchantId;
  const supportPrice = config?.support_price || BRAND.supportPrice;

  // Determine UserName and UserId for dynamic links
  const userName = user?.user_metadata?.name || user?.email || "User"; // Fallback to email or "User"
  const userId = user?.id || "N/A"; // Fallback to N/A if not logged in

  // Construct pre-filled messages
  const whatsappMessage = `Hello, my name is ${userName} (ID: ${userId}). I am requesting Support/Restoration for the Cymatic Hub 5,000 UGX Termly Plan.`;
  const emailSubject = "Support/Restoration Request: Cymatic Hub";
  const emailBody = `Hello, my name is ${userName} (ID: ${userId}). I am requesting Support/Restoration for the Cymatic Hub 5,000 UGX Termly Plan.`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground animate-pulse">
          Fetching support details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="rounded-full p-2 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Support Center</h1>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* NCDC Sensitization Hub */}
        <div className="mb-12 rounded-3xl border border-primary/20 bg-card p-6 shadow-glow-sm">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            NCDC Sensitization Hub
          </h2>
          <div className="mb-6">
            <h3 className="font-bold mb-2">For Parents & Teachers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Clear information on the New Lower Secondary Curriculum.
            </p>
            <div className="space-y-2">
              <details className="group border-b border-border py-3">
                <summary className="font-semibold cursor-pointer flex justify-between items-center list-none text-sm hover:text-primary">
                  The 20/80 Assessment Rule
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground text-xs">
                  20% comes from school-level projects and continuous assessments. 80% comes from
                  the final UNEB exam.
                </p>
              </details>
              <details className="group border-b border-border py-3">
                <summary className="font-semibold cursor-pointer flex justify-between items-center list-none text-sm hover:text-primary">
                  Aggregates vs. Letter Grades
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground text-xs">
                  Old aggregate systems are replaced by competency-based letter grades (A–E) that
                  show exactly what skills your child has mastered.
                </p>
              </details>
              <details className="group border-b border-border py-3">
                <summary className="font-semibold cursor-pointer flex justify-between items-center list-none text-sm hover:text-primary">
                  What is a Stand-Alone Grade?
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground text-xs">
                  Project work stands entirely on its own, showcasing practical skills and
                  creativity to future employers beyond just exam results.
                </p>
              </details>
            </div>
          </div>
        </div>

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-glow">
            <HelpCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Need a Hand?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get help with academic content, activation, or technical issues.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Supportive Plan Header */}
          <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-6 border border-primary/20 shadow-glow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Merchant Support Plan
                </span>
                <h3 className="mt-2 text-xl font-black">Full App Activation</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unlock all notes, quizzes, and AI features.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary">{supportPrice}</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Termly payment
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href={`tel:*165*1*${whatsappNumber.slice(-9)}*${supportPrice.replace(/\D/g, "")}%23`}
                className="flex items-center gap-3 rounded-2xl bg-card/50 p-4 border border-border/50 hover:border-primary/50 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-500 group-hover:scale-110 transition-transform">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Mobile Money (Personal)</p>
                  <p className="font-bold">{whatsappNumber}</p>
                  <p className="text-[10px] text-primary font-bold mt-0.5">
                    Tap to Dial: *165*1*{whatsappNumber.slice(-9)}*{supportPrice.replace(/\D/g, "")}
                    #
                  </p>
                </div>
              </a>

              <a
                href={`tel:*165*3*${merchantId}*${supportPrice.replace(/\D/g, "")}%23`}
                className="flex items-center gap-3 rounded-2xl bg-card/50 p-4 border border-border/50 hover:border-primary/50 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-500 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Merchant ID</p>
                  <p className="font-bold">{merchantId}</p>
                  <p className="text-[10px] text-primary font-bold mt-0.5">
                    Tap to Dial: *165*3*{merchantId}*{supportPrice.replace(/\D/g, "")}#
                  </p>
                </div>
              </a>
            </div>

            <p className="mt-4 text-[11px] text-center text-muted-foreground italic">
              *After payment, please send a screenshot to WhatsApp for instant activation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5 transition-smooth hover:border-primary/50 hover:bg-card hover:shadow-glow group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 text-green-500 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">WhatsApp</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Message us on WhatsApp for help.
                </p>
              </div>
            </a>

            {/* Phone Call */}
            <a
              href={`tel:${whatsappNumber}`}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5 transition-smooth hover:border-primary/50 hover:bg-card hover:shadow-glow group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Call Support</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Direct voice call to Latif.
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5 transition-smooth hover:border-primary/50 hover:bg-card hover:shadow-glow group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Email</h3>
                <p className="text-[10px] text-muted-foreground truncate">{supportEmail}</p>
              </div>
            </a>
          </div>

          {/* About App */}
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Info className="h-5 w-5" />
              </div>
              <h3 className="font-bold">About Cymatic Hub</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config?.about_app ||
                "Cymatic Hub is an advanced educational platform tailored for Uganda's New Lower Secondary Curriculum, providing students with interactive tools, high-quality notes, and AI-powered learning assistance."}
            </p>
            <p className="mt-4 text-xs font-bold text-primary">
              Note: When sending support issues, kindly attach a screenshot of the error.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Version 1.0.0 · © 2026 Pash Media Services · All rights reserved Isabirye Latif
        </div>
      </div>
    </div>
  );
}
