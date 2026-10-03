import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Search,
  Mail,
  Calendar,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id?: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  school_id?: string;
  org_id?: string;
  school_name?: string;
  updated_at?: string;
}

export function StaffManagementTable() {
  const { orgId, organizationId, schoolName, filterByOrganization } = useOrganization();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("teacher");
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      // Safe query with fallback handling to prevent UI freezing
      let query = supabase
        .from("profiles")
        .select("*")
        .in("role", ["admin", "teacher", "head_teacher"]);

      if (orgId) {
        query = query.or(`org_id.eq.${orgId},school_name.ilike.%${schoolName}%`);
      } else if (schoolName) {
        query = query.ilike("school_name", `%${schoolName}%`);
      }

      const { data, error: queryError } = await query.order("full_name", { ascending: true });

      if (queryError) {
        console.error("Error fetching staff profiles:", queryError.message);
        setError(queryError.message);
        setStaff([]);
      } else {
        setStaff(data || []);
      }
    } catch (err: any) {
      console.error("Exception fetching staff:", err);
      setError(err.message || "Failed to load staff records.");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
  }, [orgId, schoolName]);

  const orgFiltered = filterByOrganization(staff);

  const filteredStaff = orgFiltered.filter((member) => {
    const matchesSearch =
      (member.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Staff & Administrative Directory
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage institutional personnel, roles, and RLS-secured permissions.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => void fetchStaff()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
            title="Refresh staff records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Authorize Staff
          </button>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h4 className="text-lg font-semibold mb-2">Authorize New Staff</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Pre-assign a role to an email address. When the user signs up with this email, they
              will automatically receive the assigned role.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@school.edu"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider text-muted-foreground">
                  Role Assignment
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="teacher">Teacher</option>
                  <option value="org_admin">Organization Administrator</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newEmail || !newEmail.includes("@")) {
                      toast.error("Please enter a valid email");
                      return;
                    }
                    setSubmitting(true);
                    try {
                      // Get current org id
                      const { data: profile } = await supabase
                        .from("profiles")
                        .select("organization_id")
                        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
                        .single();

                      const { error: insertError } = await supabase
                        .from("authorized_roles")
                        .insert({
                          email: newEmail.toLowerCase().trim(),
                          role: newRole,
                          organization_id: profile?.organization_id || "SCH-UG-DEFAULT",
                        });

                      if (insertError) throw insertError;

                      toast.success("Staff authorized successfully!");
                      setShowAddModal(false);
                      setNewEmail("");
                      void fetchStaff();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to authorize staff");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Authorize Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="head_teacher">Head Teachers</option>
          <option value="teacher">Teachers</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3 text-amber-600 dark:text-amber-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Database Notice:</span> {error}. Displaying available
            records safely.
          </div>
        </div>
      )}

      {/* Table / Grid */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Institution ID</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading && staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    Loading personnel records...
                  </div>
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No staff members found matching criteria.
                </td>
              </tr>
            ) : (
              filteredStaff.map((member, idx) => (
                <tr key={member.user_id || idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {member.full_name ? member.full_name.charAt(0).toUpperCase() : "S"}
                    </div>
                    {member.full_name || "Unnamed Staff"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground flex items-center gap-1.5 pt-4">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {member.email || "No email"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === "admin"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          : member.role === "head_teacher"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {member.role || "teacher"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {organizationId || member.school_id || "UG-SCH-DEFAULT"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      Active RLS
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
