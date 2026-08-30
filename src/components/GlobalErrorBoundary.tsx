import React, { Component, type ErrorInfo, type ReactNode } from "react";
import {
  RefreshCw,
  RotateCcw,
  Home,
  Terminal,
  Download,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  ArrowDown,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  onReset?: () => void;
  showHomeButton?: boolean;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorLogs: Array<{ timestamp: string; message: string; stack?: string }>;
  showLogs: boolean;
  copied: boolean;
}

const ERROR_STORAGE_KEY = "cymatic_error_logs_v2";

/**
 * Animated High-End Apologetic Panda Mascot
 * Expresses heartfelt sorrow and cute animation while gesturing towards the retry button.
 */
function PandaApologyMascot() {
  return (
    <div className="relative flex flex-col items-center justify-center select-none" id="panda-apology-mascot">
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 transition-transform duration-500 hover:scale-105">
        {/* Soft Ambient Glow */}
        <div className="absolute -inset-3 bg-gradient-to-tr from-amber-500/20 via-primary/20 to-rose-500/20 rounded-full blur-2xl animate-pulse opacity-70" />

        {/* Vector SVG Panda */}
        <svg
          viewBox="0 0 200 200"
          className="relative w-full h-full drop-shadow-xl overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Panda Ears */}
          <g className="transition-transform duration-700 hover:rotate-3">
            {/* Left Ear */}
            <circle cx="52" cy="52" r="28" fill="#1e293b" />
            <circle cx="52" cy="52" r="14" fill="#334155" />
            {/* Right Ear */}
            <circle cx="148" cy="52" r="28" fill="#1e293b" />
            <circle cx="148" cy="52" r="14" fill="#334155" />
          </g>

          {/* Panda Head Base */}
          <ellipse cx="100" cy="110" rx="68" ry="60" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="3" />

          {/* Apologetic / Bowing Eyebrows */}
          <path
            d="M 58 78 Q 72 70 82 82"
            stroke="#1e293b"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 142 78 Q 128 70 118 82"
            stroke="#1e293b"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Eye Patches (Droopy/Sad angle) */}
          <ellipse cx="72" cy="98" rx="20" ry="24" transform="rotate(-15 72 98)" fill="#1e293b" />
          <ellipse cx="128" cy="98" rx="20" ry="24" transform="rotate(15 128 98)" fill="#1e293b" />

          {/* Sparkly, apologetic eyes */}
          <circle cx="74" cy="96" r="8" fill="#ffffff" />
          <circle cx="77" cy="94" r="3.5" fill="#0f172a" />
          <circle cx="73" cy="98" r="2" fill="#ffffff" />

          <circle cx="126" cy="96" r="8" fill="#ffffff" />
          <circle cx="123" cy="94" r="3.5" fill="#0f172a" />
          <circle cx="127" cy="98" r="2" fill="#ffffff" />

          {/* Teardrop / Sweatdrop of apology */}
          <g className="animate-bounce" style={{ animationDuration: "2s" }}>
            <path
              d="M 152 90 C 152 86, 156 80, 156 80 C 156 80, 160 86, 160 90 C 160 93, 156.5 96, 156 96 C 155.5 96, 152 93, 152 90 Z"
              fill="#38bdf8"
            />
          </g>

          {/* Rosy Cheeks */}
          <circle cx="58" cy="118" r="9" fill="#f43f5e" opacity="0.3" />
          <circle cx="142" cy="118" r="9" fill="#f43f5e" opacity="0.3" />

          {/* Panda Nose & Mouth */}
          <ellipse cx="100" cy="115" rx="8" ry="6" fill="#1e293b" />
          {/* Apologetic wavy cute mouth */}
          <path
            d="M 92 126 Q 100 120 108 126"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Apologetic Paws clasping together */}
          <g className="transition-all">
            <ellipse cx="82" cy="154" rx="16" ry="14" fill="#1e293b" />
            <ellipse cx="118" cy="154" rx="16" ry="14" fill="#1e293b" />
            {/* Paw pads */}
            <circle cx="82" cy="154" r="6" fill="#475569" />
            <circle cx="118" cy="154" r="6" fill="#475569" />
          </g>
        </svg>

        {/* Apology Speech Bubble */}
        <div className="absolute -top-3 -right-6 sm:-right-8 bg-amber-500 text-white font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-full shadow-lg border border-amber-300 flex items-center gap-1 animate-pulse">
          <span>🥺 So Sorry!</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Global React Error Boundary with an expressive Mascot, diagnostic logs,
 * automatic local caching, and seamless retry & reset controls.
 */
export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  public state: GlobalErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorLogs: [],
    showLogs: false,
    copied: false,
  };

  public componentDidMount() {
    this.loadStoredLogs();
  }

  private loadStoredLogs() {
    try {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem(ERROR_STORAGE_KEY);
      if (stored) {
        this.setState({ errorLogs: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn("Could not retrieve error logs from localStorage", e);
    }
  }

  private persistErrorLog(message: string, stack?: string) {
    try {
      if (typeof window === "undefined") return;
      const newLog = {
        timestamp: new Date().toISOString(),
        message,
        stack,
      };
      const updated = [newLog, ...this.state.errorLogs].slice(0, 50);
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(updated));
      this.setState({ errorLogs: updated });
    } catch (e) {
      console.warn("Failed to persist error log in localStorage", e);
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[GlobalErrorBoundary] Caught runtime exception:", error, errorInfo);
    this.setState({ errorInfo });
    this.persistErrorLog(error.message, error.stack);
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null, showLogs: false });
  };

  private handleHardReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  private handleCopyDetails = async () => {
    const { error, errorInfo } = this.state;
    const report = `[Cymatic Study Error Report]\nDate: ${new Date().toISOString()}\nMessage: ${error?.message || "Unknown error"}\nStack: ${error?.stack || "N/A"}\nComponent Stack: ${errorInfo?.componentStack || "N/A"}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(report);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      }
    } catch (e) {
      console.error("Failed to copy error report to clipboard", e);
    }
  };

  private handleClearLogs = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ERROR_STORAGE_KEY);
      }
      this.setState({ errorLogs: [] });
    } catch (e) {
      console.error("Failed to clear logs", e);
    }
  };

  private handleExportLogs = () => {
    try {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(this.state.errorLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `cymatic-error-logs-${new Date().toISOString().slice(0, 10)}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Failed to export logs", e);
    }
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || "Oops! Something Went Sideways";
      const subtitle =
        this.props.fallbackSubtitle ||
        "Our friendly panda mascot is deeply sorry. An unexpected runtime hiccup interrupted the view, but you can safely restore it below.";

      return (
        <div
          className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 select-none"
          id="global-error-boundary-screen"
        >
          <div className="max-w-xl w-full bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-sm">
            {/* Top Decorative Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-primary to-rose-500" />

            {/* Panda Apology Mascot Graphic */}
            <div className="pt-2 flex justify-center">
              <PandaApologyMascot />
            </div>

            {/* Title & Message */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                {subtitle}
              </p>
            </div>

            {/* Pointer / Highlight pointing at Retry Action */}
            <div className="flex flex-col items-center gap-1.5 py-1 text-primary animate-bounce">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Click below to resume your session
              </span>
              <ArrowDown className="w-4 h-4 text-primary" />
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <Button
                id="btn-error-retry"
                onClick={this.handleReset}
                size="lg"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-6 text-sm font-black rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Retry & Resume App
              </Button>

              <Button
                id="btn-error-hard-reload"
                onClick={this.handleHardReload}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-6 text-xs font-bold rounded-2xl border-border/80 hover:bg-muted"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reload Page
              </Button>

              {(this.props.showHomeButton ?? true) && (
                <Button
                  id="btn-error-home"
                  onClick={this.handleGoHome}
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-6 text-xs font-bold rounded-2xl hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Home className="w-3.5 h-3.5" />
                  Dashboard
                </Button>
              )}
            </div>

            {/* Collapsible Error Diagnosis & Debug Logs */}
            <div className="border border-border/60 rounded-2xl bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Technical Diagnostics</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={this.handleCopyDetails}
                    className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1 font-semibold"
                    title="Copy Error Report"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => this.setState({ showLogs: !this.state.showLogs })}
                    className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1 font-semibold"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{this.state.showLogs ? "Hide" : "Details"}</span>
                  </button>
                </div>
              </div>

              {/* Message preview */}
              <div className="font-mono text-[11px] text-rose-600 dark:text-rose-400 bg-background/80 p-2.5 rounded-xl border border-border/50 truncate">
                {this.state.error?.message || "Unknown component runtime exception"}
              </div>

              {/* Detailed View */}
              {this.state.showLogs && (
                <div className="space-y-3 pt-2">
                  {this.state.error?.stack && (
                    <div className="bg-background border border-border/70 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {this.state.error.stack}
                    </div>
                  )}

                  {/* Stored Log History Header */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Stored Error History ({this.state.errorLogs.length})</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={this.handleExportLogs}
                        className="hover:text-foreground flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3 h-3" /> Export JSON
                      </button>
                      <button
                        onClick={this.handleClearLogs}
                        className="hover:text-rose-500 flex items-center gap-1 font-medium text-rose-500/80"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Support Tag */}
            <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
              <HelpCircle className="w-3 h-3" />
              <span>Need further assistance? Reach out to support@cymatichub.xyz</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
