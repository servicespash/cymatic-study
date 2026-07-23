import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { MarkingDesk } from "@/components/MarkingDesk";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/marking")({
  head: () => ({
    meta: [
      { title: "Teacher Marking Desk | Cymatic Study" },
      { name: "description", content: "Review and verify student project work." },
    ],
  }),
  component: MarkingPage,
});

function MarkingPage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-zinc-500">
        Initializing Marking Terminal...
      </div>
    );
  }

  const role = profile?.role ?? "";
  const isAuthorized = [
    "teacher",
    "independent_teacher",
    "school_admin",
    "admin",
    "institution_admin",
  ].includes(role);

  if (!user || !isAuthorized) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Access Restricted
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            The Marking Desk is a restricted faculty-only terminal. If you are a teacher, please
            ensure your account has been verified by your school administrator.
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-400 px-2 text-[10px] uppercase font-bold tracking-widest"
              >
                Faculty Terminal
              </Badge>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                Session Active
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              Assessment Command
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-zinc-300">{profile?.display_name}</p>
            <p className="text-[10px] text-zinc-600 font-mono">
              {profile?.role?.replace("_", " ").toUpperCase()}
            </p>
          </div>
        </header>

        <MarkingDesk />
      </div>
    </div>
  );
}
