---
name: nextjs-component
description: Enforces Next.js component patterns for this repo: no inline fetch, use apps/web/lib/api.ts, typed interfaces (no any), and explicit idle/loading/error/success UI states. Use when creating or editing React/Next.js components, pages, hooks, or client-side data fetching in apps/web.
---

# Next.js Component (repo-standard)

## Repo rules to enforce
- No inline `fetch` in components. All network calls go through `apps/web/lib/api.ts`.
- Use TypeScript interfaces in `apps/web/types/` (no `any`).
- UI must have explicit states: `idle` | `loading` | `error` | `success`.

## Implementation checklist
1. Put data fetching in `apps/web/lib/api.ts`:
   - One exported function per endpoint (typed request + typed response).
   - Base URL uses `process.env.NEXT_PUBLIC_API_URL` (with local default if that’s the established pattern).
2. In components/pages:
   - Keep components presentational where possible; call the API wrapper from event handlers or hooks (never inline fetch).
   - Track and render the required UI states.
   - Render loading indicator during requests and a clear error message on failure.
3. Types:
   - Use interfaces that mirror the backend schema exactly (apply `pydantic-schema` when contracts change).
   - Avoid widening types to “make it compile”.

## “Don’t do this”
- Don’t call `fetch(...)` directly inside `page.tsx` or components.
- Don’t skip loading/error states.
- Don’t use `any` for API payloads or responses.

## Quick self-review
- Are all API calls routed through `lib/api.ts`?
- Does the UI show loading + error states reliably?
- Are request/response types imported from `types/` and precise?
