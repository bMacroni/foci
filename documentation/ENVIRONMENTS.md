# Environments (Dev vs Prod)

The backend reads `.env.{NODE_ENV}` automatically and falls back to `.env` if missing.

- NODE_ENV=development → `.env.development`
- NODE_ENV=production → `.env.production`

## Supabase
Create two Supabase projects (DEV/PROD). Store each project's keys in the matching env file:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Apply schema:
- Run `SQL/schema/000_full_schema_snapshot.sql` OR
- Run all files in `SQL/migrations/` in order

## Running the backend (PowerShell)
- Dev: `$env:NODE_ENV='development'; npm run dev --prefix mindgarden\backend`
- Prod: `$env:NODE_ENV='production'; npm start --prefix mindgarden\backend`

## Frontend
- Dev: set `VITE_API_URL=http://localhost:5000/api`

## Mobile
- `API_CONFIGS.local` → local backend
- `API_CONFIGS.hosted` → prod backend
- Add `devHosted` if you deploy a dedicated dev backend endpoint.

## Notes
- Never commit real `.env*` files.
- Keep dev/production Google OAuth redirect URIs consistent with `FRONTEND_URL`.
