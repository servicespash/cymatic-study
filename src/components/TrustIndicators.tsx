/**
 * Trust Indicators Component
 * Shows AI safety status and educational verification badges
 */

export function TrustIndicators() {
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center py-4">
      {/* Verified Educational Organization */}
      <TrustBadge
        icon="🏫"
        label="Verified Educational"
        tooltip="Latty's Cymatic Hub is a verified educational platform aligned with Uganda Secondary Curriculum"
      />

      {/* SSL/Security */}
      <TrustBadge
        icon="🔒"
        label="Secure"
        tooltip="All data is encrypted with SSL/TLS. Your information is protected."
      />

      {/* AI Audit */}
      <TrustBadge
        icon="✓"
        label="AI Audited"
        tooltip="All tutor responses are automatically audited for accuracy and quality"
      />

      {/* Content Verified */}
      <TrustBadge
        icon="📚"
        label="Content Verified"
        tooltip="Educational content is verified against Uganda curriculum standards"
      />

      {/* Privacy */}
      <TrustBadge
        icon="👤"
        label="Privacy First"
        tooltip="We respect your privacy. No data is sold to third parties."
      />
    </div>
  );
}

interface TrustBadgeProps {
  icon: string;
  label: string;
  tooltip: string;
}

function TrustBadge({ icon, label, tooltip }: TrustBadgeProps) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-help">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-950 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-950" />
      </div>
    </div>
  );
}

/**
 * Footer Trust Section
 * Shows compliance and verification info
 */
export function TrustFooter() {
  return (
    <div className="border-t border-border/60 px-4 py-6 text-center text-xs text-muted-foreground bg-gradient-to-r from-blue-500/5 to-purple-500/5">
      <div className="space-y-2 mb-3">
        <p>
          Latty&apos;s Cymatic Hub is committed to educational excellence and student safety. Our
          platform is audited for AI safety and curriculum compliance.
        </p>
        <p className="text-xs">
          For concerns or reports, contact:{" "}
          <a href="mailto:support@cymatichub.xyz" className="text-blue-500 hover:underline">
            support@cymatichub.xyz
          </a>
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 pt-3 border-t border-border/40">
        <a href="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </a>
        <span className="text-border/40">•</span>
        <a href="/terms" className="hover:text-foreground transition-colors">
          Terms of Service
        </a>
        <span className="text-border/40">•</span>
        <a href="/security" className="hover:text-foreground transition-colors">
          Security
        </a>
        <span className="text-border/40">•</span>
        <a href="/compliance" className="hover:text-foreground transition-colors">
          Compliance
        </a>
      </div>
    </div>
  );
}

/**
 * AI Audit Badge Component
 * Shows audit status for tutor responses
 */
export interface AuditBadgeProps {
  qualityScore: number;
  isValid: boolean;
  compact?: boolean;
}

export function AuditBadge({ qualityScore, isValid, compact = false }: AuditBadgeProps) {
  const getStatusColor = () => {
    if (qualityScore >= 85) return "bg-green-500/20 text-green-700 dark:text-green-400";
    if (qualityScore >= 70) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/20 text-red-700 dark:text-red-400";
  };

  const getStatusLabel = () => {
    if (qualityScore >= 85) return "Excellent";
    if (qualityScore >= 70) return "Good";
    return "Review";
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor()}`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {getStatusLabel()}
      </div>
    );
  }

  return (
    <div className={`p-2 rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold">AI Audit Status</span>
        <span className="text-sm font-bold">{qualityScore}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${
            qualityScore >= 85
              ? "bg-green-500"
              : qualityScore >= 70
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
          style={{ width: `${qualityScore}%` }}
        />
      </div>
      <p className="text-xs mt-1">{isValid ? "Response verified" : "Review recommended"}</p>
    </div>
  );
}
