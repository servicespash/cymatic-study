import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, Copy, Terminal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { DeveloperDiagnosticDashboard } from "@/components/DeveloperDiagnosticDashboard";

export const Route = createFileRoute("/diagnostics")({
  component: DiagnosticsPage,
});

const REQUIRED_TABLES = [
  "profiles",
  "news_broadcasts",
  "project_submissions",
  "chat_messages",
  "organizations",
  "user_roles",
];

function DiagnosticsPage() {
  const [results, setResults] = useState<
    Record<string, { status: "loading" | "ok" | "missing"; error?: string }>
  >(Object.fromEntries(REQUIRED_TABLES.map((t) => [t, { status: "loading" }])));

  useEffect(() => {
    async function checkTables() {
      for (const table of REQUIRED_TABLES) {
        try {
          const { error } = await supabase.from(table).select("id").limit(1);
          if (error) {
            if (error.code === "PGRST205" || error.message?.includes("cache")) {
              setResults((prev) => ({ ...prev, [table]: { status: "missing" } }));
            } else if (error.message?.includes("column")) {
              // Table exists but maybe different structure, count as OK for this basic check
              setResults((prev) => ({ ...prev, [table]: { status: "ok" } }));
            } else {
              setResults((prev) => ({
                ...prev,
                [table]: { status: "missing", error: error.message },
              }));
            }
          } else {
            setResults((prev) => ({ ...prev, [table]: { status: "ok" } }));
          }
        } catch (err: any) {
          setResults((prev) => ({ ...prev, [table]: { status: "missing", error: err.message } }));
        }
      }
    }
    checkTables();
  }, []);

  const anyMissing = Object.values(results).some((r) => r.status === "missing");

  const copySql = () => {
    const sql = `-- Run this in your Supabase SQL Editor to fix missing tables
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  school_key TEXT UNIQUE,
  creator_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'verified')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  teacher_license TEXT,
  school_key TEXT,
  teacher_comments TEXT,
  phase1_score NUMERIC DEFAULT 0,
  phase2_score NUMERIC DEFAULT 0,
  phase3_score NUMERIC DEFAULT 0,
  phase4_score NUMERIC DEFAULT 0,
  total_competency_score NUMERIC DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  level TEXT,
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read organizations" ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own submissions" ON public.project_submissions FOR ALL TO authenticated USING (auth.uid() = student_user_id);
CREATE POLICY "Teachers can read all submissions" ON public.project_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read chat" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
`;
    navigator.clipboard.writeText(sql);
    toast.success("SQL copied to clipboard!");
  };

  return (
    <div className="container max-w-4xl py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          System Diagnostics
        </h1>
        <p className="text-muted-foreground">
          Checking database integrity and required tables for Cymatic Study.
        </p>
      </div>

      <div className="grid gap-6">
        <DeveloperDiagnosticDashboard />

        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>Status of required Supabase tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {REQUIRED_TABLES.map((table) => (
                <div
                  key={table}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <span className="font-mono text-sm">{table}</span>
                  {results[table].status === "loading" ? (
                    <span className="text-xs animate-pulse">Checking...</span>
                  ) : results[table].status === "ok" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <div className="flex items-center gap-2 text-rose-500">
                      <span className="text-[10px] font-bold">MISSING</span>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {anyMissing && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Action Required: Fix Database
              </CardTitle>
              <CardDescription>
                Some tables are missing. Please run the following SQL in your Supabase SQL Editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-black text-emerald-400 font-mono text-xs overflow-auto max-h-60 whitespace-pre">
                {`-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.organizations ...
CREATE TABLE IF NOT EXISTS public.project_submissions ...
CREATE TABLE IF NOT EXISTS public.chat_messages ...`}
              </div>
              <Button onClick={copySql} className="w-full gap-2">
                <Copy className="h-4 w-4" />
                Copy Full Fix SQL
              </Button>
            </CardContent>
          </Card>
        )}

        {!anyMissing && (
          <div className="p-6 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-700">All Systems Nominal</h3>
            <p className="text-sm text-emerald-600/80">
              Your database is fully migrated and ready for use.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
