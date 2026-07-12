/**
 * Release Management Dashboard
 * Admin component for viewing releases and managing rollbacks
 * Only visible to authenticated admin users
 */

import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, GitCommit, RefreshCw } from "lucide-react";
import {
  getReleases,
  getCurrentRelease,
  rollbackToRelease,
  getBuildVersion,
  getBuildCommit,
  formatRelease,
  type Release,
} from "@/lib/releases";

export function ReleaseDashboard() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [current, setCurrent] = useState<Release | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReleases();
    const interval = setInterval(loadReleases, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  function loadReleases() {
    try {
      const allReleases = getReleases();
      const currentRelease = getCurrentRelease();
      setReleases(allReleases);
      setCurrent(currentRelease);
      setError(null);
    } catch (err) {
      setError(`Failed to load releases: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleRollback(targetVersion: string) {
    if (!confirm(`Rollback to v${targetVersion}? The page will reload.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = rollbackToRelease(targetVersion);
      if (success) {
        // Trigger page reload to apply rollback
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(`Failed to initiate rollback to v${targetVersion}`);
        setLoading(false);
      }
    } catch (err) {
      setError(`Rollback error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setLoading(false);
    }
  }

  const buildVersion = getBuildVersion();
  const buildCommit = getBuildCommit();

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-md">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Release Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage releases and perform rollbacks if needed
        </p>
      </div>

      {/* Current Release */}
      <div className="mb-6 rounded-lg bg-primary/5 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Current Release</h3>
            {current ? (
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Version:</span>{" "}
                  <span className="font-mono font-semibold text-foreground">
                    v{current.version}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Commit:</span>{" "}
                  <code className="break-all rounded bg-background px-2 py-1 font-mono text-xs">
                    {current.commit}
                  </code>
                </p>
                <p>
                  <span className="text-muted-foreground">Tag:</span>{" "}
                  <code className="rounded bg-background px-2 py-1 font-mono text-xs">
                    {current.tag}
                  </code>
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      current.status === "active"
                        ? "bg-green-500/20 text-green-700"
                        : current.status === "archived"
                          ? "bg-gray-500/20 text-gray-700"
                          : "bg-red-500/20 text-red-700"
                    }`}
                  >
                    {current.status === "active" && <CheckCircle2 className="h-3 w-3" />}
                    {current.status}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Released:</span>{" "}
                  <span className="text-xs">{new Date(current.timestamp).toLocaleString()}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No release information available</p>
            )}
          </div>
          <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
        </div>
      </div>

      {/* Build Metadata */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">Build Version</p>
          <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
            {buildVersion}
          </p>
        </div>
        <div className="rounded border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">Build Commit</p>
          <p className="mt-1 break-all font-mono text-xs font-semibold text-foreground">
            {buildCommit}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Release History */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Release History</h3>
          <button
            onClick={loadReleases}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {releases.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No releases found. Trigger a build to create a release.
          </p>
        ) : (
          <div className="space-y-2">
            {releases.map((release, index) => (
              <div
                key={`${release.version}-${release.timestamp}`}
                className="flex items-center justify-between rounded border border-border/50 bg-background/30 p-3 hover:bg-background/50 transition-colors"
                onClick={() =>
                  setSelectedVersion(selectedVersion === release.version ? null : release.version)
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      v{release.version}
                    </span>
                    {index === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    )}
                    {release.status === "archived" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/20 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        Archived
                      </span>
                    )}
                    {release.status === "failed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Failed
                      </span>
                    )}
                  </div>

                  {selectedVersion === release.version && (
                    <div className="mt-3 space-y-2 border-t border-border/30 pt-3 text-xs text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <GitCommit className="h-3 w-3" />
                        <code className="font-mono">{release.commit.slice(0, 12)}</code>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(release.timestamp).toLocaleString()}
                      </p>
                      {release.notes && (
                        <p className="whitespace-pre-wrap rounded bg-background/50 p-2 font-mono text-xs">
                          {release.notes}
                        </p>
                      )}
                      {release.buildUrl && (
                        <p>
                          <a
                            href={release.buildUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View build →
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {index > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRollback(release.version);
                    }}
                    disabled={loading}
                    className="ml-2 inline-flex items-center gap-2 rounded bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-secondary/20 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Rollback
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 border-t border-border/50 pt-4">
        <p className="text-xs font-semibold text-muted-foreground">
          ⚠️ Rollback will reload the page. Only use if current version is broken.
        </p>
      </div>
    </div>
  );
}
