import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const A4_W_MM = 210;
const A4_H_MM = 297;
const MARGIN_MM = 15;

export async function generateVectorPdf(project: any, filename: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let cursorY = MARGIN_MM;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CYMATIC HUB EVOLUTION", A4_W_MM / 2, cursorY, { align: "center" });
  cursorY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("LOWER SECONDARY EXCELLENCE REPORT — NCDC 2026", A4_W_MM / 2, cursorY, {
    align: "center",
  });
  cursorY += 10;

  doc.setLineWidth(0.5);
  doc.line(MARGIN_MM, cursorY, A4_W_MM - MARGIN_MM, cursorY);
  cursorY += 10;

  // Metadata Table
  const metadata = [
    ["Student Name", project.studentName || "—"],
    ["Class", project.className || "—"],
    ["Subject", project.subject || "—"],
    ["Project Title", project.title || "—"],
    ["UNEB Centre / Index", project.unebIndex || "—"],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [],
    body: metadata,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    margin: { left: MARGIN_MM, right: MARGIN_MM },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // Phase 1: Justification
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PHASE 1: Planning & Justification", MARGIN_MM, cursorY);
  cursorY += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const justificationLines = doc.splitTextToSize(
    project.justification || "No justification provided.",
    A4_W_MM - MARGIN_MM * 2,
  );
  doc.text(justificationLines, MARGIN_MM, cursorY);
  cursorY += justificationLines.length * 5 + 10;

  // Budget Table
  if (project.budget && project.budget.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("BUBU Budget (Local/Recycled Favoured)", MARGIN_MM, cursorY);
    cursorY += 4;

    const budgetBody = project.budget.map((b: any) => [
      b.name,
      b.source,
      `UGX ${b.cost.toLocaleString()}`,
    ]);
    const totalCost = project.budget.reduce((acc: number, b: any) => acc + (b.cost || 0), 0);
    budgetBody.push([
      { content: "TOTAL", colSpan: 2, styles: { fontStyle: "bold" } },
      { content: `UGX ${totalCost.toLocaleString()}`, styles: { fontStyle: "bold" } },
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [["Item", "Source", "Cost"]],
      body: budgetBody,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      margin: { left: MARGIN_MM, right: MARGIN_MM },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Phase 2: Logbook
  if (project.logs && project.logs.length > 0) {
    if (cursorY > A4_H_MM - 60) {
      doc.addPage();
      cursorY = MARGIN_MM;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PHASE 2: Implementation & Weekly Logbook", MARGIN_MM, cursorY);
    cursorY += 6;

    const logBody = project.logs.map((l: any) => [
      l.week,
      l.activity,
      l.challenges,
      l.skills?.join(", ") || "—",
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [["Week", "Activity Description", "Challenges", "Skills Gained"]],
      body: logBody,
      theme: "grid",
      styles: { fontSize: 8, overflow: "linebreak" },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      margin: { left: MARGIN_MM, right: MARGIN_MM },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Phase 3 & 4
  if (cursorY > A4_H_MM - 80) {
    doc.addPage();
    cursorY = MARGIN_MM;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PHASE 3 & 4: Output, Efficiency & Summary", MARGIN_MM, cursorY);
  cursorY += 6;

  const efficiency =
    project.input && project.output
      ? Math.round((Number(project.output) / Number(project.input)) * 100)
      : "—";

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Uniqueness: `, MARGIN_MM, cursorY);
  doc.setFont("helvetica", "normal");
  const uniqueLines = doc.splitTextToSize(project.uniqueness || "—", A4_W_MM - MARGIN_MM * 2 - 30);
  doc.text(uniqueLines, MARGIN_MM + 25, cursorY);
  cursorY += Math.max(5, uniqueLines.length * 5);

  doc.setFont("helvetica", "bold");
  doc.text(`Efficiency: `, MARGIN_MM, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${efficiency}% (Input: ${project.input || 0} / Output: ${project.output || 0})`,
    MARGIN_MM + 25,
    cursorY,
  );
  cursorY += 10;

  doc.setFont("helvetica", "bold");
  doc.text(`Final Summary:`, MARGIN_MM, cursorY);
  cursorY += 5;
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(
    project.summary || "No summary provided.",
    A4_W_MM - MARGIN_MM * 2,
  );
  doc.text(summaryLines, MARGIN_MM, cursorY);
  cursorY += summaryLines.length * 5 + 15;

  // Teacher Evaluation Section
  if (cursorY > A4_H_MM - 60) {
    doc.addPage();
    cursorY = MARGIN_MM;
  }

  doc.setLineWidth(0.3);
  doc.rect(MARGIN_MM, cursorY, A4_W_MM - MARGIN_MM * 2, 40);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL NCDC TEACHER EVALUATION & CERTIFICATION", MARGIN_MM + 5, cursorY + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Teacher: ___________________________`, MARGIN_MM + 5, cursorY + 20);
  doc.text(`License No: ________________________`, MARGIN_MM + 5, cursorY + 28);
  doc.text(`School Stamp / Signature:`, MARGIN_MM + 110, cursorY + 20);
  doc.text(`Date: _____________________________`, MARGIN_MM + 110, cursorY + 28);

  cursorY += 50;

  // Footer / Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Cymatic Study PBL Tracker - Page ${i} of ${pageCount}`, A4_W_MM / 2, A4_H_MM - 10, {
      align: "center",
    });
  }

  doc.save(filename);
}

export function safeFilename(s: string): string {
  return s.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "report";
}
