# Team Task Tracker

This repository was reset on 2026-11-11 for the SI Workforce engineering department.
The application is built here from a requirement; see the open issues and pull requests.

## Contract for the app (CI depends on it)

The root `package.json` must provide these npm scripts:

| Script | Purpose |
|---|---|
| `db:migrate` | apply database migrations to `DATABASE_URL` |
| `lint` | lint all code |
| `typecheck` | type-check all code |
| `test` | run every test (unit, API, UI) |
| `build` | production build of frontend and backend |

CI (`.github/workflows/ci.yml`) runs them in that order against a PostgreSQL 16 service.
