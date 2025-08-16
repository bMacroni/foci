SQL structure

Folders
- schema: Full snapshot(s) of the current database schema for new environments. Start from 000_full_schema_snapshot.sql.
- migrations: Dated, append-only changes to evolve the schema. Name as YYYY-MM-DD_XXXX_description.sql to keep order.
- rollbacks: Optional rollback scripts matching migrations when available.

Conventions
- Use idempotent SQL (IF NOT EXISTS / DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$) where possible.
- Keep one logical change per migration file. Avoid mixing unrelated features.
- When adding a migration, also consider RLS policies, triggers, indexes, and grants.

How to apply
1) For a fresh database, run schema/000_full_schema_snapshot.sql first.
2) Then apply each file in migrations/ in chronological order.
3) Only run rollbacks/ if you explicitly need to undo a migration.


