Migrations

Naming
- Use YYYY-MM-DD_####_description.sql to ensure chronological order and grouping on the same day.
- Keep one logical change per file.

Apply order
1) On a fresh DB run ../schema/000_full_schema_snapshot.sql first.
2) Apply files here in order by filename.

Guidelines
- Prefer idempotent SQL with IF NOT EXISTS and DO $$ blocks to make re-runs safe.
- Include related RLS policies, triggers, indexes, and grants in the same migration when they belong to the feature.


