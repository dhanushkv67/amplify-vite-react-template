# Shop cart

A small React shopping cart used to test the AgentGov engineering department.

- `npm ci` installs the locked packages.
- `npm test` runs the unit tests (Vitest + Testing Library).
- `npm run build` builds the app with Vite.

CI (`.github/workflows/test.yml`) runs the tests and the build on every push to
`main` and `agentgov/**` branches and on every pull request. The required check is
`test`.
