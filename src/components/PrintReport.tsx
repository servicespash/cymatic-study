import { forwardRef } from "react";
import type { Project } from "@/lib/projects-store";
import { gradeLabel } from "@/lib/projects-store";

type Props = {
  project: Project;
  signedInLabel?: string; // e.g. email of student signed in
};

// Plain RGB/hex only — html2canvas can't render oklch() tokens
const C = {
  ink: "#0a0a0a",
  rule: "#000000",
  soft: "#444444",
  zebra: "#f3f4f6",
  brand: "#0a1628",
  accent: "#1d4ed8",
  bgHead: "#e5e7eb",
};

const cell: React.CSSProperties = {
  border: `1px solid ${C.rule}`,
  padding: "6px 8px",
  fontSize: 11,
  color: C.ink,
  verticalAlign: "top",
};
const th: React.CSSProperties = { ...cell, background: C.bgHead, fontWeight: 700 };

const sectionBox: React.CSSProperties = {
  padding: "10px 14px",
  marginBottom: 8,
  background: "#ffffff",
  color: C.ink,
};
const h2: React.CSSProperties = {
  fontSize: 13,
  margin: "0 0 8px",
  paddingBottom: 4,
  borderBottom: `2px solid ${C.brand}`,
  color: C.brand,
  fontWeight: 800,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

export const PrintReport = forwardRef<HTMLDivElement, Props>(function PrintReport(
  { project, signedInLabel },
  ref,
) {
  const p = project;
  const budgetTotal = p.budget.reduce((a, b) => a + (b.cost || 0), 0);
  const efficiency =
    Number(p.input) && Number(p.output)
      ? Math.round((Number(p.output) / Number(p.input)) * 100)
      : null;
  const tm = p.teacherMark;
  const today = new Date().toLocaleDateString("en-GB");

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: C.ink,
        background: "#ffffff",
        width: 794, // ~A4 width at 96dpi
        padding: 0,
      }}
    >
      {/* === COVER / META === */}
      <div data-pdf-section style={sectionBox}>
        <div
          style={{
            textAlign: "center",
            borderBottom: `3px double ${C.rule}`,
            paddingBottom: 10,
            marginBottom: 12,
          }}
        >
          <h1
            style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: 2, color: C.brand }}
          >
            Latty's Cymatic hub
          </h1>
          <p style={{ fontSize: 11, margin: "4px 0 0", color: C.soft }}>
            Cymatic hub .NCDC 2026_ Project-based learning -report .
          </p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Student Name", p.studentName || "—"],
              ["Class", p.className || "—"],
              ["School", p.schoolName || "—"],
              ["Subject", p.subject || "—"],
              ["Project Title", p.title || "—"],
              ["UNEB Centre / Index", p.unebIndex || "—"],
              ["Report Generated", today],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ ...cell, fontWeight: 700, width: "32%", background: C.zebra }}>{k}</td>
                <td style={cell}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === PHASE 1 === */}
      <div data-pdf-section style={sectionBox}>
        <h2 style={h2}>Phase 1 — Planning & Design</h2>
        <p style={{ fontSize: 11, margin: "0 0 8px" }}>
          <strong>Justification:</strong> {p.justification || "—"}
        </p>
        <p style={{ fontSize: 11, margin: "0 0 10px", fontWeight: 700 }}>BUBU Budget</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Item</th>
              <th style={th}>Source</th>
              <th style={{ ...th, textAlign: "right" }}>Cost (UGX)</th>
            </tr>
          </thead>
          <tbody>
            {p.budget.length === 0 ? (
              <tr>
                <td style={cell} colSpan={3}>
                  No budget items recorded.
                </td>
              </tr>
            ) : (
              p.budget.map((b) => (
                <tr key={b.id}>
                  <td style={cell}>{b.name}</td>
                  <td style={cell}>{b.source}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{b.cost.toLocaleString()}</td>
                </tr>
              ))
            )}
            <tr>
              <td style={{ ...cell, fontWeight: 800, background: C.zebra }} colSpan={2}>
                Total
              </td>
              <td style={{ ...cell, fontWeight: 800, background: C.zebra, textAlign: "right" }}>
                {budgetTotal.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === PHASE 2 === */}
      <div data-pdf-section style={sectionBox}>
        <h2 style={h2}>Phase 2 — Implementation & Logbook</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th, width: "14%" }}>Week</th>
              <th style={th}>Activity</th>
              <th style={th}>Challenges</th>
              <th style={{ ...th, width: "22%" }}>Skills</th>
            </tr>
          </thead>
          <tbody>
            {p.logs.length === 0 ? (
              <tr>
                <td style={cell} colSpan={4}>
                  No weekly logs recorded.
                </td>
              </tr>
            ) : (
              p.logs.map((l) => (
                <tr key={l.id}>
                  <td style={cell}>{l.week}</td>
                  <td style={cell}>{l.activity || "—"}</td>
                  <td style={cell}>{l.challenges || "—"}</td>
                  <td style={cell}>{l.skills.join(", ") || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === PHASE 3 === */}
      <div data-pdf-section style={sectionBox}>
        <h2 style={h2}>Phase 3 — Product Output & Testing</h2>
        <p style={{ fontSize: 11, margin: "0 0 6px" }}>
          <strong>Uniqueness:</strong> {p.uniqueness || "—"}
        </p>
        <p style={{ fontSize: 11, margin: 0 }}>
          <strong>Input:</strong> {p.input || "—"} &nbsp;·&nbsp;
          <strong>Output:</strong> {p.output || "—"} &nbsp;·&nbsp;
          <strong>Efficiency:</strong> {efficiency !== null ? `${efficiency}%` : "—"}
        </p>
      </div>

      {/* === PHASE 4 === */}
      <div data-pdf-section style={sectionBox}>
        <h2 style={h2}>Phase 4 — Final Report</h2>
        <p style={{ fontSize: 11, whiteSpace: "pre-wrap", margin: 0 }}>{p.summary || "—"}</p>
      </div>

      {/* === TEACHER ASSESSMENT === */}
      <div data-pdf-section style={sectionBox}>
        <h2 style={h2}>Teacher's Assessment</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ ...cell, background: C.zebra, fontWeight: 700, width: "32%" }}>
                Score (out of 100)
              </td>
              <td style={cell}>{tm ? tm.score : "Pending"}</td>
            </tr>
            <tr>
              <td style={{ ...cell, background: C.zebra, fontWeight: 700 }}>Grade</td>
              <td style={cell}>{tm ? `${tm.grade} — ${gradeLabel(tm.grade)}` : "Pending"}</td>
            </tr>
            <tr>
              <td style={{ ...cell, background: C.zebra, fontWeight: 700 }}>Comment</td>
              <td style={cell}>{tm?.comment || "Pending"}</td>
            </tr>
            <tr>
              <td style={{ ...cell, background: C.zebra, fontWeight: 700 }}>Marked by</td>
              <td style={cell}>
                {tm
                  ? `${tm.teacherName || "Anonymous"}${tm.teacherTitle ? `, ${tm.teacherTitle}` : ""}`
                  : "Pending"}
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, background: C.zebra, fontWeight: 700 }}>Marked on</td>
              <td style={cell}>
                {tm ? new Date(tm.markedAt).toLocaleDateString("en-GB") : "Pending"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === SIGNATURES === */}
      <div data-pdf-section style={sectionBox}>
        <h2 style={h2}>Authorised Signatures</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 30 }}>
          <tbody>
            <tr>
              {(["Student", "Subject Teacher", "Headteacher"] as const).map((role) => (
                <td
                  key={role}
                  style={{ padding: "0 8px", verticalAlign: "bottom", width: "33.33%" }}
                >
                  <div
                    style={{
                      borderTop: `1px solid ${C.rule}`,
                      paddingTop: 4,
                      fontSize: 10,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{role}</div>
                    <div style={{ color: C.soft, marginTop: 2 }}>
                      Signature &amp; Date {role === "Headteacher" ? "/ Stamp" : ""}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* === FOOTER === */}
      <div data-pdf-section style={{ ...sectionBox, paddingTop: 0 }}>
        <div
          style={{
            borderTop: `1px solid ${C.rule}`,
            paddingTop: 6,
            fontSize: 9,
            color: C.soft,
            textAlign: "center",
          }}
        >
          Generated by Pash Media Studio × Cymatic Study · {today}
          {signedInLabel ? ` · ${signedInLabel}` : ""}
        </div>
      </div>
    </div>
  );
});
