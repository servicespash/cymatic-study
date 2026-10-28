import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Atom, ChevronLeft, ChevronRight, Layers, Menu, X } from "lucide-react";
import { SCIENCE_SUBJECTS } from "@/data/scienceCurriculum";

export function GlassmorphismSubjectSidebar({
  currentSubject,
  currentLevel,
  onSelectSubject,
}: {
  currentSubject?: string;
  currentLevel?: number;
  onSelectSubject?: (subjectId: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Toggle Button Bar */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-zinc-900 border-b border-zinc-800 mb-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-bold text-zinc-100 uppercase">Science Disciplines Menu</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-zinc-800 text-zinc-200 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out backdrop-blur-2xl bg-zinc-950/95 lg:bg-zinc-950/80 border-r border-zinc-800/80 flex flex-col shadow-2xl transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "w-72 lg:w-80"}`}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between border-b border-zinc-800/60">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                <Atom className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-100">Sciences Hub</h2>
                <p className="text-[10px] text-zinc-400">Senior 1 – 6 Curriculum</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subject List Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 pb-1 block">
              Science Disciplines
            </span>
          )}

          {SCIENCE_SUBJECTS.map((s) => {
            const Icon = s.icon;
            const isSelected = currentSubject === s.id;

            return (
              <button
                key={s.id}
                onClick={() => {
                  if (onSelectSubject) {
                    onSelectSubject(s.id);
                  } else {
                    navigate({ to: "/lessons", search: { subject: s.id, level: currentLevel || 1 } });
                  }
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-lg"
                    : "bg-zinc-900/40 border-zinc-800/60 text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                }`}
                title={s.title}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    isSelected ? "bg-cyan-500 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-black truncate">{s.title}</p>
                    <p className="text-[10px] font-mono text-zinc-400">{s.unebCode}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Quick Link */}
        {!isCollapsed && (
          <div className="p-4 border-t border-zinc-800/60 bg-zinc-900/30">
            <Link
              to="/developer-console"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors border border-zinc-800"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Developer Ingestion Console</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

export default GlassmorphismSubjectSidebar;
