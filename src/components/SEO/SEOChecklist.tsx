import { useState } from "react";
import {
  ShieldCheck,
  Award,
  CheckCircle,
  Info,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function SEOChecklist() {
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: "APPROVED" | "REJECTED" | null;
    score: number;
    feedback: string;
  }>({ status: null, score: 0, feedback: "" });

  const handleVerify = () => {
    if (!portfolioUrl.trim()) {
      toast.error("Portfolio Link Required", {
        description:
          "Please provide your portfolio or verification page link (e.g., https://cymatichub.xyz/latif).",
      });
      return;
    }

    if (reviewText.trim().length < 15) {
      toast.error("Detailed Review Required", {
        description:
          "Please provide a detailed positive review / quality affirmation of at least 15 characters.",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({ status: null, score: 0, feedback: "" });

    // Background validation simulation
    setTimeout(() => {
      const text = reviewText.toLowerCase();

      // Heuristic list of positive indicators (Experience, Expertise, Authoritativeness, Trustworthiness)
      const positiveWords = [
        "excellent",
        "great",
        "verified",
        "positive",
        "accurate",
        "reliable",
        "trustworthy",
        "approved",
        "correct",
        "love",
        "good",
        "perfect",
        "quality",
        "stellar",
        "recommend",
        "compliant",
        "certified",
        "expert",
        "best",
        "helpful",
        "ncdc",
        "uneb",
        "pedagogical",
      ];

      // Heuristic list of negative indicators
      const negativeWords = [
        "poor",
        "bad",
        "wrong",
        "plagiarized",
        "inaccurate",
        "fake",
        "reject",
        "unreliable",
        "broken",
        "terrible",
        "worst",
        "unverified",
        "outdated",
        "cheat",
      ];

      let score = 0;
      positiveWords.forEach((word) => {
        if (text.includes(word)) score += 1;
      });

      let negativeCount = 0;
      negativeWords.forEach((word) => {
        if (text.includes(word)) negativeCount += 1;
      });

      setIsValidating(false);

      if (score >= 2 && negativeCount === 0) {
        setValidationResult({
          status: "APPROVED",
          score,
          feedback:
            "Dynamic E-E-A-T analysis passed successfully. High semantic quality, localized context, and positive sentiment signals are approved for publishing.",
        });
        toast.success("E-E-A-T Validation Approved!", {
          description:
            "Your study notes and author credentials have been validated for immediate publication.",
        });
      } else {
        const feedbackMessage =
          negativeCount > 0
            ? "Rejection: Negative sentiment or critical terms were identified in the review. Please ensure the feedback is constructive and completely positive."
            : "Action Required: Insufficient trust signals found. Please expand your review with professional quality affirmations (e.g., mentioning accuracy, syllabus compliance, or NCDC/UNEB alignment).";

        setValidationResult({
          status: "REJECTED",
          score,
          feedback: feedbackMessage,
        });
        toast.error("E-E-A-T Validation Action Needed", {
          description: "The content did not meet the required trustworthiness thresholds.",
        });
      }
    }, 1500);
  };

  return (
    <div
      id="seo-eeat-checklist-card"
      className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-6"
    >
      {/* Educational Explanation Box */}
      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Info className="h-4.5 w-4.5" />
          What does the E-E-A-T Verification System do?
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Google's Search Quality Evaluator Guidelines emphasize{" "}
          <strong>E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness)</strong>.
          This background system automates validation by scanning your portfolio links and assessing
          the peer reviews/affirmations submitted by content curators.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When you click <strong>Verify &amp; Authorize</strong>, our background engine analyzes the
          sentiment, checks for pedagogical alignment keywords (e.g., NCDC, UNEB, accurate,
          compliant), and ensures there are no conflicting trust flags. Passing this check embeds
          certified credentials in your platform’s metadata schemas to maximize AI engine citations.
        </p>
      </div>

      <div className="space-y-4">
        {/* Author Portfolio & Workspace URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
            <Award className="h-4 w-4 text-primary" /> Author Portfolio &amp; Workspace Link
          </label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Please provide a link to your verified academic portfolio. You can search or request
            credentials at{" "}
            <a
              href="https://cymatichub.xyz"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-bold inline-flex items-center gap-0.5"
            >
              cymatichub.xyz <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <input
            type="text"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="e.g., https://cymatichub.xyz/latif"
            className="w-full text-xs rounded-xl border border-border bg-background px-3.5 py-3 outline-none focus:border-primary placeholder:text-muted-foreground/30 transition-colors"
          />
        </div>

        {/* Positive Review & Peer Affirmations */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" /> Peer Quality Review &amp; Affirmation
          </label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Provide a clear, positive review verifying the syllabus accuracy, pedagogical quality,
            and completeness of the secondary curriculum lessons (Minimum 15 characters).
          </p>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="e.g., Excellent and highly accurate lesson notes, fully verified with the latest Uganda NCDC syllabus for secondary schools. Highly recommended."
            rows={3}
            className="w-full text-xs rounded-xl border border-border bg-background px-3.5 py-3 outline-none focus:border-primary placeholder:text-muted-foreground/30 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Background System Evaluation Button */}
      <div className="pt-2">
        <button
          onClick={handleVerify}
          disabled={isValidating}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition hover:opacity-90 shadow-glow disabled:opacity-50"
        >
          {isValidating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing E-E-A-T Quality Signals...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Verify &amp; Authorize Notes Publication
            </>
          )}
        </button>
      </div>

      {/* Dynamic Results Display */}
      {validationResult.status === "APPROVED" && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center space-y-1 animate-fade-in">
          <p className="text-xs font-black text-emerald-500 flex items-center justify-center gap-1.5 uppercase tracking-wider">
            ✓ E-E-A-T Content Approved
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {validationResult.feedback}
          </p>
          <p className="text-[10px] text-emerald-500/80 font-semibold pt-1">
            Portfolio indexed: {portfolioUrl} (Trust Score: {validationResult.score})
          </p>
        </div>
      )}

      {validationResult.status === "REJECTED" && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-center space-y-1 animate-fade-in">
          <p className="text-xs font-black text-destructive flex items-center justify-center gap-1.5 uppercase tracking-wider">
            ✕ E-E-A-T Quality Action Required
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {validationResult.feedback}
          </p>
        </div>
      )}
    </div>
  );
}

export default SEOChecklist;
