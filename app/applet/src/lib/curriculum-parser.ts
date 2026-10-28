import { assetManager } from "./asset-manager";

export interface ParsedSection {
  sectionTitle: string;
  type: "overview" | "principles" | "practical" | "competencies" | "example" | "general";
  content: string;
}

export interface ParsedSubtopic {
  id: string;
  title: string;
  sections: ParsedSection[];
}

export interface ParsedTopic {
  id: string;
  subject: string;
  level: number; // 1 to 6 (S1-S6)
  title: string;
  description: string;
  subtopics: ParsedSubtopic[];
  rawText?: string;
}

export class CurriculumParser {
  /**
   * Parses raw text or document content into structured curriculum JSON with robust heuristics.
   */
  public static parseText(
    rawText: string,
    defaultSubject: string = "physics",
    defaultLevel: number = 1
  ): ParsedTopic[] {
    const lines = rawText.split(/\r?\n/);
    const topics: ParsedTopic[] = [];

    let currentTopic: ParsedTopic | null = null;
    let currentSubtopic: ParsedSubtopic | null = null;
    let currentSection: ParsedSection | null = null;
    let subject = defaultSubject;
    let level = defaultLevel;

    const commitSection = () => {
      if (currentSection && currentSubtopic) {
        currentSubtopic.sections.push({ ...currentSection });
        currentSection = null;
      }
    };

    const commitSubtopic = () => {
      commitSection();
      if (currentSubtopic && currentTopic) {
        currentTopic.subtopics.push({ ...currentSubtopic });
        currentSubtopic = null;
      }
    };

    const commitTopic = () => {
      commitSubtopic();
      if (currentTopic) {
        // Ensure at least one subtopic if none extracted
        if (currentTopic.subtopics.length === 0) {
          currentTopic.subtopics.push({
            id: `${currentTopic.id}-sub-1`,
            title: `${currentTopic.title} Overview & Core Concepts`,
            sections: [
              {
                sectionTitle: "Overview & Concepts",
                type: "overview",
                content: currentTopic.description || "Detailed study notes and syllabus content.",
              },
            ],
          });
        }
        topics.push({ ...currentTopic });
        currentTopic = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect Subject Header
      const subjectMatch = line.match(/^subject:\s*(math|physics|chemistry|biology|agriculture)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].toLowerCase();
        continue;
      }

      // Detect Class / Level Header (e.g. "Senior 1" or "S1" or "Class: 3")
      const levelMatch = line.match(/^(?:class|senior|s)\s*([1-6])/i);
      if (levelMatch) {
        level = parseInt(levelMatch[1], 10);
        continue;
      }

      // Detect Topic Header (e.g. "Topic 1: ..." or "# Topic: ...")
      const topicMatch = line.match(/^(?:#\s*Topic|Topic\s*\d+[:\-]?)\s*(.+)$/i) || (line.startsWith("# ") && !line.includes("Subtopic"));
      if (topicMatch) {
        commitTopic();
        const titleText = typeof topicMatch === "object" && topicMatch[1] ? topicMatch[1].trim() : line.replace(/^#\s*/, "");
        const topicId = `${subject}-s${level}-${titleText.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;
        currentTopic = {
          id: topicId,
          subject,
          level,
          title: titleText,
          description: "",
          subtopics: [],
        };
        continue;
      }

      // If no topic started yet, create default topic
      if (!currentTopic) {
        currentTopic = {
          id: `${subject}-s${level}-general-topic`,
          subject,
          level,
          title: line.length < 60 ? line : "General Curriculum Module",
          description: line,
          subtopics: [],
        };
        continue;
      }

      // Detect Subtopic Header (e.g. "Subtopic 1.1: ..." or "## ...")
      const subtopicMatch = line.match(/^(?:##\s*Subtopic|Subtopic\s*[\d\.]+[:\-]?)\s*(.+)$/i) || (line.startsWith("## ") && !line.includes("Topic"));
      if (subtopicMatch) {
        commitSubtopic();
        const subTitle = typeof subtopicMatch === "object" && subtopicMatch[1] ? subtopicMatch[1].trim() : line.replace(/^##\s*/, "");
        currentSubtopic = {
          id: `${currentTopic.id}-sub-${currentTopic.subtopics.length + 1}`,
          title: subTitle,
          sections: [],
        };
        continue;
      }

      if (!currentSubtopic) {
        currentSubtopic = {
          id: `${currentTopic.id}-sub-1`,
          title: `${currentTopic.title} - Core Content`,
          sections: [],
        };
      }

      // Detect Academic Content Sections
      const lower = line.toLowerCase();
      let sectionType: ParsedSection["type"] = "general";
      if (lower.includes("introduction") || lower.includes("overview")) {
        sectionType = "overview";
      } else if (lower.includes("fundamental principle") || lower.includes("theory") || lower.includes("law")) {
        sectionType = "principles";
      } else if (lower.includes("practical investigation") || lower.includes("experiment") || lower.includes("activity")) {
        sectionType = "practical";
      } else if (lower.includes("exam competency") || lower.includes("assessment") || lower.includes("competency")) {
        sectionType = "competencies";
      } else if (lower.includes("example") || lower.includes("worked example") || lower.includes("calculation")) {
        sectionType = "example";
      }

      if (sectionType !== "general" || !currentSection) {
        commitSection();
        currentSection = {
          sectionTitle: line.replace(/^[:\-]\s*/, ""),
          type: sectionType,
          content: "",
        };
      } else {
        const processedContent = assetManager.embedAssetMarkdown(line);
        currentSection.content += (currentSection.content ? "\n" : "") + processedContent;
      }
    }

    commitTopic();

    // Fallback if zero topics parsed
    if (topics.length === 0) {
      topics.push({
        id: `${defaultSubject}-s${defaultLevel}-uploaded-notes`,
        subject: defaultSubject,
        level: defaultLevel,
        title: "Uploaded Curriculum Document",
        description: "Successfully ingested notes and study materials.",
        subtopics: [
          {
            id: `${defaultSubject}-s${defaultLevel}-uploaded-sub-1`,
            title: "Core Study Content",
            sections: [
              {
                sectionTitle: "Full Notes & Explanations",
                type: "overview",
                content: assetManager.embedAssetMarkdown(rawText),
              },
            ],
          },
        ],
        rawText,
      });
    }

    return topics;
  }
}
