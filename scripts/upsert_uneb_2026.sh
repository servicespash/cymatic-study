#!/bin/bash
# Raw programmatic upsert script for UNEB 2026 Deadline

SUPABASE_URL="https://tffffvbaiccqndydsobg.supabase.co"
# Using the publishable key from .env
SUPABASE_KEY="REDACTED_OR_USE_ENV_VAR"

echo "Attempting upsert to ${SUPABASE_URL}..."

curl -X POST "${SUPABASE_URL}/rest/v1/news_broadcasts" \
-H "apikey: ${SUPABASE_KEY}" \
-H "Authorization: Bearer ${SUPABASE_KEY}" \
-H "Content-Type: application/json" \
-H "Prefer: resolution=merge-duplicates" \
-d '{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "title": "⚠️ Official UNEB 2026 Registration Deadlines & CA Requirements",
  "body": "The normal registration deadline for PLE, UCE, and UACE is June 30, 2026. Late registration runs from July 1 to July 31, 2026 (50% surcharge for UCE/UACE). CRITICAL: UCE registration requires complete submission of all Senior 3 coursework and NCDC project continuous assessment records.",
  "category": "Exams",
  "priority": "high",
  "expires_at": "2026-07-31T23:59:59+03:00",
  "is_active": true
}'

echo -e "\n\nNote: If you get a column not found error, ensure the migration 20260602000000_add_priority_category_to_news.sql has been applied."
