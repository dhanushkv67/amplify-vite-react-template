# Project board

React/Vite frontend, Express API and PostgreSQL schema for accounts, projects, membership, tasks and comments. Session tokens are random and stored only as digests; passwords use Argon2id. API requests use current membership checks and comments render as text.

## Local one-command demo

Copy `.env.example` to `.env`, set a unique `POSTGRES_PASSWORD`, then set `DEMO_SEED=true` and a private `DEMO_PASSWORD` of at least 12 characters. Run `docker compose up --build` and open `http://localhost:8080` (or configured `WEB_PORT`). The seeded accounts are `demo-owner@example.test` and `demo-member@example.test`, with the password you chose. Demo seed is opt-in and forbidden when `NODE_ENV=production`. On startup the API waits for the database health gate, applies migrations and idempotently seeds a project, membership, task and comment before listening; the web service waits for API health. Keep this local-only stack off public networks: HTTP and demo accounts are not suitable for a client deployment.

The `db_data` volume preserves data across `docker compose down` and `docker compose up --build`; `docker compose down -v` deletes it. `GET /api/health` reports database availability. For development without containers, set `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, optionally `PGPORT` or `DATABASE_URL`, then run `npm run dev:api` and `npm run dev:web`. Install packages only from the approved company mirror. `npm run typecheck`, `npm test` and `npm run test:e2e` run static, API/UI and browser checks when their database/browser prerequisites are available.

The HTTPS deployment example and explicit live verification checklist are in `deploy/README.md`. The current workspace has not verified a deployed certificate, live network flows or restart persistence; this README makes no production-readiness claim.
