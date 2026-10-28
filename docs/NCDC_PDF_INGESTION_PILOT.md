# NCDC PDF ingestion pilot

This pilot is metadata-and-topic-index only. It does not commit source PDFs to GitHub, upload PDF bytes to Supabase Storage, or copy full extracted syllabus text into database records. The connected Supabase project has two source-document records, a normalized index of 10 Physics and 29 Biology topic headings with printed source-page references, and 39 original short study-note drafts. All notes remain in review and unpublished.

## Pilot documents

- NCDC Accelerated Education Programme (AEP), Physics, revised lower secondary Levels 1 and 2.
- NCDC Accelerated Education Programme (AEP), Biology, revised lower secondary Levels 1 and 2.

These are AEP syllabi, not general-purpose S1-S6 revision notes. Preserve that distinction in catalog labels. Both uploaded documents include an NCDC copyright notice stating that reproduction requires prior permission.

## Run locally

Copy the two PDFs into a private local folder, then place a copy of `scripts/ncdc-aep-pilot.json` beside them (or edit the `file` paths). From the repository root:

```bash
node scripts/ingest-curriculum-pdfs.mjs --manifest ./scripts/ncdc-aep-pilot.json --output ./curriculum-pdf-ingestion-report.json
```

The default is a local dry run. It validates the PDF header, checks the expected SHA-256 and page count when supplied, extracts searchable text, records page count and captures likely topic headings. It does not retain full extracted text. The AEP parser validates the expected headings against extracted PDF text and preserves AEP Level 1/2 labels. The development lesson index links to the official NCDC PDF URLs and caches the public index for offline reading.

To upsert draft metadata after applying the migration:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY \
node scripts/ingest-curriculum-pdfs.mjs --manifest ./scripts/ncdc-aep-pilot.json --commit
```

Keep the service-role key server-side and out of `VITE_*` variables. The development CI workflow formats the changed application files, runs targeted ESLint, executes the test suite, and builds both the client and server. The interactive developer uploader verifies the signed-in Supabase session and admin profile before buffering a PDF. Do not commit generated reports if they contain private paths or metadata you do not want public.

## Release gates

1. Verify the exact source URL and curriculum programme mapping.
2. Obtain NCDC permission for redistribution, or verify a licence that explicitly allows it.
3. Review extracted topic headings against the PDF's table of contents.
4. Review each original study-note draft in the development lessons index; approving a note publishes only that original note, not the source PDF.
5. Test PDF upload, extraction, Supabase persistence, cross-device visibility, and offline cache on the development preview before merging.
