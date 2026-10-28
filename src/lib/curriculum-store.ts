/**
 * Dynamic Curriculum Store & Ingestion Persistence
 *
 * Manages:
 * 1. Staged curriculum topics awaiting developer verification
 * 2. Published curriculum topics active in the live S1-S6 Science curriculum
 * 3. Diagram and image asset repository with virtual directory path mapping
 * 4. Seamless merging with static topics (topics.ts) and notes (notes.ts)
 */

import { topics as staticTopics, Topic } from "@/data/topics";
import { topicNotes as staticNotes, TopicNote } from "@/data/notes";
import { ADMIN_STRUCTURED_PASSCODE } from "@/lib/admin-auth";
import {
  ScienceSubjectId,
  ParsedCurriculumTopic,
  ParsedCurriculumDocument,
} from "@/lib/curriculum-parser";

export interface DiagramAsset {
  id: string;
  name: string;
  virtualPath: string; // e.g. "curriculum/physics/circuits/wheatstone_bridge.png"
  subject: ScienceSubjectId;
  level: number;
  dataUrl: string; // base64 or blob URL
  caption?: string;
  createdAt: string;
}

export interface StagedCurriculumTopic {
  id: string;
  title: string;
  subject: ScienceSubjectId;
  level: number;
  description: string;
  subtopics: string[];
  competencies: string[];
  formulas: string[];
  sections: { heading: string; content: string }[];
  examples: { problem: string; solution: string }[];
  diagrams: {
    id: string;
    virtualPath: string;
    caption?: string;
    dataUrl?: string;
  }[];
  sourceType: "pdf" | "txt" | "manual";
  sourceName?: string;
  stagedAt: string;
  authorEmail?: string;
}

export interface PublishedCurriculumTopic extends StagedCurriculumTopic {
  publishedAt: string;
}

const STORAGE_KEYS = {
  STAGED: "cymatic_curriculum_staged_v1",
  PUBLISHED: "cymatic_curriculum_published_v1",
  DIAGRAMS: "cymatic_curriculum_diagrams_v1",
};

const UPDATE_EVENT = "cymatic:curriculum-updated";

function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }
}

// ── DIAGRAM ASSETS ───────────────────────────────────────────────────────────

export function getDiagramAssets(): DiagramAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Notice reading diagram assets from localStorage:", e);
    return [];
  }
}

export function saveDiagramAsset(asset: DiagramAsset): void {
  const current = getDiagramAssets();
  const existingIdx = current.findIndex(
    (d) => d.id === asset.id || d.virtualPath.toLowerCase() === asset.virtualPath.toLowerCase(),
  );
  if (existingIdx >= 0) {
    current[existingIdx] = asset;
  } else {
    current.unshift(asset);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(current));
    notifyUpdate();
  } catch (e) {
    console.error("Failed to save diagram asset to storage:", e);
  }
}

export function deleteDiagramAsset(id: string): void {
  const filtered = getDiagramAssets().filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(filtered));
    notifyUpdate();
  } catch (e) {
    console.error("Failed to delete diagram asset:", e);
  }
}

export function getDiagramByPath(virtualPath: string): DiagramAsset | undefined {
  const normalized = virtualPath.replace(/^\/+/, "").toLowerCase();
  return getDiagramAssets().find(
    (d) => d.virtualPath.replace(/^\/+/, "").toLowerCase() === normalized,
  );
}

// ── STAGED TOPICS ────────────────────────────────────────────────────────────

export function getStagedTopics(): StagedCurriculumTopic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAGED);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Notice reading staged topics:", e);
    return [];
  }
}

export function saveStagedTopic(topic: StagedCurriculumTopic): void {
  const current = getStagedTopics();
  const existingIdx = current.findIndex((t) => t.id === topic.id);
  if (existingIdx >= 0) {
    current[existingIdx] = topic;
  } else {
    current.unshift(topic);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.STAGED, JSON.stringify(current));
    notifyUpdate();
  } catch (e) {
    console.error("Failed to save staged topic:", e);
  }
}

export function removeStagedTopic(id: string): void {
  const filtered = getStagedTopics().filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.STAGED, JSON.stringify(filtered));
    notifyUpdate();
  } catch (e) {
    console.error("Failed to delete staged topic:", e);
  }
}

export function clearAllStagedTopics(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.STAGED);
    notifyUpdate();
  } catch (e) {
    console.error("Failed to clear staged topics:", e);
  }
}

/**
 * Stages all topics from a parsed document into the Developer Console.
 */
export function stageParsedDocument(
  doc: ParsedCurriculumDocument,
  sourceType: "pdf" | "txt" | "manual",
  sourceName?: string,
  authorEmail?: string,
): StagedCurriculumTopic[] {
  const stagedItems: StagedCurriculumTopic[] = doc.topics.map((t) => {
    // Map diagram references to any stored diagrams with matching path
    const diagrams = t.diagramReferences.map((ref, idx) => {
      const match = getDiagramByPath(ref.virtualPath);
      return {
        id: match?.id || `diag-${Date.now()}-${idx}`,
        virtualPath: ref.virtualPath,
        caption: ref.caption || match?.caption,
        dataUrl: match?.dataUrl,
      };
    });

    return {
      id: t.id,
      title: t.title,
      subject: t.subject,
      level: t.level,
      description: t.description,
      subtopics: t.subtopics,
      competencies: t.competencies,
      formulas: t.formulas,
      sections: t.sections,
      examples: t.examples,
      diagrams,
      sourceType,
      sourceName: sourceName || doc.documentTitle,
      stagedAt: new Date().toISOString(),
      authorEmail,
    };
  });

  const existing = getStagedTopics();
  const merged = [
    ...stagedItems,
    ...existing.filter((e) => !stagedItems.some((s) => s.id === e.id)),
  ];

  try {
    localStorage.setItem(STORAGE_KEYS.STAGED, JSON.stringify(merged));
    notifyUpdate();
  } catch (e) {
    console.error("Failed to save parsed document to staging:", e);
  }

  return stagedItems;
}

// ── PUBLISHED CURRICULUM TOPICS ──────────────────────────────────────────────

export function getPublishedTopics(): PublishedCurriculumTopic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PUBLISHED);
    if (!raw) return [];
    const topics: PublishedCurriculumTopic[] = JSON.parse(raw);

    // Deduplicate
    const unique = new Map<string, PublishedCurriculumTopic>();
    topics.forEach((t) => unique.set(t.id, t));

    return Array.from(unique.values());
  } catch (e) {
    console.warn("Notice reading published topics:", e);
    return [];
  }
}

/**
 * Publishes a staged topic to the active curriculum tree.
 * Requires secret developer passcode verification (which is never revealed in UI).
 */
export function publishStagedTopic(
  id: string,
  passcode: string,
): { success: boolean; message: string; publishedTopic?: PublishedCurriculumTopic } {
  if (passcode.trim() !== ADMIN_STRUCTURED_PASSCODE) {
    return {
      success: false,
      message: "Security passcode invalid. Master authorization required to publish.",
    };
  }

  const staged = getStagedTopics();
  const target = staged.find((t) => t.id === id);
  if (!target) {
    return { success: false, message: "Staged topic not found." };
  }

  const published: PublishedCurriculumTopic = {
    ...target,
    publishedAt: new Date().toISOString(),
  };

  const currentPublished = getPublishedTopics();
  const existingIdx = currentPublished.findIndex((p) => p.id === id);
  if (existingIdx >= 0) {
    currentPublished[existingIdx] = published;
  } else {
    currentPublished.unshift(published);
  }

  // Remove from staged
  const remainingStaged = staged.filter((t) => t.id !== id);

  try {
    localStorage.setItem(STORAGE_KEYS.PUBLISHED, JSON.stringify(currentPublished));
    localStorage.setItem(STORAGE_KEYS.STAGED, JSON.stringify(remainingStaged));
    notifyUpdate();
    return {
      success: true,
      message: `Topic "${published.title}" published into active Senior ${published.level} Science curriculum.`,
      publishedTopic: published,
    };
  } catch (e) {
    console.error("Publishing failed:", e);
    return { success: false, message: "Storage error occurred during publishing." };
  }
}

/**
 * Unpublishes a topic, removing it from the active lessons tree.
 */
export function unpublishTopic(
  id: string,
  passcode: string,
): { success: boolean; message: string } {
  if (passcode.trim() !== ADMIN_STRUCTURED_PASSCODE) {
    return { success: false, message: "Security passcode invalid." };
  }

  const filtered = getPublishedTopics().filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.PUBLISHED, JSON.stringify(filtered));
    notifyUpdate();
    return { success: true, message: "Topic removed from active lessons tree." };
  } catch (e) {
    return { success: false, message: "Error unpublishing topic." };
  }
}

// ── COMBINED CURRICULUM QUERIES (STATIC + PUBLISHED) ─────────────────────────

/**
 * Combines static topics from topics.ts with dynamically published topics.
 * Seamlessly exposes them to the Lessons page, search bar, and accordion reader.
 */
export function getCombinedTopics(subject?: string, level?: number): Topic[] {
  const published = getPublishedTopics();

  // Convert published topics to standard Topic shape
  const dynamicMap = new Map<string, Topic>();
  published.forEach((p) => {
    dynamicMap.set(p.id, {
      id: p.id,
      title: p.title,
      subject: p.subject,
      level: p.level,
      description: p.description,
      formulas: p.formulas,
      keyPoints: p.competencies.length > 0 ? p.competencies : p.subtopics,
    });
  });
  const dynamicAsTopics = Array.from(dynamicMap.values());

  // Merge with static topics (dynamic takes precedence if ID collides)
  const dynamicIds = new Set(dynamicAsTopics.map((d) => d.id));
  const merged: Topic[] = [
    ...dynamicAsTopics,
    ...staticTopics.filter((t) => !dynamicIds.has(t.id)),
  ];

  return merged.filter((t) => {
    const matchesSubject = !subject || t.subject === subject;
    const matchesLevel = !level || t.level === level;
    return matchesSubject && matchesLevel;
  });
}

/**
 * Retrieves the comprehensive note for a topic.
 * Looks first in dynamic published notes; falls back to static notes.ts.
 */
export interface ComprehensiveTopicNote extends TopicNote {
  diagrams?: {
    id: string;
    virtualPath: string;
    caption?: string;
    dataUrl?: string;
  }[];
  subtopics?: string[];
  isDynamic?: boolean;
}

export function getCombinedTopicNote(topicId: string): ComprehensiveTopicNote | undefined {
  const published = getPublishedTopics().find((p) => p.id === topicId);
  if (published) {
    return {
      topicId: published.id,
      sections: published.sections,
      examples: published.examples,
      diagrams: published.diagrams,
      subtopics: published.subtopics,
      isDynamic: true,
    };
  }

  const staticNote = staticNotes.find((n) => n.topicId === topicId);
  if (staticNote) {
    return {
      topicId: staticNote.topicId,
      sections: staticNote.sections,
      examples: staticNote.examples,
      isDynamic: false,
    };
  }

  return undefined;
}

/**
 * React helper hook to subscribe to curriculum updates across components.
 */
import { useEffect, useState } from "react";

export function useCurriculumStore() {
  const [stagedTopics, setStagedTopics] = useState<StagedCurriculumTopic[]>(() =>
    getStagedTopics(),
  );
  const [publishedTopics, setPublishedTopics] = useState<PublishedCurriculumTopic[]>(() =>
    getPublishedTopics(),
  );
  const [diagrams, setDiagrams] = useState<DiagramAsset[]>(() => getDiagramAssets());

  useEffect(() => {
    const refresh = () => {
      setStagedTopics(getStagedTopics());
      setPublishedTopics(getPublishedTopics());
      setDiagrams(getDiagramAssets());
    };

    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return {
    stagedTopics,
    publishedTopics,
    diagrams,
    refresh: () => {
      setStagedTopics(getStagedTopics());
      setPublishedTopics(getPublishedTopics());
      setDiagrams(getDiagramAssets());
    },
  };
}
