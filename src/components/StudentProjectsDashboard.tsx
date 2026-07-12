import { useProjects } from "@/lib/projects-store";
import { ProjectCard } from "./ProjectCard";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

export default function StudentProjectsDashboard() {
  const { list, create } = useProjects();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Active Projects</h2>
        <Button
          size="sm"
          onClick={() => {
            const p = create({ title: "New Project" });
            navigate({ to: "/projects", search: { id: p.id } });
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-2xl text-muted-foreground">
          No active projects yet. Start a new one to begin your PBL journey!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onSelect={(id) => navigate({ to: "/projects", search: { id } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
