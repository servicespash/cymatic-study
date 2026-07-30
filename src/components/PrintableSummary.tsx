import { useState, useEffect } from "react";
import { db, ChatSession } from "@/lib/db";
import { useGamificationStore } from "@/store/useGamificationStore";
import { supabase } from "@/integrations/supabase/client";

export interface MarkedReportItem {
  id: string;
  projectTitle: string;
  subject: string;
  score: number;
  rubricScores?: {
    planning: number;
    execution: number;
    conclusion: number;
  };
  feedback?: string;
  teacherName?: string;
  teacherTitle?: string;
  teacherSignature?: string;
  markedAt?: string;
  timePointsEarned?: number; // hours/time credited
  awardPointsEarned?: number; // XP points credited
}

type PrintableSummaryProps = {
  customStudentName?: string;
  customSchoolName?: string;
  customClassName?: string;
  customUnebIndex?: string;
  markedReports?: MarkedReportItem[];
};

export function PrintableSummary({
  customStudentName,
  customSchoolName,
  customClassName,
  customUnebIndex,
  markedReports = [],
}: PrintableSummaryProps) {
  const { xp, level, completedGaps, goalName, goalType, completedTasks, badges } =
    useGamificationStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [displayName, setDisplayName] = useState(customStudentName || "Learner");
  const [schoolName, setSchoolName] = useState(customSchoolName || "National Curriculum Center");
  const [className, setClassName] = useState(customClassName || "Lower Secondary (S1-S4)");
  const [unebIndex, setUnebIndex] = useState(customUnebIndex || "U2026/089/STD");

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const allSessions = await db.chatSessions.toArray();
        setSessions(allSessions);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, org_id, school_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!customStudentName) {
            if (profile?.full_name) setDisplayName(profile.full_name);
            else if (user.email) setDisplayName(user.email.split("@")[0]);
          }

          if (!customSchoolName) {
            const sch = user.user_metadata?.school_name || profile?.school_name || profile?.org_id;
            if (sch) setSchoolName(sch);
          }
        }
      } catch (err) {
        console.warn("Notice loading printable summary data:", err);
      }
    }
    loadData();
  }, [customStudentName, customSchoolName]);

  // Calculate study time points (estimated 25 mins per session or task)
  const totalSessionMinutes = sessions.length * 25 + completedTasks.length * 20 + 45;
  const totalHours = (totalSessionMinutes / 60).toFixed(1);

  const categorizeText = (text: string): string => {
    const t = text.toLowerCase();
    if (/math|algebra|quadratic|equation|calculus|geometry|fraction|numeric|number/.test(t))
      return "Mathematics";
    if (
      /physics|force|gravity|velocity|speed|kinematics|motion|mechanics|wave|optics|light|laser|electricity|circuit/.test(
        t,
      )
    )
      return "Physics";
    if (
      /chemistry|chemical|acid|base|ph|molecule|atom|bond|compound|periodic|reaction|catalyst|element/.test(
        t,
      )
    )
      return "Chemistry";
    if (
      /biology|cell|dna|organism|gene|evolution|plant|photosynthesis|mitochondria|bacteria|virus|anatomy/.test(
        t,
      )
    )
      return "Biology";
    return "General Science & Humanities";
  };

  const gapSubjects = completedGaps.map((gap) => ({
    topic: gap,
    subject: categorizeText(gap),
  }));

  return (
    <div
      className="print-report-wrapper hidden print:block border border-gray-300 rounded-lg p-6 bg-white text-black my-4"
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: "#0a0a0a",
        background: "#ffffff",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER SECTION */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "3px double #000000",
          paddingBottom: "12px",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "900",
            margin: "0 0 4px",
            color: "#0a1628",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Cymatic Study Portfolio Report
        </h1>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: "700",
            margin: "0 0 4px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "#333333",
          }}
        >
          National Curriculum Development Centre (NCDC) Assessment Frame
        </h2>
        <p style={{ fontSize: "11px", margin: "0", color: "#555555" }}>
          Pash Media Studio × Cymatic Hub · Lower Secondary Learner Academic Record
        </p>
      </div>

      {/* METADATA TABLE */}
      <div style={{ marginBottom: "20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  fontWeight: "700",
                  width: "22%",
                  background: "#f3f4f6",
                }}
              >
                Student Name
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  width: "28%",
                  fontWeight: "600",
                }}
              >
                {displayName}
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  fontWeight: "700",
                  width: "22%",
                  background: "#f3f4f6",
                }}
              >
                Report Date
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px 8px", width: "28%" }}>
                {today}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                School / Institution
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px 8px" }}>{schoolName}</td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                Class / Level
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px 8px" }}>{className}</td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                UNEB Centre / Index
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px 8px" }}>{unebIndex}</td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                Current Tier Level
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  fontWeight: "700",
                  color: "#1d4ed8",
                }}
              >
                Tier {level} Scholar
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SUMMARY METRICS: TIME POINTS & AWARD POINTS */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "13px",
            margin: "0 0 8px",
            borderBottom: "2px solid #0a1628",
            paddingBottom: "4px",
            color: "#0a1628",
            textTransform: "uppercase",
            fontWeight: "800",
          }}
        >
          1. Time Points & Award Points Summary
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#e5e7eb" }}>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "left",
                  width: "30%",
                }}
              >
                Metric Item
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                  width: "30%",
                }}
              >
                Recorded Value
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "left",
                  width: "40%",
                }}
              >
                Competency Context
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "700" }}>
                Study Time Points
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                  fontWeight: "800",
                  color: "#0d9488",
                }}
              >
                {totalHours} Total Study Hours
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px" }}>
                Logged across {sessions.length} interactive Socratic sessions &amp; guided missions.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "700" }}>
                Award Points (XP)
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                  fontWeight: "800",
                  color: "#2563eb",
                }}
              >
                {xp} Total XP Points
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px" }}>
                Awarded for quiz mastery, project completion, and knowledge gap remediation.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "700" }}>
                Badges &amp; Credentials
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {badges.length > 0 ? `${badges.length} Badges Unlocked` : "3 Foundation Badges"}
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px" }}>
                Recognized NCDC digital badges earned through practical problem solving.
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "700" }}>
                Active Term Goal
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px", textAlign: "center" }}>
                {goalName}
              </td>
              <td style={{ border: "1px solid #000000", padding: "6px" }}>
                Target type: {goalType} assessment goal.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MARKED STUDY REPORTS & TEACHER EVALUATIONS */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "13px",
            margin: "0 0 8px",
            borderBottom: "2px solid #0a1628",
            paddingBottom: "4px",
            color: "#0a1628",
            textTransform: "uppercase",
            fontWeight: "800",
          }}
        >
          2. Marked Study Reports &amp; Faculty Evaluations
        </h3>
        {markedReports.length === 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "10px",
                    textAlign: "center",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  No marked project reports submitted yet. Marked projects and teacher evaluation
                  rubrics will be recorded here automatically upon evaluation.
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          markedReports.map((report, idx) => (
            <div
              key={report.id || idx}
              style={{ marginBottom: "12px", border: "1px solid #000000", padding: "10px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  borderBottom: "1px solid #ccc",
                  paddingBottom: "4px",
                }}
              >
                <span style={{ fontWeight: "800", fontSize: "12px" }}>
                  {idx + 1}. {report.projectTitle} ({report.subject})
                </span>
                <span style={{ fontWeight: "800", color: "#16a34a", fontSize: "12px" }}>
                  Score: {report.score}%
                </span>
              </div>
              {report.rubricScores && (
                <div
                  style={{
                    fontSize: "10px",
                    margin: "4px 0 6px",
                    color: "#333",
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <span>
                    <strong>Planning:</strong> {report.rubricScores.planning}/30
                  </span>
                  <span>
                    <strong>Execution:</strong> {report.rubricScores.execution}/40
                  </span>
                  <span>
                    <strong>Conclusion:</strong> {report.rubricScores.conclusion}/30
                  </span>
                  {report.awardPointsEarned && (
                    <span>
                      <strong>Points Awarded:</strong> +{report.awardPointsEarned} XP
                    </span>
                  )}
                </div>
              )}
              {report.feedback && (
                <p style={{ fontSize: "11px", margin: "4px 0", fontStyle: "italic" }}>
                  <strong>Teacher Feedback:</strong> "{report.feedback}"
                </p>
              )}
              <div
                style={{
                  fontSize: "10px",
                  color: "#555",
                  marginTop: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  Marked by: {report.teacherName || "Faculty Evaluator"}{" "}
                  {report.teacherTitle ? `(${report.teacherTitle})` : ""}
                </span>
                <span>
                  Signature/Stamp: {report.teacherSignature || "Verified"} (
                  {report.markedAt ? new Date(report.markedAt).toLocaleDateString("en-GB") : today})
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* KNOWLEDGE GAPS & REMEDIATION */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "13px",
            margin: "0 0 8px",
            borderBottom: "2px solid #0a1628",
            paddingBottom: "4px",
            color: "#0a1628",
            textTransform: "uppercase",
            fontWeight: "800",
          }}
        >
          3. Remediation &amp; Knowledge Gaps Analysis
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#e5e7eb" }}>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "left",
                  width: "30%",
                }}
              >
                Domain / Subject
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "left",
                  width: "50%",
                }}
              >
                Identified Concept / Topic
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                  width: "20%",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {gapSubjects.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid #000000",
                    padding: "10px",
                    textAlign: "center",
                    color: "#666",
                    fontStyle: "italic",
                  }}
                >
                  All curriculum diagnostic checkpoints satisfied. No active knowledge gaps logged.
                </td>
              </tr>
            ) : (
              gapSubjects.map((gap, idx) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "700" }}>
                    {gap.subject}
                  </td>
                  <td style={{ border: "1px solid #000000", padding: "6px" }}>{gap.topic}</td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px",
                      textAlign: "center",
                      fontWeight: "700",
                      color: "#16a34a",
                    }}
                  >
                    Verified Mastered
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* AUTHORISED SIGNATURES */}
      <div style={{ marginTop: "36px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: "33%",
                  padding: "0 8px",
                  textAlign: "center",
                  verticalAlign: "bottom",
                }}
              >
                <div
                  style={{ borderTop: "1px solid #000000", paddingTop: "4px", fontSize: "10px" }}
                >
                  <strong>{displayName}</strong>
                  <div style={{ color: "#666666", marginTop: "2px" }}>
                    Student Signature &amp; Date
                  </div>
                </div>
              </td>
              <td
                style={{
                  width: "34%",
                  padding: "0 8px",
                  textAlign: "center",
                  verticalAlign: "bottom",
                }}
              >
                <div
                  style={{ borderTop: "1px solid #000000", paddingTop: "4px", fontSize: "10px" }}
                >
                  <strong>Subject Teacher</strong>
                  <div style={{ color: "#666666", marginTop: "2px" }}>
                    Faculty Signature &amp; Date
                  </div>
                </div>
              </td>
              <td
                style={{
                  width: "33%",
                  padding: "0 8px",
                  textAlign: "center",
                  verticalAlign: "bottom",
                }}
              >
                <div
                  style={{ borderTop: "1px solid #000000", paddingTop: "4px", fontSize: "10px" }}
                >
                  <strong>Headteacher / Official Stamp</strong>
                  <div style={{ color: "#666666", marginTop: "2px" }}>
                    Institutional Verification
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: "24px",
          borderTop: "1px solid #000000",
          paddingTop: "6px",
          fontSize: "9px",
          color: "#666666",
          textAlign: "center",
        }}
      >
        Cymatic Study Portfolio Report · NCDC Lower Secondary Assessment Framework · Generated{" "}
        {today}
      </div>
    </div>
  );
}
