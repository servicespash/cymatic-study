# AEP study-aid review protocol

## Scope

The pilot covers the two uploaded National Curriculum Development Centre (NCDC) Accelerated Education Programme (AEP) revised lower-secondary syllabi:

- Physics, Levels 1 and 2
- Biology, Levels 1 and 2

These programme levels are not labelled Senior 1–6. Do not imply equivalence unless an official equivalence source is recorded.

## Source mapping

`src/data/aep-source-manifest.json` records the source document, subject, AEP level, official topic heading, topic/note identifiers, printed page label, and physical PDF viewer page. It contains metadata only; it does not bundle or reproduce the source PDFs.

The PDFs use printed page labels that differ from the physical PDF viewer page. The manifest currently records the verified +28 physical-page offset for these two files. Keep both values visible in review and test the actual link before release.

## Note structure and editorial standard

Each original study aid should contain:

1. **Learning goals**: observable outcomes, expressed in learner-friendly language.
2. **Core explanation**: definitions, relationships, processes and examples appropriate to the specific syllabus topic.
3. **Key concepts or applications**: topic-specific detail, not generic filler.
4. **Practical/study focus**: a safe activity, diagram, calculation, observation or revision method appropriate to the topic.
5. **Check your understanding**: questions with answers that can be checked against the explanation.

Notes are supplementary learning aids written in our own words. They must not substitute for, or be presented as, the official NCDC syllabus. Link to the source and identify the relevant printed page.

## Review gate

Automated validation checks coverage, unique identifiers, required sections, minimum content structure, source links, page mapping and draft publication status. It **does not establish scientific correctness or prove that every sentence matches the source**.

A subject reviewer must inspect each note against the detailed syllabus topic and learning outcomes, correct any factual gaps, and record approval before publication. Do not bulk-approve all notes merely because CI passes.

## Current operational state

The quality migration `20261028193000_aep_study_aids_quality_v2.sql` updates the 39 existing notes to `needs_review` / `draft`. It is a migration file, not evidence that the connected database has been updated.

The connected Supabase database was inspected read-only on 2026-10-28. It still had the older notes marked `approved` / `published`, while the associated topic records were marked `needs_review`. Do not apply the migration to the production project as a shortcut. Run it first in an isolated development database/branch, verify the lesson index and reviewer visibility, and only then plan a controlled release.

## Release checklist

- [ ] Confirm all 39 source topics match the manifest and official syllabus headings.
- [ ] Subject-review each Physics and Biology note for accuracy, completeness and appropriate depth.
- [ ] Verify printed-page and PDF-viewer-page links for every topic.
- [ ] Test public vs. reviewer access and offline caching in a development database.
- [ ] Confirm that drafts cannot appear to ordinary learners as published notes.
- [ ] Obtain the necessary permission/licence confirmation before redistributing source material; link to the official PDF in the meantime.
- [ ] Apply the migration only after development verification and explicit release approval.
