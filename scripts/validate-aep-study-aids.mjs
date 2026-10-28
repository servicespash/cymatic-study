import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const sqlPath = "supabase/migrations/20261028193000_aep_study_aids_quality_v2.sql";
const manifestPath = "src/data/aep-source-manifest.json";
const sql = readFileSync(sqlPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const rows = [];

for (const line of sql.split("\n")) {
  const match = line.match(/^\s*\('([0-9a-f-]{36})'::uuid, '((?:''|[^'])*)', '((?:''|[^'])*)'::jsonb\),?\s*$/);
  if (!match) continue;
  const [, id, rawSummary, rawSections] = match;
  const summary = rawSummary.replaceAll("''", "'");
  const sections = JSON.parse(rawSections.replaceAll("''", "'"));
  rows.push({ id, summary, sections });
}

const topics = manifest.topics;
assert.equal(topics.length, 39, `Expected 39 source mappings, found ${topics.length}`);
assert.equal(rows.length, topics.length, `Expected one study aid for every mapped topic, found ${rows.length}`);
assert.equal(new Set(rows.map((row) => row.id)).size, rows.length, "Study-aid IDs must be unique");
assert.equal(new Set(topics.map((topic) => topic.topic_id)).size, topics.length, "Source topic IDs must be unique");
assert.equal(new Set(topics.map((topic) => topic.note_id)).size, topics.length, "Source note IDs must be unique");

const expectedSubjects = { Biology: 29, Physics: 10 };
for (const [subject, expectedCount] of Object.entries(expectedSubjects)) {
  assert.equal(topics.filter((topic) => topic.subject === subject).length, expectedCount, `${subject}: unexpected topic count`);
}

const manifestByNoteId = new Map(topics.map((topic) => [topic.note_id, topic]));
const noteIds = new Set(rows.map((row) => row.id));
for (const topic of topics) {
  assert.ok(topic.note_id && noteIds.has(topic.note_id), `${topic.title}: missing study aid in migration`);
  assert.ok(topic.topic_id && topic.document_id, `${topic.title}: missing source identifiers`);
  assert.ok(["Biology", "Physics"].includes(topic.subject), `${topic.title}: unexpected subject`);
  assert.ok(["Level 1", "Level 2"].includes(topic.level), `${topic.title}: invalid AEP level`);
  assert.ok(Number.isInteger(topic.topic_number) && topic.topic_number > 0, `${topic.title}: invalid topic number`);
  assert.ok(Number.isInteger(topic.printed_page) && topic.printed_page > 0, `${topic.title}: invalid printed page`);
  assert.equal(topic.pdf_page, topic.printed_page + 28, `${topic.title}: PDF viewer page offset needs review`);
  assert.ok(topic.source_url.startsWith("https://ncdc.go.ug/"), `${topic.title}: source is not an official NCDC URL`);
}
for (const row of rows) {
  const topic = manifestByNoteId.get(row.id);
  assert.ok(topic, `${row.id}: note is not linked to a source topic in the manifest`);
  assert.ok(row.summary.trim().split(/\s+/).length >= 20, `${topic.title}: summary is too short`);
  assert.ok(Array.isArray(row.sections) && row.sections.length >= 5, `${topic.title}: expected at least five study sections`);
  assert.ok(row.sections.every((section) => typeof section.heading === "string" && section.heading.trim() && typeof section.content === "string" && section.content.trim().length > 50), `${topic.title}: malformed or empty section`);
  assert.match(row.sections.at(-1).heading, /check your understanding/i, `${topic.title}: missing self-check section`);
  assert.ok(row.sections.at(-1).content.includes("Answers:"), `${topic.title}: self-check answers are missing`);
}

assert.match(sql, /review_status = 'needs_review'/, "Notes must remain in review");
assert.match(sql, /publication_status = 'draft'/, "Notes must not be published automatically");
assert.match(sql, /all 39 indexed topic records/i, "Migration must explicitly cover all 39 mapped topic records");
console.log(`Validated ${rows.length} original AEP study aids against ${topics.length} NCDC topic mappings (29 Biology, 10 Physics); all remain draft and require subject review.`);
