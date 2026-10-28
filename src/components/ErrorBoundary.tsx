import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || "An unexpected issue occurred" };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);

    // Send exception to Sentry telemetry
    try {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo?.componentStack },
      });
    } catch {
      // Sentry might not be initialized with active DSN
    }

    // Trigger friendly user-facing toast notification
    try {
      toast.error("A feature is temporarily unavailable. Diagnostics have been recorded.", {
        id: "global-error-toast",
        description: "You can refresh or continue using other study tools.",
        duration: 5000,
      });
    } catch {
      // Ignore if toast provider not yet mounted
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[45vh] p-6 sm:p-10 text-center bg-card text-foreground rounded-2xl border border-border/80 shadow-sm max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">
            Module Temporarily Unavailable
          </h2>
          <p className="mb-6 text-sm text-muted-foreground max-w-md leading-relaxed">
            We encountered a temporary issue while loading this section. Our system has
            automatically logged the incident for review.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button
              variant="default"
              size="sm"
              onClick={this.handleRetry}
              className="gap-2 text-xs font-semibold rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/dashboard")}
              className="gap-2 text-xs font-semibold rounded-xl"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Return to Hub
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/")}
              className="gap-2 text-xs font-semibold rounded-xl"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
