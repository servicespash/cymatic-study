import React from "react";
import {
  Database,
  Key,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export function SupabaseSetupGuide() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const variables = [
    {
      name: "DATABASE_URL",
      label: "Direct Connection String",
      description: "Used for database migrations and server-side operations.",
      placeholder:
        "postgresql://postgres:[PASSWORD]@db.tffffvbaiccqndydsobg.supabase.co:5432/postgres",
      icon: Terminal,
    },
    {
      name: "VITE_SUPABASE_URL",
      label: "Supabase Project URL",
      description: "The API endpoint for your Supabase project.",
      placeholder: "https://tffffvbaiccqndydsobg.supabase.co",
      icon: LinkIcon,
    },
    {
      name: "VITE_SUPABASE_ANON_KEY",
      label: "Anon Public Key",
      description: "The client-side public API key.",
      placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      icon: Key,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5 shadow-glow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Supabase Configuration Prompt
          </CardTitle>
          <CardDescription>
            Configure your environment variables to establish a secure link with your database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                Critical Warning
              </p>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                Ensure you replace{" "}
                <span className="font-mono bg-amber-500/20 px-1 rounded">[PASSWORD]</span> in the
                connection string with your actual Supabase database password. Do not include{" "}
                <span className="font-mono bg-amber-500/20 px-1 rounded">psql -h</span> in the
                variable value.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {variables.map((v) => (
              <div
                key={v.name}
                className="group relative rounded-xl border border-white/5 bg-black/20 p-4 transition-all hover:bg-black/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <v.icon className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      {v.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] font-bold uppercase tracking-tighter"
                    onClick={() => copyToClipboard(v.name, v.name)}
                  >
                    {copied === v.name ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {v.name}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500">{v.description}</p>
                  <div className="font-mono text-[11px] bg-black/40 p-2 rounded-lg border border-white/5 text-primary break-all select-all">
                    {v.placeholder}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 rounded-xl h-11 font-bold shadow-glow"
              onClick={() =>
                window.open(
                  "https://supabase.com/dashboard/project/tffffvbaiccqndydsobg/settings/database",
                  "_blank",
                )
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11 font-bold border-white/10"
              onClick={() =>
                toast.info("Please set these variables in the AI Studio Settings menu.")
              }
            >
              How to set variables?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
