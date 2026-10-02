import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // In a production app, we would log this to an error tracking service
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-zinc-950 text-white rounded-2xl border border-white/10">
          <h2 className="text-2xl font-black mb-4 tracking-tight">Access or Data Error</h2>
          <p className="mb-8 text-zinc-400 max-w-sm">
            We encountered a problem accessing your data. This might be due to insufficient
            permissions for your role or a temporary connection issue.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Return to Dashboard
            </Button>
            <Button onClick={this.handleRetry}>Retry Action</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
