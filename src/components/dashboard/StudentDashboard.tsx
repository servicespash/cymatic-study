import React from "react";
import {
  BookOpen,
  Trophy,
  MessageSquare,
  Building2,
  TrendingUp,
  Zap,
  Bookmark,
  X,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SubjectPracticeReminder } from "@/components/SubjectPracticeReminder";
import { SearchEngine } from "@/components/SearchEngine";
import { TaskContextMenu } from "@/components/TaskContextMenu";
import { StudyGoalsCard } from "@/components/StudyGoalsCard";
import { DisciplineNudges } from "@/components/DisciplineNudges";
import { SocraticTutorChat } from "@/components/features/tutor/SocraticTutorChat";
import { BreathingGuide } from "@/components/BreathingGuide";
import StudentProjectsDashboard from "@/components/StudentProjectsDashboard";
import { PastSessionsList } from "@/components/PastSessionsList";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

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
    <div className="space-y-8">
      <SubjectPracticeReminder />

      {/* Dashboard Navigation */}
      <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "missions" && (
            <MissionsTab
              visibleTasks={visibleTasks}
              showSnoozed={showSnoozed}
              setShowSnoozed={setShowSnoozed}
              loadTasks={loadTasks}
              setSelectedExplTask={setSelectedExplTask}
              completeTaskAndSync={completeTaskAndSync}
            />
          )}
          {activeTab === "quizzes" && <QuizzesTab />}
          {activeTab === "tutor" && <TutorTab />}
          {activeTab === "projects" && <ProjectsTab />}
          {activeTab === "saved" && <SavedItemsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const DashboardNav = ({ activeTab, setActiveTab }: any) => (
  <div className="flex items-center justify-between bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 flex-wrap gap-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
        <Zap className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white">Active Learning Flow</h2>
        <p className="text-[10px] text-zinc-500">Pick up where you left off</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Link to="/student/progress">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-zinc-700 bg-zinc-800 text-zinc-300 text-[10px] font-bold h-9 gap-2"
        >
          <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
          View Progress
        </Button>
      </Link>
      <button
        onClick={() => (window.location.href = "/")}
        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
      >
        <X className="h-4 w-4" />
        Exit
      </button>
    </div>
  </div>
);

const MissionsTab = ({ visibleTasks, showSnoozed, setShowSnoozed, loadTasks, setSelectedExplTask, completeTaskAndSync }: any) => (
  <div className="space-y-6">
    <SearchEngine />
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg tracking-tight">
            Today's Curriculum Missions
          </h3>
          <p className="text-zinc-500 text-xs">
            Right-click or Long-press on any card for AI explanation options
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
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleTasks.map((task: any, idx: number) => (
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
                      <Zap className="h-4 w-4 text-cyan-400 fill-cyan-400 animate-pulse" />
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
                      onClick={(e: any) => {
                        e.stopPropagation();
                        completeTaskAndSync(task);
                        loadTasks();
                      }}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-3 py-1 rounded-lg"
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
);

const QuizzesTab = () => (
  <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
    <div>
      <h3 className="text-white font-bold text-lg tracking-tight">
        Standard Subject Quizzes
      </h3>
      <p className="text-zinc-500 text-xs">
        Test your academic competence under real secondary assessment standards.
      </p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {[
        {
          subject: "Math",
          label: "Mathematics",
          color: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/25 text-cyan-400",
        },
        {
          subject: "Physics",
          label: "Physics Science",
          color: "from-violet-500/10 to-violet-500/5 border-violet-500/25 text-violet-400",
        },
        {
          subject: "Chemistry",
          label: "Chemistry Science",
          color: "from-orange-500/10 to-orange-500/5 border-orange-500/25 text-orange-400",
        },
        {
          subject: "Biology",
          label: "Biology Science",
          color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/25 text-emerald-400",
        },
      ].map((q) => (
        <button
          key={q.subject}
          className={`p-4 rounded-xl border bg-gradient-to-br ${q.color} text-left transition-all h-28 flex flex-col justify-between`}
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
);
const TutorTab = () => <div className="space-y-6"><SocraticTutorChat /><BreathingGuide /></div>;
const ProjectsTab = () => <div className="space-y-6"><StudentProjectsDashboard /><PastSessionsList /></div>;
const SavedItemsTab = () => <div className="p-8 text-center text-zinc-500">Saved Items feature coming soon.</div>;

export default StudentDashboard;
