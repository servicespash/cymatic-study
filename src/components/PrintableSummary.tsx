import { useState, useEffect } from "react";
import { db, ChatSession } from "@/lib/db";
import { useGamificationStore } from "@/store/useGamificationStore";
import { supabase } from "@/integrations/supabase/client";

export function PrintableSummary() {
  const { xp, level, completedGaps, goalName, goalType, goalTarget } = useGamificationStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [displayName, setDisplayName] = useState("Learner");
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    async function loadData() {
      const allSessions = await db.chatSessions.toArray();
      setSessions(allSessions);

      // Fetch student profile name
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        if (profile?.full_name) setDisplayName(profile.full_name);
      }
    }
    loadData();
  }, []);

  const categorizeText = (text: string): string => {
    const t = text.toLowerCase();
    if (
      /math|algebra|quadratic|equation|calculus|geometry|fraction|divide|multiply|subtract|add|sum|sigma|theorem|numeric|number/.test(
        t,
      )
    ) {
      return "Math";
    }
    if (
      /physics|force|gravity|velocity|speed|kinematics|motion|mechanics|wave|optics|light|laser|electricity|magnet|ampere|volt|joule|newton/.test(
        t,
      )
    ) {
      return "Physics";
    }
    if (
      /chemistry|chemical|acid|base|ph|molecule|atom|bond|compound|periodic|reaction|catalyst|element|flask|beaker|alkali/.test(
        t,
      )
    ) {
      return "Chemistry";
    }
    if (
      /biology|cell|dna|organism|gene|evolution|plant|photosynthesis|mitochondria|bacteria|virus|anatomy|heart|lung|species/.test(
        t,
      )
    ) {
      return "Biology";
    }
    return "General Science";
  };

  const gapSubjects = completedGaps.map((gap) => ({
    topic: gap,
    subject: categorizeText(gap),
  }));

  return (
    <div
      className="print-report hidden"
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: "#0a0a0a",
        background: "#ffffff",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
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
            fontSize: "24px",
            fontWeight: "900",
            margin: "0 0 4px",
            color: "#0a1628",
            letterSpacing: "1px",
          }}
        >
          CYMATIC HUB
        </h1>
        <h2
          style={{
            fontSize: "14px",
            fontWeight: "700",
            margin: "0 0 6px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "#444444",
          }}
        >
          Personalised Lower Secondary Progress Report
        </h2>
        <p style={{ fontSize: "11px", margin: "0", color: "#666666" }}>
          National Curriculum Development Centre (NCDC) Study Companion · Uganda
        </p>
      </div>

      {/* METADATA TABLE */}
      <div style={{ marginBottom: "24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  fontWeight: "700",
                  width: "25%",
                  background: "#f3f4f6",
                }}
              >
                Student Name
              </td>
              <td style={{ border: "1px solid #000000", padding: "8px" }}>{displayName}</td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  fontWeight: "700",
                  width: "25%",
                  background: "#f3f4f6",
                }}
              >
                Report Date
              </td>
              <td style={{ border: "1px solid #000000", padding: "8px" }}>{today}</td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                Academic Level
              </td>
              <td style={{ border: "1px solid #000000", padding: "8px" }}>Tier {level} Learner</td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                Total Experience
              </td>
              <td style={{ border: "1px solid #000000", padding: "8px" }}>{xp} XP</td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                Active Goal
              </td>
              <td style={{ border: "1px solid #000000", padding: "8px" }}>
                {goalName} ({goalType})
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                }}
              >
                Sessions Recorded
              </td>
              <td style={{ border: "1px solid #000000", padding: "8px" }}>
                {sessions.length} study chats
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ACADEMIC KNOWLEDGE GAPS / CONCEPTS SECTION */}
      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            fontSize: "14px",
            margin: "0 0 10px",
            borderBottom: "2px solid #0a1628",
            paddingBottom: "4px",
            color: "#0a1628",
            textTransform: "uppercase",
            fontWeight: "800",
          }}
        >
          1. Remediation & Knowledge Gaps Analysis
        </h3>
        <p style={{ fontSize: "11px", margin: "0 0 12px", color: "#444444" }}>
          The following concepts have been identified by the AI Empathy Engine as critical areas
          where the student required supplemental learning or clarification.
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#e5e7eb" }}>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  textAlign: "left",
                  width: "30%",
                }}
              >
                Domain / Subject
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  textAlign: "left",
                  width: "50%",
                }}
              >
                Identified Topic / Gap Concept
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  textAlign: "center",
                  width: "20%",
                }}
              >
                Remedial Status
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
                    padding: "12px",
                    textAlign: "center",
                    color: "#666666",
                    fontStyle: "italic",
                  }}
                >
                  No active knowledge gaps recorded. Keep studying to populate progress metrics.
                </td>
              </tr>
            ) : (
              gapSubjects.map((gap, idx) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #000000", padding: "8px", fontWeight: "700" }}>
                    {gap.subject}
                  </td>
                  <td style={{ border: "1px solid #000000", padding: "8px" }}>{gap.topic}</td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "bold",
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

      {/* RECENT ACADEMIC ACTIVITY TIMELINE */}
      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            fontSize: "14px",
            margin: "0 0 10px",
            borderBottom: "2px solid #0a1628",
            paddingBottom: "4px",
            color: "#0a1628",
            textTransform: "uppercase",
            fontWeight: "800",
          }}
        >
          2. Recent Study Activity & Milestones
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#e5e7eb" }}>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  textAlign: "left",
                  width: "25%",
                }}
              >
                Date & Time
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  textAlign: "left",
                  width: "50%",
                }}
              >
                Focus Area Summary
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "8px",
                  textAlign: "center",
                  width: "25%",
                }}
              >
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid #000000",
                    padding: "12px",
                    textAlign: "center",
                    color: "#666666",
                    fontStyle: "italic",
                  }}
                >
                  No study interactions logged.
                </td>
              </tr>
            ) : (
              sessions.slice(0, 5).map((session, idx) => {
                const dateText = new Date(session.timestamp).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const userMsg =
                  session.messages.find((m) => m.sender === "student" || m.sender === "user")
                    ?.text || "General chat inquiry";
                const summary = userMsg.length > 80 ? userMsg.substring(0, 80) + "..." : userMsg;

                return (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000000", padding: "8px" }}>{dateText}</td>
                    <td style={{ border: "1px solid #000000", padding: "8px" }}>{summary}</td>
                    <td
                      style={{ border: "1px solid #000000", padding: "8px", textAlign: "center" }}
                    >
                      Tutor Session
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* AUTHORIZED SIGNATURES */}
      <div style={{ marginTop: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: "33%",
                  padding: "0 10px",
                  textAlign: "center",
                  verticalAlign: "bottom",
                }}
              >
                <div
                  style={{ borderTop: "1px solid #000000", paddingTop: "6px", fontSize: "10px" }}
                >
                  <strong>{displayName}</strong>
                  <div style={{ color: "#666666", marginTop: "2px" }}>Student Signature</div>
                </div>
              </td>
              <td
                style={{
                  width: "34%",
                  padding: "0 10px",
                  textAlign: "center",
                  verticalAlign: "bottom",
                }}
              >
                <div
                  style={{ borderTop: "1px solid #000000", paddingTop: "6px", fontSize: "10px" }}
                >
                  <strong>Subject Teacher</strong>
                  <div style={{ color: "#666666", marginTop: "2px" }}>Signature & Date</div>
                </div>
              </td>
              <td
                style={{
                  width: "33%",
                  padding: "0 10px",
                  textAlign: "center",
                  verticalAlign: "bottom",
                }}
              >
                <div
                  style={{ borderTop: "1px solid #000000", paddingTop: "6px", fontSize: "10px" }}
                >
                  <strong>Headteacher / Stamp</strong>
                  <div style={{ color: "#666666", marginTop: "2px" }}>Verification Signature</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: "30px",
          borderTop: "1px solid #000000",
          paddingTop: "6px",
          fontSize: "9px",
          color: "#666666",
          textAlign: "center",
        }}
      >
        Cymatic Study Portfolio Report · NCDC Upper Lower-Secondary assessment framework · 2026
      </div>
    </div>
  );
}
