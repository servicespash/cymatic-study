import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MainNavigation({ backTo = "/dashboard", label = "Dashboard" }: { backTo?: string, label?: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border/50 mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: backTo as any })}
        className="text-xs font-bold gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {label}
      </Button>
      <div className="flex-1" />
      <Link to="/" className="text-muted-foreground hover:text-foreground">
        <Home className="w-4 h-4" />
      </Link>
    </div>
  );
}
