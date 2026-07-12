/**
 * Release and rollback management utility
 * Handles versioning and provides rollback capabilities for deployments
 */

export interface Release {
  version: string;
  timestamp: number;
  commit: string;
  tag: string;
  status: "active" | "archived" | "failed";
  notes?: string;
  buildUrl?: string;
}

const RELEASES_KEY = "releases-history";
const CURRENT_RELEASE_KEY = "current-release";

/**
 * Get all stored releases from localStorage
 */
export function getReleases(): Release[] {
  try {
    const stored = localStorage.getItem(RELEASES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("[v0] Failed to load releases:", e);
    return [];
  }
}

/**
 * Get the current active release
 */
export function getCurrentRelease(): Release | null {
  try {
    const stored = localStorage.getItem(CURRENT_RELEASE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("[v0] Failed to load current release:", e);
    return null;
  }
}

/**
 * Create a new release record
 */
export function createRelease(data: {
  version: string;
  commit: string;
  tag: string;
  notes?: string;
  buildUrl?: string;
}): Release {
  const release: Release = {
    version: data.version,
    timestamp: Date.now(),
    commit: data.commit,
    tag: data.tag,
    status: "active",
    notes: data.notes,
    buildUrl: data.buildUrl,
  };

  try {
    const releases = getReleases();
    releases.unshift(release);
    // Keep only last 10 releases in history
    const trimmed = releases.slice(0, 10);
    localStorage.setItem(RELEASES_KEY, JSON.stringify(trimmed));
    localStorage.setItem(CURRENT_RELEASE_KEY, JSON.stringify(release));
  } catch (e) {
    console.error("[v0] Failed to save release:", e);
  }

  return release;
}

/**
 * Rollback to a previous release version
 * This stores the rollback intent that should be handled by CI/CD
 */
export function rollbackToRelease(targetVersion: string): boolean {
  try {
    const releases = getReleases();
    const target = releases.find((r) => r.version === targetVersion);

    if (!target) {
      console.error(`[v0] Release ${targetVersion} not found`);
      return false;
    }

    // Mark target as active and store rollback request
    const updated = releases.map((r) => ({
      ...r,
      status: r.version === targetVersion ? "active" : r.status,
    }));

    localStorage.setItem(RELEASES_KEY, JSON.stringify(updated));
    localStorage.setItem(CURRENT_RELEASE_KEY, JSON.stringify(target));

    // Store rollback request for backend to process
    const rollbackRequest = {
      from: getCurrentRelease()?.version,
      to: targetVersion,
      timestamp: Date.now(),
      initiator: "user",
    };
    sessionStorage.setItem("pending-rollback", JSON.stringify(rollbackRequest));

    console.log(`[v0] Rollback request queued: ${targetVersion}`);
    return true;
  } catch (e) {
    console.error("[v0] Rollback failed:", e);
    return false;
  }
}

/**
 * Archive a release (mark as no longer deployable)
 */
export function archiveRelease(version: string): boolean {
  try {
    const releases = getReleases();
    const updated = releases.map((r) => ({
      ...r,
      status: r.version === version ? "archived" : r.status,
    }));
    localStorage.setItem(RELEASES_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("[v0] Failed to archive release:", e);
    return false;
  }
}

/**
 * Format release for display
 */
export function formatRelease(release: Release): string {
  const date = new Date(release.timestamp).toLocaleString();
  return `v${release.version} (${date}) - ${release.tag}`;
}

/**
 * Get version from build metadata
 * This should be injected at build time by CI/CD
 */
export function getBuildVersion(): string {
  return (
    (window as any).__BUILD_VERSION__ || (import.meta.env.VITE_BUILD_VERSION as string) || "0.0.0"
  );
}

/**
 * Get commit SHA from build metadata
 */
export function getBuildCommit(): string {
  return (
    (window as any).__BUILD_COMMIT__ || (import.meta.env.VITE_BUILD_COMMIT as string) || "unknown"
  );
}

/**
 * Initialize release tracking at app startup
 * Should be called once in the root component
 */
export function initializeReleaseTracking() {
  try {
    const currentRelease = getCurrentRelease();
    const buildVersion = getBuildVersion();
    const buildCommit = getBuildCommit();

    // Check if we need to create a new release record
    if (!currentRelease || currentRelease.version !== buildVersion) {
      const tag = `release-${buildVersion}`;
      createRelease({
        version: buildVersion,
        commit: buildCommit,
        tag,
        buildUrl: (import.meta.env.VITE_BUILD_URL as string) || undefined,
      });

      console.log(`[v0] Release tracking initialized: v${buildVersion}`);
    }

    // Check for pending rollback request
    const pendingRollback = sessionStorage.getItem("pending-rollback");
    if (pendingRollback) {
      const rollback = JSON.parse(pendingRollback);
      console.log(`[v0] Pending rollback detected: ${rollback.from} → ${rollback.to}`);
      // This would typically trigger a full page reload or redirect to initiate rollback
    }
  } catch (e) {
    console.error("[v0] Failed to initialize release tracking:", e);
  }
}
