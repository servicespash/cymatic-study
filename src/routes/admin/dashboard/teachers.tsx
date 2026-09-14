import { createFileRoute } from "@tanstack/react-router";
import { TeacherApprovalTable } from "@/components/admin/TeacherApprovalTable";
import { InstitutionalRegistryModule } from "@/components/InstitutionalRegistryModule";
import { TeacherList } from "@/components/admin/TeacherList";

export const Route = createFileRoute("/admin/dashboard/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Faculty Management</h2>
      <TeacherList />
      <TeacherApprovalTable />
      <InstitutionalRegistryModule />
    </div>
  );
}
