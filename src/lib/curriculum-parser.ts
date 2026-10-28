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
  curriculumProgramme?: string;
  sourceDocumentId?: string;
  topics: ParsedCurriculumTopic[];
  totalWordCount: number;
  rawExtractedText: string;
}

export interface ParsedCurriculumTopic {
  id: string;
  title: string;
  subject: ScienceSubjectId;
  level: number;
  curriculumLevelLabel?: string;
  curriculumProgramme?: string;
  sourceDocumentId?: string;
  sourcePage?: number;
  topicNumber?: number;
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


type AepTopicSeed = { level: "Level 1" | "Level 2"; number: number; title: string; page: number };

const AEP_PHYSICS_TOPICS: AepTopicSeed[] = [
  { level: "Level 1", number: 1, title: "Measurements", page: 2 },
  { level: "Level 1", number: 2, title: "Forces and their Effects", page: 5 },
  { level: "Level 1", number: 3, title: "Light", page: 15 },
  { level: "Level 1", number: 4, title: "Waves", page: 18 },
  { level: "Level 1", number: 5, title: "Earth and Space Physics", page: 22 },
  { level: "Level 2", number: 1, title: "Thermal Physics", page: 28 },
  { level: "Level 2", number: 2, title: "Electricity and Magnetism", page: 36 },
  { level: "Level 2", number: 3, title: "Atomic and Nuclear Physics", page: 48 },
  { level: "Level 2", number: 4, title: "Satellites and Communication", page: 52 },
  { level: "Level 2", number: 5, title: "Digital Electronics", page: 53 },
];

const AEP_BIOLOGY_TOPICS: AepTopicSeed[] = [
  { level: "Level 1", number: 1, title: "Introduction to Biology", page: 1 },
  { level: "Level 1", number: 2, title: "Cells", page: 2 },
  { level: "Level 1", number: 3, title: "Classification", page: 4 },
  { level: "Level 1", number: 4, title: "Insects", page: 8 },
  { level: "Level 1", number: 5, title: "Flowering Plants", page: 10 },
  { level: "Level 1", number: 6, title: "Physical and Chemical Properties of Soil", page: 12 },
  { level: "Level 1", number: 7, title: "Soil Erosion and Conservation: Causes, Effects and Prevention", page: 14 },
  { level: "Level 1", number: 8, title: "Nutrition Types and Nutrient Compounds", page: 16 },
  { level: "Level 1", number: 9, title: "Nutrition in Green Plants", page: 18 },
  { level: "Level 1", number: 10, title: "Nutrition in Mammals", page: 20 },
  { level: "Level 1", number: 11, title: "Transport in Plants", page: 23 },
  { level: "Level 1", number: 12, title: "Transport in Animals", page: 25 },
  { level: "Level 2", number: 1, title: "Gaseous Exchange", page: 27 },
  { level: "Level 2", number: 2, title: "Aerobic and Anaerobic Respiration", page: 29 },
  { level: "Level 2", number: 3, title: "Excretion in Animals", page: 31 },
  { level: "Level 2", number: 4, title: "Chemical Coordination in Humans", page: 32 },
  { level: "Level 2", number: 5, title: "Nervous Coordination in Humans", page: 34 },
  { level: "Level 2", number: 6, title: "Receptor Organs in Man", page: 36 },
  { level: "Level 2", number: 7, title: "Locomotion in Mammals", page: 37 },
  { level: "Level 2", number: 8, title: "Growth in Plants and Animals", page: 39 },
  { level: "Level 2", number: 9, title: "Development in Plants and Animals", page: 41 },
  { level: "Level 2", number: 10, title: "Asexual Reproduction in Plants (Vegetative Reproduction)", page: 43 },
  { level: "Level 2", number: 11, title: "Sexual Reproduction in Plants", page: 44 },
  { level: "Level 2", number: 12, title: "Sexual Reproduction in Human", page: 46 },
  { level: "Level 2", number: 13, title: "Inheritance", page: 49 },
  { level: "Level 2", number: 14, title: "Introduction to Ecology", page: 51 },
  { level: "Level 2", number: 15, title: "Food Chains and Food Webs", page: 52 },
  { level: "Level 2", number: 16, title: "Associations in Biological Communities", page: 54 },
  { level: "Level 2", number: 17, title: "Humans and the Natural Environment", page: 55 },
];

function normalizeHeading(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseAepSyllabusText(text: string, filename: string): ParsedCurriculumDocument {
  const subject: ScienceSubjectId = /biology/i.test(text.slice(0, 5000)) ? "biology" : "physics";
  const documentId = subject === "biology"
    ? "ncdc-aep-biology-lsc-level-1-2-2023"
    : "ncdc-aep-physics-lsc-level-1-2-2023";
  const seeds = subject === "biology" ? AEP_BIOLOGY_TOPICS : AEP_PHYSICS_TOPICS;
  const normalizedText = normalizeHeading(text);
  const topics: ParsedCurriculumTopic[] = seeds
    .filter((seed) => normalizedText.includes(normalizeHeading(seed.title)))
    .map((seed) => ({
      id: documentId + "-" + seed.level.toLowerCase().replace(/\s+/g, "-") + "-" + seed.number,
      title: seed.title,
      subject,
      level: seed.level === "Level 1" ? 1 : 2,
      curriculumLevelLabel: seed.level,
      curriculumProgramme: "Uganda Accelerated Education Programme (AEP)",
      sourceDocumentId: documentId,
      sourcePage: seed.page,
      topicNumber: seed.number,
      overviewConcept: "Topic heading extracted from the NCDC source syllabus; original study notes require developer review.",
      subtopics: [],
      competencies: [],
      formulas: [],
      sections: [],
      examples: [],
      diagramReferences: [],
    }));

  if (topics.length !== seeds.length) {
    const missing = seeds.filter((seed) => !topics.some((topic) => topic.title === seed.title));
    throw new Error("AEP PDF text was extracted, but " + topics.length + "/" + seeds.length +
      " expected headings were verified. Missing: " + missing.map((item) => item.title).join(", ") +
      ". Check extraction quality before staging.");
  }

  return {
    documentTitle: filename,
    subjectTitle: subject,
    levelLabel: "AEP Levels 1–2",
    levelNumber: 1,
    curriculumProgramme: "Uganda Accelerated Education Programme (AEP)",
    sourceDocumentId: documentId,
    topics,
    totalWordCount: text.split(/\s+/).filter(Boolean).length,
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
              const entry = item as { str: unknown; hasEOL?: boolean };
              const value = String(entry.str ?? "");
              return value ? value + (entry.hasEOL ? "\n" : " ") : "";
            }
            return "";
          })
          .join("");
        pages.push(pageText);
        page.cleanup();
      }
    } finally {
      await pdf.destroy();
    }

    textContent = pages.join("\n\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
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

  // Keep AEP levels separate; never relabel them Senior 1/2.
  if (/accelerated education programme|\bAEP\b/i.test(textContent) &&
      /\blevels?\s*1\s*(?:and|&)\s*2\b/i.test(textContent)) {
    return parseAepSyllabusText(textContent, filename);
  }

  return parseCurriculumText(textContent, filename);
}
