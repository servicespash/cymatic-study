/**
 * Admin Audit Dashboard
 * Displays AI safety metrics, tutor engine audit results, and system health
 */

import { useState, useEffect } from "react";
import {
  AuditResult,
  AuditMetrics,
  generateAuditMetrics,
  getAuditSeverity,
} from "@/lib/tutor-audit";
import { AISafetyMetrics, generateAISafetyMetrics } from "@/lib/ai-safety";

interface AuditDashboardProps {
  auditResults?: AuditResult[];
  aiSafetyMetrics?: AISafetyMetrics;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export function AdminAuditDashboard({
  auditResults = [],
  aiSafetyMetrics,
  isAdmin = false,
  onRefresh,
}: AuditDashboardProps) {
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tutor" | "safety">("overview");

  useEffect(() => {
    if (auditResults.length > 0) {
      const newMetrics = generateAuditMetrics(auditResults);
      setMetrics(newMetrics);
    }
  }, [auditResults]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Admin access required to view audit dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Dashboard</h1>
          <p className="text-sm text-muted-foreground">System health and compliance monitoring</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("tutor")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "tutor"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tutor Engine
        </button>
        <button
          onClick={() => setActiveTab("safety")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "safety"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Safety
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && metrics && (
        <div className="space-y-6">
          {/* Health Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HealthCard
              label="System Health"
              value={metrics.systemHealthScore}
              max={100}
              severity={
                metrics.systemHealthScore >= 80
                  ? "pass"
                  : metrics.systemHealthScore >= 60
                    ? "warning"
                    : "critical"
              }
            />
            <HealthCard
              label="Valid Responses"
              value={metrics.validResponses}
              max={metrics.totalResponses}
              severity={
                metrics.validResponses / metrics.totalResponses >= 0.95 ? "pass" : "warning"
              }
            />
            <HealthCard
              label="Average Quality"
              value={metrics.averageQualityScore}
              max={100}
              severity={
                metrics.averageQualityScore >= 80
                  ? "pass"
                  : metrics.averageQualityScore >= 60
                    ? "warning"
                    : "critical"
              }
            />
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricBox
              title="Quality Metrics"
              metrics={[
                {
                  label: "Avg Quality Score",
                  value: metrics.averageQualityScore,
                },
                {
                  label: "Avg Accuracy Score",
                  value: metrics.averageAccuracyScore,
                },
                {
                  label: "Avg Helpfulness",
                  value: metrics.averageHelpfulnessScore,
                },
                {
                  label: "Avg Compliance",
                  value: metrics.averageComplianceScore,
                },
              ]}
            />
            <MetricBox
              title="Response Stats"
              metrics={[
                { label: "Total Responses", value: metrics.totalResponses },
                { label: "Valid Responses", value: metrics.validResponses },
                { label: "Failed Audits", value: metrics.failedAudits },
                {
                  label: "Success Rate",
                  value: Math.round((metrics.validResponses / metrics.totalResponses) * 100) || 0,
                  suffix: "%",
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tutor Engine Tab */}
      {activeTab === "tutor" && auditResults.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">Last 10 audit results</div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditResults.slice(0, 10).map((result) => {
              const severity = getAuditSeverity(result);
              const severityColors = {
                critical: "border-red-500 bg-red-50 dark:bg-red-900/20",
                warning: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
                info: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                pass: "border-green-500 bg-green-50 dark:bg-green-900/20",
              };

              return (
                <div
                  key={result.responseId}
                  className={`p-4 rounded-lg border ${severityColors[severity]}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          severity === "critical"
                            ? "bg-red-500"
                            : severity === "warning"
                              ? "bg-yellow-500"
                              : severity === "info"
                                ? "bg-blue-500"
                                : "bg-green-500"
                        }`}
                      />
                      <span className="font-semibold text-sm capitalize">{severity}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Quality</p>
                      <p className="font-semibold">{result.qualityScore}/100</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-semibold">{result.accuracyScore}/100</p>
                    </div>
                  </div>

                  {result.issues.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Issues:</p>
                      <ul className="text-xs space-y-1">
                        {result.issues.map((issue, idx) => (
                          <li key={idx} className="list-disc list-inside">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Safety Tab */}
      {activeTab === "safety" && aiSafetyMetrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SafetyCheckItem label="Canonical URLs" value={aiSafetyMetrics.hasCanonical} />
            <SafetyCheckItem label="Schema Markup" value={aiSafetyMetrics.hasSchemaMarkup} />
            <SafetyCheckItem label="Security Headers" value={aiSafetyMetrics.hasSecureHeaders} />
            <SafetyCheckItem label="Privacy Policy" value={aiSafetyMetrics.hasPrivacyPolicy} />
            <SafetyCheckItem label="Terms of Service" value={aiSafetyMetrics.hasTermsOfService} />
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Trust Score</p>
              <p className="text-2xl font-bold text-primary">{aiSafetyMetrics.trustScore}%</p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground mb-2">Last Audit</p>
            <p className="text-sm">{aiSafetyMetrics.lastAudit.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface HealthCardProps {
  label: string;
  value: number;
  max: number;
  severity: "pass" | "warning" | "critical" | "info";
}

function HealthCard({ label, value, max, severity }: HealthCardProps) {
  const percentage = (value / max) * 100;
  const bgColor =
    severity === "pass"
      ? "bg-green-100 dark:bg-green-900/20"
      : severity === "warning"
        ? "bg-yellow-100 dark:bg-yellow-900/20"
        : severity === "critical"
          ? "bg-red-100 dark:bg-red-900/20"
          : "bg-blue-100 dark:bg-blue-900/20";

  const borderColor =
    severity === "pass"
      ? "border-green-500"
      : severity === "warning"
        ? "border-yellow-500"
        : severity === "critical"
          ? "border-red-500"
          : "border-blue-500";

  return (
    <div className={`p-4 rounded-lg border ${borderColor} ${bgColor}`}>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold mb-2">
        {value}/{max}
      </p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            severity === "pass"
              ? "bg-green-500"
              : severity === "warning"
                ? "bg-yellow-500"
                : severity === "critical"
                  ? "bg-red-500"
                  : "bg-blue-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface MetricItem {
  label: string;
  value: number;
  suffix?: string;
}

interface MetricBoxProps {
  title: string;
  metrics: MetricItem[];
}

function MetricBox({ title, metrics }: MetricBoxProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
      <div className="space-y-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <span className="font-semibold">
              {metric.value}
              {metric.suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SafetyCheckItemProps {
  label: string;
  value: boolean;
}

function SafetyCheckItem({ label, value }: SafetyCheckItemProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          value ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
        }`}
      >
        {value ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
