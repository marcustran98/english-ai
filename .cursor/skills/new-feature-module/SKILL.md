---
name: new-feature-module
description: Adds new features without breaking existing modules in this monorepo by following folder boundaries, keeping API contracts stable, and doing minimal regression checks. Use when introducing a new feature, new page/route, new API endpoint, or refactoring shared code in apps/web or apps/api.
---

# New Feature Module (don’t break existing)

## Principles
- Prefer additive changes: new files/functions/components over invasive rewrites.
- Keep module boundaries: web code stays in `apps/web`, api code stays in `apps/api`.
- Preserve existing API contracts unless you intentionally version/change them (and then update frontend types immediately).

## Workflow
1. Identify what already exists:
   - Closest existing feature module(s) and their structure (components, types, api client calls, backend route).
2. Create feature-scoped files (avoid dumping into generic utils):
   - Frontend: `apps/web/components/<feature>/...`, `apps/web/types/<feature>.ts`, API wrappers in `apps/web/lib/api.ts`.
   - Backend: add/extend routes and Pydantic models in the existing FastAPI pattern.
3. Don’t break existing modules:
   - Avoid changing signatures/return shapes that existing UI depends on.
   - If you must change a shared function/type, update all call sites in the same change.
4. Minimal regression validation:
   - Ensure existing pages/components still typecheck.
   - Ensure existing endpoints still match their response models.

## “Don’t do this”
- Don’t refactor unrelated code “while you’re here”.
- Don’t rename/move existing modules without a clear reason and full call-site updates.
- Don’t introduce a new shared abstraction unless the MVP truly needs it.

## Quick self-review
- Is the change mostly additive and feature-scoped?
- Did any existing API response shape change? If yes, did you sync `apps/web/types` immediately?
- Did you avoid touching unrelated modules?
