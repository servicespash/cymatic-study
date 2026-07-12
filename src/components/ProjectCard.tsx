import { Project } from "@/lib/projects-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="truncate">{project.title || "Untitled Project"}</CardTitle>
        <CardDescription>{project.subject || "No Subject"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              project.status === "verified"
                ? "default"
                : project.status === "pending"
                  ? "secondary"
                  : "outline"
            }
            className={cn(
              "capitalize",
              project.status === "verified" && "bg-emerald-600 hover:bg-emerald-700",
              project.status === "pending" &&
                "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
            )}
          >
            {project.status === "pending" ? "Submitted" : project.status}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
            {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onSelect(project.id)}>
          View Project
        </Button>
      </CardFooter>
    </Card>
  );
}
