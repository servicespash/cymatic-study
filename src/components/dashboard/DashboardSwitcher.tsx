import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { 
  Users, 
  ShieldAlert, 
  GraduationCap, 
  Settings, 
  FileCheck,
  LayoutDashboard,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

/**
 * DashboardSwitcher Component
 * Dynamically displays organization-specific navigation links or administrative actions
 * depending on the authenticated user's role and school linkage.
 */
export const DashboardSwitcher: React.FC = () => {
  const { role, isAdmin, isTeacher, schoolId } = useUserRole();
  const navigate = useNavigate();

  const handleRevokeAccess = async (targetUserId: string) => {
    if (!isAdmin) return;
    
    // Logic to "deactivate" or revoke institutional access
    const { error } = await supabase
      .from("profiles")
      .update({ role: "student", org_id: null })
      .eq("user_id", targetUserId);

    if (error) {
      console.error("Error revoking access:", error);
    } else {
      alert("Institutional access revoked successfully.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Management Console</h2>
          <p className="text-sm text-muted-foreground">
            {schoolId ? `Authenticated with ID: ${schoolId}` : "Personal Workspace"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Admin Specific Actions */}
        {isAdmin && (
          <>
            <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate({ to: "/admin/dashboard" })}>
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="font-bold text-sm text-foreground">Institutional Security</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Manage faculty permissions and revoke access for unauthorized accounts.</p>
            </Card>

            <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-teal-500" />
                <span className="font-bold text-sm text-foreground">Staff Directory</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Audit all active teachers and administrators linked to this school.</p>
            </Card>
          </>
        )}

        {/* Teacher Specific Actions */}
        {(isTeacher || isAdmin) && (
          <>
            <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate({ to: "/teacher/dashboard" })}>
              <div className="flex items-center gap-3 mb-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-sm text-foreground">Grading Station</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Review student submissions and award competency points.</p>
            </Card>

            <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <span className="font-bold text-sm text-foreground">Curriculum Controls</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Modify active syllabus modules for your specific classes.</p>
            </Card>
          </>
        )}

        {/* General Dashboard Link */}
        <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate({ to: "/dashboard" })}>
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-sm text-foreground">Study Hub</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Access daily tasks, news broadcasts, and personal progress logs.</p>
        </Card>
      </div>
    </div>
  );
};
