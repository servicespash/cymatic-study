import React, { useEffect, forwardRef } from "react";
import { MarkedReportItem } from "@/components/PrintableSummary";

export interface ReportPrintViewProps {
  studentName?: string;
  schoolName?: string;
  className?: string;
  unebIndex?: string;
  reportTitle?: string;
  themeTemplate?: "NCDC Competency" | "STEM Research" | "Term Summary" | "Project Portfolio";
  markedReports?: MarkedReportItem[];
  timePoints?: number;
  awardPoints?: number;
  autoPrint?: boolean;
}

export const ReportPrintView = forwardRef<HTMLDivElement, ReportPrintViewProps>(
  function ReportPrintView(
    {
      studentName = "Learner Scholar",
      schoolName = "National Curriculum Center Academy",
      className = "Senior 3 (S3)",
      unebIndex = "U2026/089/STD",
      reportTitle = "Cymatic Study Portfolio & Competency Report",
      themeTemplate = "NCDC Competency",
      markedReports = [],
      timePoints = 18.5,
      awardPoints = 450,
      autoPrint = false,
    },
    ref,
  ) {
    useEffect(() => {
      if (autoPrint) {
        const timer = setTimeout(() => {
          window.print();
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [autoPrint]);

    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div
        ref={ref}
        className="print-report-container hidden print:block bg-white text-black p-8 font-serif leading-relaxed w-full max-w-4xl mx-auto border border-gray-300 rounded-xl"
        style={{ color: "#000000", backgroundColor: "#ffffff" }}
      >
        {/* BRANDING HEADER */}
        <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-gray-600 uppercase">
              Cymatic Hub · Pash Media Studio
            </span>
            <span className="text-[10px] font-mono tracking-widest text-gray-600 uppercase">
              Template: {themeTemplate}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-wide uppercase text-slate-900 mb-1">
            {reportTitle}
          </h1>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Ministry of Education &amp; Sports · Lower Secondary Curriculum Framework
          </h2>
          <p className="text-[11px] text-gray-600 mt-1">
            Official Academic Record &amp; Continuous Assessment Portfolio
          </p>
        </div>

        {/* LEARNER METADATA */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black text-xs">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100 w-1/4">
                  Student Name:
                </td>
                <td className="border border-black p-2 font-semibold w-1/4">{studentName}</td>
                <td className="border border-black p-2 font-bold bg-gray-100 w-1/4">
                  Report Date:
                </td>
                <td className="border border-black p-2 w-1/4">{today}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">
                  School / Institution:
                </td>
                <td className="border border-black p-2">{schoolName}</td>
                <td className="border border-black p-2 font-bold bg-gray-100">Class / Level:</td>
                <td className="border border-black p-2">{className}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">Reg / UNEB Index:</td>
                <td className="border border-black p-2">{unebIndex}</td>
                <td className="border border-black p-2 font-bold bg-gray-100">
                  Award Scheme Tier:
                </td>
                <td className="border border-black p-2 font-bold text-indigo-900">
                  Tier 3 Academic Scholar
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TIME POINTS & AWARD POINTS SCHEME */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-black pb-1 mb-2">
            1. Time Points &amp; Award Points Breakdown
          </h3>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-left">Award Category</th>
                <th className="border border-black p-2 text-center">Value Earned</th>
                <th className="border border-black p-2 text-left">Curriculum Standard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold">Study Time Points</td>
                <td className="border border-black p-2 text-center font-bold text-teal-800">
                  {timePoints} Hours Logged
                </td>
                <td className="border border-black p-2">
                  Verified Socratic inquiry, interactive simulations, &amp; lab exercises.
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Award XP Points</td>
                <td className="border border-black p-2 text-center font-bold text-indigo-800">
                  +{awardPoints} XP Points
                </td>
                <td className="border border-black p-2">
                  Credited through thematic project execution and knowledge gap remediation.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MARKED THEMATIC REPORTS */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-black pb-1 mb-2">
            2. Marked Projects &amp; Faculty Evaluations
          </h3>
          {markedReports.length === 0 ? (
            <p className="text-xs italic text-gray-600 border border-black p-4 text-center">
              No individual project submissions marked yet for this reporting cycle.
            </p>
          ) : (
            markedReports.map((rpt, idx) => (
              <div key={rpt.id || idx} className="border border-black p-3 mb-3 text-xs">
                <div className="flex justify-between border-b border-gray-400 pb-1 mb-2 font-bold">
                  <span>
                    {idx + 1}. {rpt.projectTitle} ({rpt.subject})
                  </span>
                  <span className="text-emerald-800">Score: {rpt.score}%</span>
                </div>
                {rpt.rubricScores && (
                  <div className="flex gap-4 text-[11px] text-gray-800 mb-2 bg-gray-100 p-1.5 border border-gray-300">
                    <span>
                      <strong>Planning:</strong> {rpt.rubricScores.planning}/30
                    </span>
                    <span>
                      <strong>Execution:</strong> {rpt.rubricScores.execution}/40
                    </span>
                    <span>
                      <strong>Conclusion:</strong> {rpt.rubricScores.conclusion}/30
                    </span>
                  </div>
                )}
                {rpt.feedback && (
                  <p className="italic text-gray-800 mb-2">
                    <strong>Educator Feedback:</strong> "{rpt.feedback}"
                  </p>
                )}
                <div className="flex justify-between text-[10px] text-gray-600 border-t border-gray-300 pt-1">
                  <span>Evaluator: {rpt.teacherName || "Faculty Lead"}</span>
                  <span>Digital Stamp: {rpt.teacherSignature || "Official Seal Verified"}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AUTHORIZATION SIGNATURES */}
        <div className="mt-12 pt-4">
          <table className="w-full text-center text-xs">
            <tbody>
              <tr>
                <td className="w-1/3 p-2 vertical-bottom">
                  <div className="border-t border-black pt-1 font-bold">{studentName}</div>
                  <div className="text-[10px] text-gray-600">Learner Signature</div>
                </td>
                <td className="w-1/3 p-2 vertical-bottom">
                  <div className="border-t border-black pt-1 font-bold">Subject Head Teacher</div>
                  <div className="text-[10px] text-gray-600">Faculty Signature &amp; Seal</div>
                </td>
                <td className="w-1/3 p-2 vertical-bottom">
                  <div className="border-t border-black pt-1 font-bold">
                    Headteacher / Principal
                  </div>
                  <div className="text-[10px] text-gray-600">Institutional Seal</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-2 border-t border-gray-400 text-[9px] text-gray-500 text-center">
          Cymatic Study Portfolio · NCDC Assessment Standard · Document Security Key:
          0xCYM-2026-NCDC
        </div>
      </div>
    );
  },
);
