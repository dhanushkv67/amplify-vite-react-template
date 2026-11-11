# Acceptance-test mapping (issue #40)

These tests pin the owner-approved npm workspace / Vitest / Supertest / PostgreSQL / Testing Library interface. The initial repository has no app or migration files; each test must first fail because its implementation is absent, not because npm/Vitest failed to run. The API suite requires a real `DATABASE_URL` and SQL migrations in `apps/api/migrations/`; CI supplies PostgreSQL.

| Signed criterion | Test name | File |
|---|---|---|
| AC1 — account creation and validation | `AC1 account creation rejects duplicate/malformed email and invalid password` | `apps/api/tests/acceptance.test.ts` |
| AC2 — valid/invalid login, logout and expiry | `AC2 valid login/logout, invalid credentials and expired sessions protect data` | same |
| AC3 — project creation and membership | `AC3 authenticated creator joins a named project; blank names are rejected` | same |
| AC4 — creator-only add, unknown/duplicate prevention | `AC4 creator adds existing email only, not unknown/duplicate or noncreator` | same |
| AC5 — creator-only removal and immediate revocation | `AC5 creator removes member; removed member immediately loses task access` | same |
| AC6 — task creation and validation | `AC6 task creation validates title, due date and project-scoped assignee; default To do` | same |
| AC7 — task editing/status, isolation | `AC7 member edits task fields/status; invalid status or nonmember cannot change it` | same |
| AC8 — board grouping/status change | `AC8 board exposes only member tasks once in the right status after refresh` | same |
| AC9 — comments, author/time, plain text | `AC9 comments require membership/content and return author/time as inert text` | same |
| AC10 — private task access | `AC10 visitor and nonmember cannot list/open/search/change or comment on private tasks` | same |
| AC11 — persistent data and failed saves | `AC11 stored project/task/comment survives new client session and failed saves are errors` | same |
| AC12 — responsive/keyboard interface | `AC12 authentication, project, board and task pages expose essential controls` | `apps/web/src/pages/acceptance.test.tsx` |
| AC13 — HTTPS, authorization, password/XSS/session safety | `AC13 protected routes deny unauthenticated data and password is not stored in plaintext` | `apps/api/tests/acceptance.test.ts` |

**Outstanding coverage (do not claim full AC sign-off):** AC2 does not yet advance an idle session past 24 hours; AC8 lacks real browser column assertions; AC9 plain-text rendering is not exercised; AC10 search is not exercised; AC11 does not restart the process/database or test the UI failed-save state; AC12 cannot prove clipping, horizontal scroll or keyboard operation at 375/1280px with jsdom alone; AC13 needs a real HTTPS deployment probe, XSS browser probe and expiry test. Complete these with browser/e2e and deployment checks before calling the full criteria passed.
