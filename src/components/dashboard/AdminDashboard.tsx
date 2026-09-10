import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, TrendingUp, Users, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeacherDashboard } from "./TeacherDashboard"; // Assuming it's in the same directory

interface AdminDashboardProps {
  profile: any;
  realStudents?: any[];
  loadingStudents?: boolean;
  manualTitle?: string;
  setManualTitle?: (v: string) => void;
  manualSubject?: string;
  setManualSubject?: (v: any) => void;
  manualType?: string;
  setManualType?: (v: any) => void;
  manualDesc?: string;
  setManualDesc?: (v: string) => void;
  manualExplanation?: string;
  setManualExplanation?: (v: string) => void;
  handleTeacherCreateTask?: (e: React.FormEvent) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    profile,
    realStudents = [],
    loadingStudents = false,
    manualTitle = "",
    setManualTitle = () => {},
    manualSubject = "General",
    setManualSubject = () => {},
    manualType = "quiz",
    setManualType = () => {},
    manualDesc = "",
    setManualDesc = () => {},
    manualExplanation = "",
    setManualExplanation = () => {},
    handleTeacherCreateTask = () => {},
}) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"overview" | "teacher">("overview");

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">
            Institutional Command Center
          </h2>
          <p className="text-zinc-500 text-sm">
            Total Oversight for {profile?.school_name || "Campus Network"}.
          </p>
        </div>
        <div className="flex gap-2">
            <Button
                onClick={() => setActiveView("overview")}
                className={activeView === "overview" ? "bg-indigo-600" : "bg-zinc-800"}
            >
                <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
            </Button>
            <Button
                onClick={() => setActiveView("teacher")}
                className={activeView === "teacher" ? "bg-emerald-600" : "bg-zinc-800"}
            >
                <Users className="mr-2 h-4 w-4" /> Faculty Tools
            </Button>
        </div>
      </div>

      {activeView === "overview" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl p-8 text-center space-y-4 hover:border-indigo-500/50 transition-all cursor-pointer group"
                onClick={() => navigate({ to: "/admin/dashboard" })}
                >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-white uppercase">Institutional Analytics</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                    View grade distributions, syllabus mastery rates, and teacher performance metrics
                    across all departments.
                    </p>
                </div>
                <Button variant="outline" className="w-full border-zinc-800 bg-zinc-900/50 text-zinc-300">
                    View Macro Metrics
                </Button>
                </Card>

                <Card
                className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl p-8 text-center space-y-4 hover:border-emerald-500/50 transition-all cursor-pointer group"
                onClick={() => navigate({ to: "/admin/dashboard" })}
                >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-white uppercase">Faculty Management</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                    Manage instructor access, verify licensing credentials, and identify grading
                    bottlenecks in real-time.
                    </p>
                </div>
                <Button variant="outline" className="w-full border-zinc-800 bg-zinc-900/50 text-zinc-300">
                    Manage Staff Hub
                </Button>
                </Card>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl text-center space-y-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                System Health & Operations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Latency</p>
                    <p className="text-lg font-black text-emerald-500">24ms</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Traffic</p>
                    <p className="text-lg font-black text-blue-500">Normal</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Uptime</p>
                    <p className="text-lg font-black text-white">99.9%</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Security</p>
                    <p className="text-lg font-black text-amber-500">Active</p>
                </div>
                </div>
            </div>
          </>
      ) : (
          <TeacherDashboard 
            profile={profile}
            realStudents={realStudents}
            loadingStudents={loadingStudents}
            manualTitle={manualTitle}
            setManualTitle={setManualTitle}
            manualSubject={manualSubject}
            setManualSubject={setManualSubject}
            manualType={manualType}
            setManualType={setManualType}
            manualDesc={manualDesc}
            setManualDesc={setManualDesc}
            manualExplanation={manualExplanation}
            setManualExplanation={setManualExplanation}
            handleTeacherCreateTask={handleTeacherCreateTask}
          />
      )}
    </div>
  );
};
