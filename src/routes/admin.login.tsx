import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, School, Lock, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login | Latty's Cymatic Study" },
      {
        name: "description",
        content: "Secure login for administrators. Designed by Isabirye Latif.",
      },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [schoolKey, setSchoolKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError(null);

    const toastId = toast.loading("Connecting to Institutional Gateway...");

    try {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("school_key", schoolKey)
        .single();

      if (orgError || !org) {
        let msg = "Invalid School Key. Please enter a valid institutional identifier.";
        if (orgError?.message?.toLowerCase().includes("failed to fetch")) {
          msg = "Network Error: Could not connect to institutional database (Failed to fetch).";
        }
        setError(msg);
        toast.error("Connection Failed", {
          id: toastId,
          description: msg,
          action: {
            label: "Retry",
            onClick: () => {
              handleLogin();
            },
          },
        });
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !user) {
        let msg = authError?.message || "Invalid credentials.";
        if (authError?.message?.toLowerCase().includes("failed to fetch")) {
          msg = "Network Error: Authentication server unreachable (Failed to fetch).";
        }
        setError(msg);
        toast.error("Login Failed", {
          id: toastId,
          description: msg,
          action: {
            label: "Retry",
            onClick: () => {
              handleLogin();
            },
          },
        });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id, role")
        .eq("user_id", user.id)
        .single();

      if (
        profile?.org_id !== org.id ||
        (profile?.role !== "org_admin" &&
          profile?.role !== "admin" &&
          profile?.role !== "institution_admin")
      ) {
        toast.error("Access Denied", {
          id: toastId,
          description: "You are not authorized to manage this institution.",
        });
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, Admin of ${org.name}`, { id: toastId });
      navigate({ to: "/admin/dashboard" });
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred.";
      setError(msg);
      toast.error("Unexpected Error", {
        id: toastId,
        description: msg,
        action: {
          label: "Retry",
          onClick: () => {
            handleLogin();
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.1),transparent)] pointer-events-none" />

      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

        <CardHeader className="space-y-1 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">
            Institutional Gateway
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Secure command access for registered NCDC institutions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="schoolKey"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Corporate School Key
              </Label>
              <div className="relative">
                <School className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="schoolKey"
                  placeholder="e.g. kasenyi_ss"
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:ring-blue-600"
                  value={schoolKey}
                  onChange={(e) => setSchoolKey(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.ac.ug"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Command Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>

          {error && (
            <div className="mx-6 mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 animate-fade-in text-left">
              <p className="text-xs font-medium text-destructive leading-relaxed">{error}</p>
              {(error.toLowerCase().includes("failed to fetch") ||
                error.toLowerCase().includes("unreachable") ||
                error.toLowerCase().includes("network")) && (
                <button
                  type="button"
                  onClick={() => handleLogin()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/15 hover:bg-destructive/25 border border-destructive/20 px-3 py-1.5 text-xs font-bold text-destructive transition-colors text-white"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Connection
                </button>
              )}
            </div>
          )}

          <CardFooter className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest transition-all group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Engage Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="fixed bottom-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Powered by Cymatic Study Multimodal Logic Engine
        </p>
      </div>
    </div>
  );
}
