import React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  MessageSquare,
  Users,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TeacherGradingStation } from "@/components/TeacherGradingStation";

interface Student {
  id: string;
  name: string;
  class: string;
  status: string;
  score: string;
  points: number;
}

interface TeacherDashboardProps {
  profile: any;
  realStudents: Student[];
  loadingStudents: boolean;
  manualTitle: string;
  setManualTitle: (v: string) => void;
  manualSubject: string;
  setManualSubject: (v: any) => void;
  manualType: string;
  setManualType: (v: any) => void;
  manualDesc: string;
  setManualDesc: (v: string) => void;
  manualExplanation: string;
  setManualExplanation: (v: string) => void;
  handleTeacherCreateTask: (e: React.FormEvent) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  profile,
  realStudents,
  loadingStudents,
  manualTitle,
  setManualTitle,
  manualSubject,
  setManualSubject,
  manualType,
  setManualType,
  manualDesc,
  setManualDesc,
  manualExplanation,
  setManualExplanation,
  handleTeacherCreateTask,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">Teacher Hub</h2>
          <p className="text-zinc-500 text-sm">
            Managing curriculum progress for {profile?.school_name || "Institutional Stream"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate({ to: "/marking" })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Open Marking Desk
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/chat" })}
            className="border-zinc-800 bg-zinc-900/50 text-zinc-300"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Class Discussions
          </Button>
        </div>
      </div>

      <div className="dashboard-grid">
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Student Roll
            </CardTitle>
            <CardDescription className="text-[10px]">
              Total learners in your assigned streams.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-black text-white">{realStudents.length}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Avg Competency
            </CardTitle>
            <CardDescription className="text-[10px]">
              Mean score across all assessments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-black text-amber-500">
              {realStudents.length > 0
                ? `${(realStudents.reduce((acc, s) => acc + parseInt(s.score), 0) / realStudents.length).toFixed(1)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Syllabus Coverage
            </CardTitle>
            <CardDescription className="text-[10px]">
              Completed curriculum milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-black text-emerald-500">
              {realStudents.length > 0
                ? `${Math.min(100, Math.round(realStudents.reduce((acc, s) => acc + (s.points || 0), 0) / (realStudents.length * 10)) + 40)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      <TeacherGradingStation />

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" /> Active Student Stream
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingStudents ? (
            <div className="col-span-2 py-12 text-center text-zinc-500 text-sm animate-pulse">
              Querying institutional database...
            </div>
          ) : realStudents.length === 0 ? (
            <div className="col-span-2 py-12 text-center border-2 border-dashed border-zinc-900 rounded-3xl text-zinc-600 italic">
              No students have linked to your school ID yet.
            </div>
          ) : (
            realStudents.map((s, idx) => (
              <Card
                key={s.id || `student-${idx}`}
                className="border-zinc-900 bg-zinc-950/40 hover:border-zinc-700 transition-colors"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-400">
                      {s.name?.substring(0, 2) || "??"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{s.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">
                        {s.class || "No Level"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] border-zinc-800 text-zinc-500">
                      {s.score}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate({ to: `/chat` })}
                      className="text-zinc-500 hover:text-white h-8 w-8 p-0"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-900">
        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2 mb-6">
          <Plus className="h-4 w-4 text-cyan-500" /> Publish S1-S4 Daily Assignment
        </h3>
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
          <form onSubmit={handleTeacherCreateTask} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Task Title</label>
              <input
                type="text"
                placeholder="e.g., Balancing Alkane Combustion Equations"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">
                Curriculum Subject
              </label>
              <select
                value={manualSubject}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setManualSubject(e.target.value as any)
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
              >
                <option value="Math">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Evaluation Type</label>
              <select
                value={manualType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setManualType(e.target.value as any)
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
              >
                <option value="quiz">Interactive Quiz</option>
                <option value="project">Project Work (PBL)</option>
                <option value="interactive_question">Student Demonstration Question</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400">
                Task Instructions & Description
              </label>
              <textarea
                placeholder="Detail the materials, clear steps, and goals of this assignment..."
                rows={3}
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400">
                AI Tutor Explanation (Pre-packaged solution)
              </label>
              <textarea
                placeholder="Explain the correct scientific concepts behind this task to assist tutoring..."
                rows={2}
                value={manualExplanation}
                onChange={(e) => setManualExplanation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
              />
            </div>

            <div className="col-span-2 pt-2">
              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11"
              >
                Publish Assignment to Dashboard
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
