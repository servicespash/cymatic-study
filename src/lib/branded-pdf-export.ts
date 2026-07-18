import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BrandedPdfOptions {
  title: string;
  subject?: string;
  docType: "study_chart" | "lesson_notes" | "quiz";
  content: {
    sectionTitle: string;
    body:
      | string
      | string[]
      | { key: string; value: string }[]
      | { q: string; options?: string[]; a: string }[];
  }[];
  userName?: string;
  schoolName?: string;
  isBlackAndWhite?: boolean;
  paperSize?: "a4" | "letter";
  language?: "en" | "lg" | "sw"; // English, Luganda, Swahili
  showAnswers?: boolean;
}

// Language translations helper
const translations = {
  en: {
    verifyHeader: "VERIFIED ACADEMIC DOCUMENT",
    originated: "Originated from: Lattys Cymatic Study",
    holder: "Document Holder",
    school: "School / Center",
    date: "Generated Date",
    subject: "Subject",
    docType: "Document Type",
    app: "App Name",
    license: "Verification ID",
    footerLogo: "CYMATIC HUB",
    footerText: "Uganda S1-S4 Secondary Companion. Aligning education with 21st-century skills.",
    study_chart: "Study Chart",
    lesson_notes: "Lesson Notes",
    quiz: "Quiz assessment worksheet",
    scanPrompt: "Scan QR code to verify authenticity online at study.cymatichub.xyz",
  },
  lg: {
    verifyHeader: "KIWANDIIKO EKIKASIDDWA EBY'OKUSOMA",
    originated: "Kizze okuva mu: Lattys Cymatic Study",
    holder: "Nnannyini Kiwandiiko",
    school: "Essomero / Kituo",
    date: "Olunaku Lwe Kyakolebwa",
    subject: "Essomo",
    docType: "Ekika Ky'ekiwandiiko",
    app: "Erinnya Lya App",
    license: "Namba y'Okukakasa",
    footerLogo: "CYMATIC HUB",
    footerText: "Okutumbula eby'okusoma mu Uganda nga tusingiira ku mutindo gwa NCDC.",
    study_chart: "Akakiiko K'okusoma",
    lesson_notes: "Ebiwandiiko eby'Okusoma",
    quiz: "Ebibuuzo n'Eby'okwegezaamu",
    scanPrompt: "Kuba QR koodi eno okukakasa obutuufu ku study.cymatichub.xyz",
  },
  sw: {
    verifyHeader: "HATI YA KIELIMU ILIYOTHIBITISHWA",
    originated: "Imetolewa na: Lattys Cymatic Study",
    holder: "Mmiliki wa Hati",
    school: "Shule / Kituo",
    date: "Tarehe Iliyoundwa",
    subject: "Somo",
    docType: "Aina ya Hati",
    app: "Jina la Programu",
    license: "Nambari ya Uhakiki",
    footerLogo: "CYMATIC HUB",
    footerText: "Kukuza Elimu ya Sekondari nchini Uganda kulingana na mtaala wa NCDC.",
    study_chart: "Hati ya Masomo",
    lesson_notes: "Hati ya Masomo",
    quiz: "Mtihani na Tathmini ya Mazoezi",
    scanPrompt: "Changanua msimbo wa QR ili kuthibitisha mtandaoni kupitia study.cymatichub.xyz",
  },
};

/**
 * Draws a gorgeous vector icon for Cymatic Study in jsPDF
 */
function drawVectorAppIcon(doc: jsPDF, x: number, y: number, isBlackAndWhite = false) {
  const primaryColor = isBlackAndWhite ? [60, 60, 60] : [99, 102, 241]; // Indigo or dark gray
  const accentColor = isBlackAndWhite ? [100, 100, 100] : [14, 165, 233]; // Sky blue or gray

  // Outer circle ring
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1.2);
  doc.circle(x, y, 7);

  // Concentric wave ripple 1
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.6);
  doc.circle(x, y, 5.2);

  // Concentric wave ripple 2
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  doc.circle(x, y, 3.4);

  // Center node dot
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.circle(x, y, 1.4, "F");
}

export async function exportToBrandedPdf(opts: BrandedPdfOptions) {
  const paper = opts.paperSize || "a4";
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: paper,
  });

  const isBW = !!opts.isBlackAndWhite;
  const lang = opts.language || "en";
  const tr = translations[lang] || translations.en;

  const w = paper === "a4" ? 210 : 215.9; // mm
  const h = paper === "a4" ? 297 : 279.4; // mm
  const margin = 18; // mm

  let y = margin;

  // Colors
  const titleColor = isBW ? [30, 30, 30] : [17, 24, 39]; // dark slate or charcoal
  const accentText = isBW ? [60, 60, 60] : [79, 70, 229]; // indigo or grey
  const bodyText = [55, 65, 81]; // soft dark grey

  // 1. Draw HEADER App Icon and Title
  drawVectorAppIcon(doc, margin + 7, y + 4, isBW);

  // Title branding block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text(opts.title.toUpperCase(), margin + 20, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(accentText[0], accentText[1], accentText[2]);
  const subHeadingText = `${tr.originated} | ${tr.verifyHeader}`;
  doc.text(subHeadingText, margin + 20, y + 10);

  y += 18;

  // Thin separator line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, y, w - margin, y);
  y += 8;

  // Metadata Block
  const displayUser = opts.userName && opts.userName.trim() !== "" ? opts.userName : "unknown";
  const displaySchool =
    opts.schoolName && opts.schoolName.trim() !== "" ? opts.schoolName : "unknown";
  const displaySubject = opts.subject || "General Science / Math";
  const displayDocType = tr[opts.docType] || opts.docType;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);

  doc.text(`${tr.subject}:`, margin, y);
  doc.text(`${tr.holder}:`, margin, y + 5);
  doc.text(`${tr.school}:`, margin, y + 10);

  doc.text(`${tr.docType}:`, w / 2, y);
  doc.text(`${tr.date}:`, w / 2, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);
  doc.text(displaySubject, margin + 20, y);
  doc.text(displayUser === "unknown" ? "Unknown (Guest)" : displayUser, margin + 20, y + 5);
  doc.text(displaySchool === "unknown" ? "Guest View" : displaySchool, margin + 20, y + 10);

  doc.text(displayDocType, w / 2 + 28, y);
  doc.text(new Date().toLocaleDateString(), w / 2 + 28, y + 5);

  y += 18;

  // Content Blocks
  for (const block of opts.content) {
    // Check page boundaries
    if (y > h - 45) {
      doc.addPage();
      y = margin;
    }

    // Section Heading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(accentText[0], accentText[1], accentText[2]);
    doc.text(block.sectionTitle.toUpperCase(), margin, y);
    y += 5;

    // Content body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);

    if (typeof block.body === "string") {
      const splitLines = doc.splitTextToSize(block.body, w - margin * 2);

      // Make sure it doesn't overflow completely
      for (const line of splitLines) {
        if (y > h - 40) {
          doc.addPage();
          y = margin;
          // Re-draw section title reference on new page
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(`[${block.sectionTitle.toUpperCase()} - CONTINUED]`, margin, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
        }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 5;
    } else if (Array.isArray(block.body)) {
      // It can be a list of Q&A, or bullet points, or metadata table arrays
      const firstItem = block.body[0];

      if (typeof firstItem === "string") {
        // Bullet points list
        for (const bullet of block.body as string[]) {
          if (y > h - 40) {
            doc.addPage();
            y = margin;
          }
          const bulletLine = `• ${bullet}`;
          const splitLines = doc.splitTextToSize(bulletLine, w - margin * 2 - 4);
          splitLines.forEach((line: string, idx: number) => {
            if (y > h - 40) {
              doc.addPage();
              y = margin;
            }
            doc.text(idx === 0 ? line : `  ${line}`, margin, y);
            y += 5;
          });
        }
        y += 4;
      } else if (firstItem && "key" in firstItem) {
        // Key-Value tabular metadata
        const tableData = (block.body as { key: string; value: string }[]).map((item) => [
          item.key,
          item.value,
        ]);
        autoTable(doc, {
          startY: y,
          head: [],
          body: tableData,
          theme: isBW ? "grid" : "striped",
          styles: { fontSize: 8.5, cellPadding: 2.5 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
          margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      } else if (firstItem && "q" in firstItem) {
        // Quiz questions with options
        let idx = 1;
        for (const quiz of block.body as { q: string; options?: string[]; a: string }[]) {
          if (y > h - 45) {
            doc.addPage();
            y = margin;
          }
          doc.setFont("helvetica", "bold");
          const qText = `${idx}. ${quiz.q}`;
          const splitQ = doc.splitTextToSize(qText, w - margin * 2);
          splitQ.forEach((line: string) => {
            doc.text(line, margin, y);
            y += 5;
          });

          doc.setFont("helvetica", "normal");
          if (quiz.options && quiz.options.length > 0) {
            for (let oIdx = 0; oIdx < quiz.options.length; oIdx++) {
              if (y > h - 40) {
                doc.addPage();
                y = margin;
              }
              const prefix = String.fromCharCode(65 + oIdx);
              doc.text(`   ${prefix}. ${quiz.options[oIdx]}`, margin, y);
              y += 5;
            }
          }
          if (opts.showAnswers) {
            if (y > h - 40) {
              doc.addPage();
              y = margin;
            }
            doc.setFont("helvetica", "bold");
            doc.setTextColor(accentText[0], accentText[1], accentText[2]);
            doc.text(`   Answer: ${quiz.a}`, margin, y);
            doc.setTextColor(31, 41, 55);
            y += 8;
          } else {
            y += 5; // Just some spacing between questions if no answer
          }
          idx++;
        }
      }
    }
  }

  // Ensure footers and QR Verification Codes are drawn beautifully on ALL pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom border rule
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(margin, h - 34, w - margin, h - 34);

    // QR Verification Code Embedding
    const verifyUrl = `${window.location.origin}/verify-document?user=${encodeURIComponent(displayUser)}&school=${encodeURIComponent(displaySchool)}&app=Lattys%20Cymatic%20Hub&type=${encodeURIComponent(opts.docType)}&date=${encodeURIComponent(new Date().toLocaleDateString())}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

    // Draw QR code image placeholder or actual QR code from network
    try {
      // jsPDF accepts a standard URL or data-URI for image. Let's place it at bottom right
      doc.addImage(qrCodeUrl, "PNG", w - margin - 22, h - 30, 22, 22);
    } catch (e) {
      // Fallback elegant box outline if offline / image load fails
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(0.5);
      doc.rect(w - margin - 22, h - 30, 22, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text("SCAN QR", w - margin - 19, h - 20);
    }

    // Bottom Branding Footer labels
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(accentText[0], accentText[1], accentText[2]);
    doc.text(tr.footerLogo, margin, h - 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    const wrapFooterText = doc.splitTextToSize(tr.footerText, w - margin * 2 - 30);
    doc.text(wrapFooterText, margin, h - 21);

    doc.setFont("helvetica", "mono");
    doc.setFontSize(7);
    doc.text(tr.scanPrompt, margin, h - 10);

    // Page count
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${i} / ${pageCount}`, w / 2, h - 8, { align: "center" });
  }

  // Construct standard download file name
  const safeTitle = opts.title.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase();
  doc.save(`${safeTitle}_cymatichub.pdf`);
}
