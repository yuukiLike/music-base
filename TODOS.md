# TODOS

## CI/CD: GitHub Actions Workflow with Test Gate

**What:** Add `.github/workflows/deploy.yml` that runs Vitest + Playwright tests, then deploys to Vercel on push to main.

**Why:** The design doc specifies automated deploy but doesn't include the workflow file. Vercel's built-in Git integration handles deploy-on-push, but won't run tests before deploying. A GitHub Actions workflow lets you gate deploys on test passing.

**Pros:** Automated deploy with test gate. Catches broken builds before they go live.
**Cons:** Requires Vercel token setup. Slightly more complex than Vercel's zero-config Git integration.
**Context:** For VitePress + Vercel, you can use Vercel's built-in Git integration for initial zero-config deploy. Add the GitHub Actions workflow once the test suite is mature enough to gate on.
**Depends on:** Vitest + Playwright test setup.
**Added:** 2026-03-24 by /plan-eng-review
