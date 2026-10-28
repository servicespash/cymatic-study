# NCDC PDF ingestion pilot

This pilot is metadata-and-topic-index only. It does not commit source PDFs to GitHub, upload PDF bytes to Supabase Storage, or copy full extracted syllabus text into database records. The live Supabase project has the metadata registry and a normalized topic index; the two draft records currently contain 10 Physics topic headings and 29 Biology topic headings.

## Pilot documents

- NCDC Accelerated Education Programme (AEP), Physics, revised lower secondary Levels 1 and 2.
- NCDC Accelerated Education Programme (AEP), Biology, revised lower secondary Levels 1 and 2.

These are AEP syllabi, not general-purpose S1-S6 revision notes. Preserve that distinction in catalog labels. Both uploaded documents include an NCDC copyright notice stating that reproduction requires prior permission.

## Run locally

Copy the two PDFs into a private local folder, then place a copy of `scripts/ncdc-aep-pilot.json` beside them (or edit the `file` paths). From the repository root:

```bash
node scripts/ingest-curriculum-pdfs.mjs --manifest ./scripts/ncdc-aep-pilot.json --output ./curriculum-pdf-ingestion-report.json
```

The default is a local dry run. It validates the PDF header, checks the expected SHA-256 and page count when supplied, extracts searchable text, records page count and captures likely topic headings. It does not retain full extracted text. The first topic index has been extracted from the uploaded source PDFs; one Biology page reference is intentionally left blank pending review.

To upsert draft metadata after applying the migration:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY \
node scripts/ingest-curriculum-pdfs.mjs --manifest ./scripts/ncdc-aep-pilot.json --commit
```

Keep the service-role key server-side and out of `VITE_*` variables. Do not commit the generated report if it contains private paths or metadata you do not want public.

## Release gates

1. Verify the exact source URL and curriculum programme mapping.
2. Obtain NCDC permission for redistribution, or verify a licence that explicitly allows it.
3. Review extracted topic headings against the PDF's table of contents.
4. Only then design a separate Storage upload and publication flow with explicit access policies.
