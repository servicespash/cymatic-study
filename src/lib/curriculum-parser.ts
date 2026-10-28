/**
 * Robust Heuristic Curriculum Parser
 * Parses PDF/TXT documents into structured academic units:
 * subject, level, topic, subtopics, overview concepts, detailed study content,
 * formulas, worked examples, and diagram references with asset management integration.
 */

import { assetManager, ManagedAsset } from "./asset-manager";

export type ScienceSubjectId = "physics" | "chemistry" | "biology" | "mathematics" | "agriculture";

export interface ParsedCurriculumDocument {
  documentTitle: string;
  subjectTitle: ScienceSubjectId;
  levelLabel: string;
  levelNumber: number;
  topics: ParsedCurriculumTopic[];
  totalWordCount: number;
  rawExtractedText: string;
}

export interface ParsedCurriculumTopic {
  id: string;
  title: string;
  subject: ScienceSubjectId;
  level: number;
  overviewConcept: string;
  subtopics: string[];
  competencies: string[];
  formulas: string[];
  sections: { heading: string; content: string }[];
  examples: { problem: string; solution: string }[];
  diagramReferences: { virtualPath: string; caption?: string; assetId?: string }[];
}

export function detectScienceSubject(text: string): ScienceSubjectId {
  const lower = text.toLowerCase();
  if (lower.includes("physics") || lower.includes("newton") || lower.includes("kinematics") || lower.includes("circuit") || lower.includes("optics")) {
    return "physics";
  }
  if (lower.includes("chemistry") || lower.includes("mole") || lower.includes("periodic table") || lower.includes("reaction") || lower.includes("acid")) {
    return "chemistry";
  }
  if (lower.includes("biology") || lower.includes("cell") || lower.includes("photosynthesis") || lower.includes("ecosystem") || lower.includes("genetics") || lower.includes("organism")) {
    return "biology";
  }
  if (lower.includes("agriculture") || lower.includes("crop") || lower.includes("soil") || lower.includes("livestock") || lower.includes("agronomy")) {
    return "agriculture";
  }
  return "mathematics";
}

export function detectSeniorLevel(text: string): number {
  const lower = text.toLowerCase();
  if (lower.includes("senior 6") || lower.includes("s.6") || lower.includes("advanced level") || lower.includes("s6")) return 6;
  if (lower.includes("senior 5") || lower.includes("s.5") || lower.includes("s5")) return 5;
  if (lower.includes("senior 4") || lower.includes("s.4") || lower.includes("s4")) return 4;
  if (lower.includes("senior 3") || lower.includes("s.3") || lower.includes("s3")) return 3;
  if (lower.includes("senior 2") || lower.includes("s.2") || lower.includes("s2")) return 2;
  return 1;
}

export function parseCurriculumText(text: string, filename: string): ParsedCurriculumDocument {
  const subject = detectScienceSubject(text);
  const level = detectSeniorLevel(text);
  const words = text.split(/\s+/).filter(Boolean);

  // Heuristic topic splitting by lines starting with "Topic", "Chapter", or capitalized bold headings
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const topics: ParsedCurriculumTopic[] = [];

  let currentTopicTitle = "Core Foundation Topic";
  let currentOverview = "";
  let currentSubtopics: string[] = [];
  let currentCompetencies: string[] = [];
  let currentFormulas: string[] = [];
  let currentSections: { heading: string; content: string }[] = [];
  let currentExamples: { problem: string; solution: string }[] = [];
  let currentDiagrams: { virtualPath: string; caption?: string; assetId?: string }[] = [];

  let activeHeading = "Overview Concepts";
  let activeSectionBody: string[] = [];

  const flushSection = () => {
    if (activeSectionBody.length > 0) {
      currentSections.push({
        heading: activeHeading,
        content: activeSectionBody.join("\n\n"),
      });
      activeSectionBody = [];
    }
  };

  const flushTopic = () => {
    flushSection();
    if (currentSections.length === 0) {
      currentSections.push({
        heading: "Comprehensive Study Notes",
        content: currentOverview || "Detailed multi-paragraph textbook explanation covering fundamental principles, mechanisms, and academic investigations.",
      });
    }

    const topicId = `${subject}_s${level}_${topics.length + 1}_${currentTopicTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;

    topics.push({
      id: topicId,
      title: currentTopicTitle,
      subject,
      level,
      overviewConcept: currentOverview || `Core overview concept for ${currentTopicTitle}.`,
      subtopics: currentSubtopics.length > 0 ? currentSubtopics : ["Introduction & Definitions", "Core Principles", "Applications & Investigations"],
      competencies: currentCompetencies.length > 0 ? currentCompetencies : ["Understand key theoretical framework", "Perform calculations and practical data analysis"],
      formulas: currentFormulas,
      sections: currentSections,
      examples: currentExamples,
      diagramReferences: currentDiagrams,
    });

    currentOverview = "";
    currentSubtopics = [];
    currentCompetencies = [];
    currentFormulas = [];
    currentSections = [];
    currentExamples = [];
    currentDiagrams = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a topic header
    if (/^(topic|chapter|unit)\s+\d+/i.test(line) || (/^[A-Z\s]{5,50}$/.test(line) && line.length > 8 && !line.includes("SECTION"))) {
      if (currentTopicTitle && (activeSectionBody.length > 0 || currentOverview)) {
        flushTopic();
      }
      currentTopicTitle = line.replace(/^(topic|chapter|unit)\s+\d+[:\-\s]*/i, "").trim() || line;
      activeHeading = "Overview Concepts";
      continue;
    }

    // Check standard academic headers
    if (/^(introduction|overview|fundamental principles|practical investigations|exam competencies|worked examples|summary|exercises):?/i.test(line)) {
      flushSection();
      activeHeading = line.replace(/:$/, "").trim();
      continue;
    }

    // Extract formulas (lines with math symbols or equals)
    if (line.includes("=") && (line.includes("+") || line.includes("-") || line.includes("*") || line.includes("/") || line.includes("v =") || line.includes("F ="))) {
      currentFormulas.push(line);
    }

    // Extract subtopics if bullet or numbered
    if (/^(\d+\.[\d\.]*|[•\-\*])\s+/.test(line)) {
      currentSubtopics.push(line.replace(/^(\d+\.[\d\.]*|[•\-\*])\s+/, ""));
    }

    if (!currentOverview && activeHeading === "Overview Concepts") {
      currentOverview = line;
    }

    activeSectionBody.push(line);
  }

  // Flush final topic
  flushTopic();

  // Fallback if no topics found
  if (topics.length === 0) {
    topics.push({
      id: `${subject}_s${level}_fallback_1`,
      title: filename.replace(/\.[^/.]+$/, ""),
      subject,
      level,
      overviewConcept: text.slice(0, 300) + "...",
      subtopics: ["Fundamental Principles", "Practical Investigations", "Exam Competencies"],
      competencies: ["Master core definitions and analytical problem solving."],
      formulas: [],
      sections: [
        { heading: "Overview Concepts", content: text.slice(0, 1000) },
        { heading: "Detailed Study Content", content: text.slice(1000, 3500) || text },
      ],
      examples: [],
      diagramReferences: [],
    });
  }

  // Register asset diagrams if any markdown images exist in text
  const registered = assetManager.extractAndRegisterDiagramMarkers(text, subject, topics[0]?.id || "general");
  if (registered.registeredAssets.length > 0 && topics[0]) {
    topics[0].diagramReferences = registered.registeredAssets.map((a) => ({
      virtualPath: a.virtualPath,
      caption: a.caption,
      assetId: a.id,
    }));
  }

  return {
    documentTitle: filename,
    subjectTitle: subject,
    levelLabel: `Senior ${level}`,
    levelNumber: level,
    topics,
    totalWordCount: words.length,
    rawExtractedText: text,
  };
}

export async function parseRobustCurriculum(
  data: Buffer | string,
  filename: string,
  isPdf: boolean,
): Promise<ParsedCurriculumDocument> {
  let textContent: string;

  if (isPdf) {
    if (typeof data === "string") {
      throw new Error("PDF ingestion requires binary file data.");
    }

    // Import PDF.js only in the server-side ingestion path. Converting raw PDF
    // bytes to UTF-8 is not PDF text extraction and can produce corrupt content.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: unknown) => {
            if (item && typeof item === "object" && "str" in item) {
              return String((item as { str: unknown }).str ?? "");
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
        pages.push(pageText);
        page.cleanup();
      }
    } finally {
      await pdf.destroy();
    }

    textContent = pages.join("\\n\\n").replace(/[ \\t]+/g, " ").trim();
    if (textContent.length < 100) {
      throw new Error(
        "PDF contains too little extractable text. It may be scanned; OCR is required before deterministic ingestion.",
      );
    }
  } else {
    textContent = typeof data === "string" ? data : data.toString("utf-8");
  }

  if (!textContent.trim()) {
    throw new Error("No readable text was extracted from the selected document.");
  }

  // AEP Level 1/2 is not equivalent by default to Senior 1/2. Do not silently
  // misclassify this source in the existing S1-S6 lesson hierarchy.
  if (/accelerated education programme|\\bAEP\\b/i.test(textContent) &&
      /\\blevels?\\s*1\\s*(?:and|&)\\s*2\\b/i.test(textContent)) {
    throw new Error(
      "This PDF is an NCDC Accelerated Education Programme (AEP) Level 1/2 syllabus. The current injector only supports the standard Senior 1-6 hierarchy, so it was not staged under Senior 1 or Senior 2. Add an explicit AEP curriculum mapping before importing it.",
    );
  }

  return parseCurriculumText(textContent, filename);
}
