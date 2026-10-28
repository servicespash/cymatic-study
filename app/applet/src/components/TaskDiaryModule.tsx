import React, { useState, useEffect } from "react";
import { QuizEngine, type DynamicDailyTask } from "@/lib/quiz-engine";
import { useGamificationStore } from "@/store/useGamificationStore";
import { CheckCircle2, Circle, Plus, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";

export function TaskDiaryModule() {
  const [tasks, setTasks] = useState<DynamicDailyTask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const { addXp, addCompletedTask } = useGamificationStore();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const allTasks = QuizEngine.getTasks();
      setTasks(allTasks);
    } catch {
      setTasks([]);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    QuizEngine.createManualTask({
      title: newTitle,
      description: newDesc || "Custom student study diary task.",
      subject: "Science",
      points: 20,
      taskType: "study_diary",
    });
    setNewTitle("");
    setNewDesc("");
    loadTasks();
    toast.success("Study task added to diary!");
  };

  const toggleTask = (task: DynamicDailyTask) => {
    if (task.isCompleted) return;
    const updated = QuizEngine.completeTask(task.id);
    if (updated) {
      addXp(task.points || 20);
      addCompletedTask({
        date: new Date().toISOString(),
        taskId: task.id,
        scorePct: 100,
        title: task.title,
        taskType: task.taskType || "study_diary",
      });
      toast.success(`Task completed: "${task.title}" (+${task.points || 20} XP)`);
      loadTasks();
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-6 max-w-3xl mx-auto my-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">Student & Educator Task Diary</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log, track, and complete daily science curriculum milestones and revision goals.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
          <Trophy className="h-3.5 w-3.5" />
          <span>{tasks.filter((t) => t.isCompleted).length} Completed</span>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleCreateTask} className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Add Study Diary Goal</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Task title (e.g., Revise Newton's Laws)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Description or notes..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow hover:scale-105 transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add to Task Diary
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Curriculum Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">No tasks in your diary yet. Add one above!</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task)}
              className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                task.isCompleted
                  ? "bg-success/5 border-success/30 text-muted-foreground line-through"
                  : "bg-card border-border hover:border-primary/50 text-foreground"
              }`}
            >
              <div className="flex items-start gap-3">
                <button type="button" className="mt-0.5 text-primary">
                  {task.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  )}
                </button>
                <div>
                  <h4 className="font-bold text-sm">{task.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                  +{task.points || 20} XP
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
