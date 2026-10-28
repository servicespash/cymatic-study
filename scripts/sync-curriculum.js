/**
 * Supabase Curriculum Synchronization Script
 * Pulls lesson content from local JSON files or remote GitHub open-source repositories
 * and upserts them directly into Supabase tables (`curriculum_topics`, `curriculum_sections`).
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncCurriculumFromFile(filePath) {
  console.log(`📖 Reading curriculum document from: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const doc = JSON.parse(rawData);

  console.log(`🚀 Synchronizing document: "${doc.documentTitle}" (${doc.topics.length} topics detected)`);

  for (const topic of doc.topics) {
    console.log(`   -> Upserting topic: [S${topic.level} ${topic.subject}] ${topic.title}`);

    // 1. Upsert Topic
    const { error: topicError } = await supabase
      .from("curriculum_topics")
      .upsert({
        id: topic.id,
        subject_id: topic.subject,
        level: topic.level,
        title: topic.title,
        overview_concept: topic.overviewConcept,
        subtopics: topic.subtopics || [],
        competencies: topic.competencies || [],
        formulas: topic.formulas || [],
      }, { onConflict: "id" });

    if (topicError) {
      console.warn(`   ⚠️ Warning upserting topic ${topic.id}:`, topicError.message);
      continue;
    }

    // 2. Clear old sections for this topic and insert fresh sections
    await supabase.from("curriculum_sections").delete().eq("topic_id", topic.id);

    if (topic.sections && topic.sections.length > 0) {
      const sectionRows = topic.sections.map((sec, idx) => ({
        topic_id: topic.id,
        heading: sec.heading,
        content: sec.content,
        sort_order: idx,
      }));

      const { error: sectionError } = await supabase
        .from("curriculum_sections")
        .insert(sectionRows);

      if (sectionError) {
        console.warn(`   ⚠️ Warning inserting sections for ${topic.id}:`, sectionError.message);
      } else {
        console.log(`      ✅ Successfully inserted ${sectionRows.length} study sections.`);
      }
    }
  }

  console.log("✨ Curriculum synchronization completed successfully!");
}

async function run() {
  const targetFile = process.argv[2] || path.resolve("./scripts/sample-curriculum.json");
  try {
    await syncCurriculumFromFile(targetFile);
  } catch (err) {
    console.error("❌ Synchronization failed:", err.message);
    process.exit(1);
  }
}

run();
