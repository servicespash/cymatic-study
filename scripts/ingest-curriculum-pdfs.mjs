#!/usr/bin/env node
/**
 * Private metadata-only pilot for NCDC curriculum PDFs.
 * Validates PDF structure, hashes bytes, extracts table-of-contents headings,
 * and writes a local JSON report. It does NOT upload PDF bytes or extracted prose.
 *
 * Optional database write: pass --commit and configure SUPABASE_URL plus
 * SUPABASE_SERVICE_ROLE_KEY. Never use a VITE_* key for administrative writes.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";

dotenv.config();

const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const manifestPath = getArg("--manifest");
const outputPath = getArg("--output") ?? "./curriculum-pdf-ingestion-report.json";
const commit = args.includes("--commit");

if (!manifestPath) {
  console.error("Usage: node scripts/ingest-curriculum-pdfs.mjs --manifest <manifest.json> [--output report.json] [--commit]");
  process.exit(2);
}

const manifest = JSON.parse(await fs.readFile(path.resolve(manifestPath), "utf8"));
if (!Array.isArray(manifest.documents) || manifest.documents.length === 0) {
  throw new Error("Manifest must contain a non-empty documents array.");
}

const results = [];
for (const item of manifest.documents) {
  if (!item.id || !item.title || !item.subject_label || !item.file) {
    throw new Error("Each document requires id, title, subject_label, and file.");
  }
  const filePath = path.resolve(path.dirname(path.resolve(manifestPath)), item.file);
  const bytes = await fs.readFile(filePath);
  if (bytes.length < 8 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error(`Not a valid PDF header: ${filePath}`);
  }

  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  let parsed;
  try {
    parsed = await parser.getText();
  } finally {
    await parser.destroy();
  }

  const extractedText = String(parsed?.text ?? "");
  if (extractedText.trim().length < 200) {
    throw new Error(`PDF text extraction returned too little text: ${filePath}. OCR may be required.`);
  }
  const pageCount = Number(parsed?.total ?? parsed?.pages?.length ?? 0) || null;
  const headings = [...new Set(extractedText.split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) =>
      line.length >= 5 && line.length <= 140 &&
      (/^(?:Topic\s+\d+[:.]?|Sub-?topic\s+\d+[:.]?|Theme\s*:|Level\s+[12]\b)/i.test(line) ||
       /^(?:Introduction to|Measurements$|Forces and their Effects$|Cells$|Classification$|Flowering Plants$|Nutrition in Plants and Animals$|Transport in Plants and Animals$|Inheritance$|Introduction to Ecology$)/i.test(line))
    ))].slice(0, 250);

  results.push({
    id: item.id,
    title: item.title,
    subject_label: item.subject_label,
    curriculum_programme: item.curriculum_programme ?? "Uganda Accelerated Education Programme (AEP)",
    level_labels: item.level_labels ?? ["Level 1", "Level 2"],
    source_organization: item.source_organization ?? "National Curriculum Development Centre (NCDC), Uganda",
    source_url: item.source_url ?? "https://ncdc.go.ug/books/",
    original_filename: path.basename(filePath),
    sha256,
    mime_type: "application/pdf",
    size_bytes: bytes.length,
    page_count: pageCount,
    extracted_topic_headings: headings,
    extracted_learning_outcomes_count: 0,
    storage_path: null,
    license_status: item.license_status ?? "pending_permission",
    publication_status: "draft",
    review_notes: "Private pilot. Verify AEP-vs-standard-level mapping and redistribution permission before publishing."
  });
}

await fs.writeFile(path.resolve(outputPath), JSON.stringify({
  generated_at: new Date().toISOString(),
  mode: commit ? "metadata_commit_requested" : "local_dry_run",
  documents: results
}, null, 2) + "\n", "utf8");

console.log(`Validated ${results.length} PDF(s). Metadata report: ${path.resolve(outputPath)}`);
console.log("No PDF bytes or full extracted text were uploaded.");
if (!commit) {
  console.log("Dry run only. Add --commit to upsert draft metadata into Supabase.");
  process.exit(0);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("--commit requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. VITE_* keys are intentionally rejected.");
}
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

for (const document of results) {
  const { error } = await supabase.from("curriculum_documents").upsert(document, { onConflict: "id" });
  if (error) throw new Error(`Supabase upsert failed for ${document.id}: ${error.message}`);
}
console.log(`Upserted ${results.length} draft metadata record(s) into curriculum_documents.`);
