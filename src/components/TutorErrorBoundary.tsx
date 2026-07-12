import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class TutorErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Tutor Component Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-zinc-900 rounded-3xl border border-zinc-800">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Tutor connection lost</h2>
          <p className="text-zinc-400 text-sm mb-6">
            We're having trouble maintaining the connection. Please refresh or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
          >
            Refresh Session
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
