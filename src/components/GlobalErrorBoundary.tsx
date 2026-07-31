import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Terminal, Download, Trash2, ShieldAlert, CheckCircle2 } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorLogs: Array<{ timestamp: string; message: string; stack?: string }>;
  showLogs: boolean;
}

const ERROR_STORAGE_KEY = "cymatic_admin_error_logs_v1";

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorLogs: [],
    showLogs: false,
  };

  public componentDidMount() {
    this.loadStoredLogs();
  }

  private loadStoredLogs() {
    try {
      const stored = localStorage.getItem(ERROR_STORAGE_KEY);
      if (stored) {
        this.setState({ errorLogs: JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to load error logs from localStorage", e);
    }
  }

  private persistErrorLog(message: string, stack?: string) {
    try {
      const newLog = {
        timestamp: new Date().toISOString(),
        message,
        stack,
      };
      const updated = [newLog, ...this.state.errorLogs].slice(0, 50); // Keep last 50
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(updated));
      this.setState({ errorLogs: updated });
    } catch (e) {
      console.error("Failed to persist error log", e);
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    this.persistErrorLog(error.message, error.stack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearLogs = () => {
    try {
      localStorage.removeItem(ERROR_STORAGE_KEY);
      this.setState({ errorLogs: [] });
    } catch (e) {
      console.error("Failed to clear logs", e);
    }
  };

  private handleExportLogs = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.errorLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `admin-error-logs-${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Failed to export logs", e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
          <div className="max-w-xl w-full bg-card border border-border rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {this.props.fallbackTitle || "Dashboard Exception Caught"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  The application caught an unexpected authentication, network, or data-fetching error.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-xl p-4 mb-6 font-mono text-xs text-rose-600 dark:text-rose-400 overflow-x-auto max-h-40">
              <p className="font-bold mb-1">Error Message:</p>
              {this.state.error?.message || "Unknown error"}
              {this.state.error?.stack && (
                <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Component State
              </button>
              <button
                onClick={() => this.setState({ showLogs: !this.state.showLogs })}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl hover:bg-secondary/80 transition-colors"
              >
                <Terminal className="w-4 h-4" />
                {this.state.showLogs ? "Hide Persistent Logs" : `View Logs (${this.state.errorLogs.length})`}
              </button>
            </div>

            {this.state.showLogs && (
              <div className="border border-border rounded-xl p-4 bg-background mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Persistent Offline Log Store ({this.state.errorLogs.length} items)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={this.handleExportLogs}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      title="Export logs JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={this.handleClearLogs}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors"
                      title="Clear logs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto text-[11px] font-mono">
                  {this.state.errorLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No stored error logs.</p>
                  ) : (
                    this.state.errorLogs.map((log, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted/50 border border-border/50">
                        <span className="text-muted-foreground">{log.timestamp}</span>
                        <p className="text-foreground font-semibold mt-0.5">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground border-t border-border pt-4 flex items-center justify-between">
              <span>Cymatic Study Offline Guard</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Local logs persisted
              </span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
