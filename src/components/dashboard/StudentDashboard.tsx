import React from "react";
import {
  BookOpen,
  Trophy,
  MessageSquare,
  Building2,
  FileText,
  Download,
  Star,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SubjectPracticeReminder } from "@/components/SubjectPracticeReminder";
import { StudentActivityDashboard } from "@/components/StudentActivityDashboard";
import { TermGoalChallengeCard } from "@/components/TermGoalChallengeCard";
import { TermProgressChart } from "@/components/TermProgressChart";
import { TermSummaryPanel } from "@/components/TermSummaryPanel";
import { SearchEngine } from "@/components/SearchEngine";
import { TaskContextMenu } from "@/components/TaskContextMenu";
import { StudyGoalsCard } from "@/components/StudyGoalsCard";
import { DisciplineNudges } from "@/components/DisciplineNudges";
import { SocraticTutorChat } from "@/components/SocraticTutorChat";
import { BreathingGuide } from "@/components/BreathingGuide";
import StudentProjectsDashboard from "@/components/StudentProjectsDashboard";
import { PastSessionsList } from "@/components/PastSessionsList";
import { MilestoneBadges } from "@/components/MilestoneBadges";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { KnowledgeGaps } from "@/components/KnowledgeGaps";
import { BadgesDashboard } from "@/components/BadgesDashboard";
import { BadgesView } from "@/components/BadgesView";

interface StudentDashboardProps {
  activeTab: string;
  setActiveTab: (v: any) => void;
  setIsPdfModalOpen: (v: boolean) => void;
  showSnoozed: boolean;
  setShowSnoozed: (v: boolean) => void;
  visibleTasks: any[];
  loadTasks: () => void;
  setSelectedExplTask: (v: any) => void;
  completeTaskAndSync: (v: any) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab,
  setActiveTab,
  setIsPdfModalOpen,
  showSnoozed,
  setShowSnoozed,
  visibleTasks,
  loadTasks,
  setSelectedExplTask,
  completeTaskAndSync,
}) => {
  return (
    <>
      <div className="space-y-6">
        <SubjectPracticeReminder />
        <StudentActivityDashboard />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <TermGoalChallengeCard />
          </div>
          <div className="md:col-span-1 flex flex-col justify-between p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/80 shadow-lg gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Academic Progress Portfolio
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Compile and export your comprehensive learning history as a verified NCDC-compliant
                report with security verification keys.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded-xl transition-all duration-200 shadow-md hover:shadow-cyan-500/20 active:scale-95 shrink-0"
              >
                <FileText className="h-4 w-4" />
                Print Portfolio Report
              </button>
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 font-bold text-xs rounded-xl transition-all duration-200 shrink-0"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <div className="space-y-4">
            <TermProgressChart />
            <TermSummaryPanel />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="border-b border-zinc-800 pb-px flex space-x-1 overflow-x-auto scrollbar-none">
          {[
            { id: "missions", label: "Lessons & Missions", icon: BookOpen },
            { id: "quizzes", label: "Quizzes & Badges", icon: Trophy },
            { id: "tutor", label: "Socratic Coach", icon: MessageSquare },
            { id: "projects", label: "Project Sandbox", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all relative shrink-0 ${
                  isActive
                    ? "text-cyan-400 bg-zinc-900/60 border-t border-x border-zinc-800/80"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeDashboardTab"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === "missions" && (
              <div className="space-y-6">
                <SearchEngine />
                <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg tracking-tight">
                        Today's Curriculum Missions
                      </h3>
                      <p className="text-zinc-500 text-xs">
                        Right-click or Long-press on any card for Priority, Snooze, or AI
                        explanation options
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSnoozed(!showSnoozed)}
                      className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-all"
                    >
                      {showSnoozed ? "Hide Snoozed" : "Show Snoozed"}
                    </button>
                  </div>

                  {visibleTasks.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                      <p className="text-sm font-semibold text-zinc-400">No missions found</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {showSnoozed
                          ? "You have no snoozed challenges currently."
                          : "All daily tasks completed! Exceptional job."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {visibleTasks.map((task, idx) => (
                        <TaskContextMenu
                          key={task.id || `task-${idx}`}
                          task={task}
                          onUpdate={loadTasks}
                          onRequestExplanation={setSelectedExplTask}
                        >
                          <motion.div
                            whileHover={{ y: -2 }}
                            className={`p-4 rounded-xl border flex flex-col justify-between h-44 relative transition-all duration-300 ${
                              task.isCompleted
                                ? "bg-zinc-950/40 border-zinc-900 text-zinc-500 opacity-60"
                                : task.priority
                                  ? "bg-gradient-to-br from-cyan-950/20 to-zinc-950 border-cyan-500/40 text-zinc-200 ring-1 ring-cyan-500/20"
                                  : "bg-zinc-950/60 border-zinc-850 text-zinc-300"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                                    task.subject === "Math"
                                      ? "bg-cyan-500/10 text-cyan-400"
                                      : task.subject === "Physics"
                                        ? "bg-violet-500/10 text-violet-400"
                                        : task.subject === "Chemistry"
                                          ? "bg-orange-500/10 text-orange-400"
                                          : "bg-emerald-500/10 text-emerald-400"
                                  }`}
                                >
                                  {task.subject}
                                </span>
                                {task.priority && (
                                  <Star className="h-4 w-4 text-cyan-400 fill-cyan-400 animate-pulse" />
                                )}
                              </div>

                              <h4 className="font-bold text-sm text-zinc-100 tracking-tight mt-2 line-clamp-1">
                                {task.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-3 leading-relaxed">
                                {task.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-zinc-500 uppercase">
                                {task.taskType.replace("_", " ")}
                              </span>
                              {task.isCompleted ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                  <CheckCircle className="h-3.5 w-3.5" /> Completed
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeTaskAndSync(task);
                                    loadTasks();
                                  }}
                                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-3 py-1 rounded-lg transition-all"
                                >
                                  Earn +{task.points} Pts
                                </button>
                              )}
                            </div>
                          </motion.div>
                        </TaskContextMenu>
                      ))}
                    </div>
                  )}
                </div>
                <StudyGoalsCard />
                <DisciplineNudges />
              </div>
            )}

            {activeTab === "quizzes" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-white font-bold text-lg tracking-tight">
                      Standard Subject Quizzes
                    </h3>
                    <p className="text-zinc-500 text-xs">
                      Test your academic competence under real Ugandan secondary assessment
                      standards.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {[
                      {
                        subject: "Math",
                        label: "Mathematics",
                        color:
                          "from-cyan-500/10 to-cyan-500/5 hover:border-cyan-500/40 border-cyan-500/25 text-cyan-400",
                      },
                      {
                        subject: "Physics",
                        label: "Physics Science",
                        color:
                          "from-violet-500/10 to-violet-500/5 hover:border-violet-500/40 border-violet-500/25 text-violet-400",
                      },
                      {
                        subject: "Chemistry",
                        label: "Chemistry Science",
                        color:
                          "from-orange-500/10 to-orange-500/5 hover:border-orange-500/40 border-orange-500/25 text-orange-400",
                      },
                      {
                        subject: "Biology",
                        label: "Biology Science",
                        color:
                          "from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/40 border-emerald-500/25 text-emerald-400",
                      },
                    ].map((q) => (
                      <button
                        key={q.subject}
                        className={`p-4 rounded-xl border bg-gradient-to-br ${q.color} text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-28`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-950/50 px-2 py-0.5 rounded self-start">
                          S1-S4
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{q.label}</h4>
                          <p className="text-[10px] text-zinc-400 mt-1">
                            Start interactive quiz assessment
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <MilestoneBadges />
                <ProgressDashboard />
                <KnowledgeGaps />
                <div className="grid gap-6 md:grid-cols-2">
                  <BadgesDashboard />
                  <BadgesView />
                </div>
              </div>
            )}

            {activeTab === "tutor" && (
              <div className="space-y-6">
                <SocraticTutorChat />
                <BreathingGuide />
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-6">
                <StudentProjectsDashboard />
                <PastSessionsList />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};
