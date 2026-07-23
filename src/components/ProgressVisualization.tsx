import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { subjectLabels } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen } from "lucide-react";

interface SubjectProgress {
  subject: string;
  completed: number;
  total: number;
}

export function ProgressVisualization() {
  const [progressData, setProgressData] = useState<SubjectProgress[]>([]);

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem("cymatic_study_progress");
    const completedTopics = savedProgress ? JSON.parse(savedProgress) : {};

    // Use all subjects defined in constants
    const allSubjects = Object.keys(subjectLabels);
    const topicsPerSubject = 12; // Placeholder total topics for curriculum mapping

    const data = allSubjects.map((sub) => ({
      subject: sub,
      completed: completedTopics[sub]?.length || 0,
      total: topicsPerSubject,
    }));

    // Show a reasonable number of subjects by default, or all if requested
    setProgressData(data);
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {progressData.map((item) => {
        const percentage = Math.round((item.completed / item.total) * 100);
        return (
          <motion.div
            key={item.subject}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-zinc-900/80"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold capitalize text-white">
                  {subjectLabels[item.subject] || item.subject}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {percentage}%
              </div>
            </div>

            <Progress value={percentage} className="h-2 bg-zinc-800" />
            
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500 font-black">
              <span>{item.completed} Topics Done</span>
              <span>{item.total} Total</span>
            </div>

            {/* Decorative background element */}
            <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
          </motion.div>
        );
      })}
    </div>
  );
}
