import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const path = "supabase/migrations/20261028193000_aep_study_aids_quality_v2.sql";
const sql = readFileSync(path, "utf8");
const rows = [];

for (const line of sql.split("\n")) {
  const match = line.match(/^\s*\('([0-9a-f-]{36})'::uuid, '((?:''|[^'])*)', '((?:''|[^'])*)'::jsonb\),?\s*$/);
  if (!match) continue;
  const [, id, rawSummary, rawSections] = match;
  const summary = rawSummary.replaceAll("''", "'");
  const sections = JSON.parse(rawSections.replaceAll("''", "'"));
  rows.push({ id, summary, sections });
}

assert.equal(rows.length, 39, `Expected 39 AEP study aids, found ${rows.length}`);
assert.equal(new Set(rows.map((row) => row.id)).size, rows.length, "Study-aid IDs must be unique");

for (const row of rows) {
  assert.ok(row.summary.trim().split(/\s+/).length >= 20, `${row.id}: summary is too short`);
  assert.ok(Array.isArray(row.sections) && row.sections.length >= 5, `${row.id}: expected at least five study sections`);
  assert.ok(row.sections.every((section) => typeof section.heading === "string" && section.heading.trim() && typeof section.content === "string" && section.content.trim().length > 50), `${row.id}: malformed or empty section`);
  assert.match(row.sections.at(-1).heading, /check your understanding/i, `${row.id}: missing self-check section`);
}

assert.match(sql, /review_status = 'needs_review'/, "Notes must remain in review");
assert.match(sql, /publication_status = 'draft'/, "Notes must not be published automatically");
console.log(`Validated ${rows.length} original AEP study aids; all are draft and require review.`);
