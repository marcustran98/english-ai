---
name: pydantic-schema
description: Prevents schema drift between backend Pydantic models (apps/api) and frontend TypeScript interfaces (apps/web/types). Use when changing any API request/response shape, editing Pydantic models, or updating TypeScript types that mirror API schemas.
---

# Pydantic ↔ TypeScript Schema Sync

## Goal
Keep frontend interfaces in `apps/web/types/` matching backend Pydantic models exactly (field names, nesting, optionality, arrays), so the UI and API never disagree.

## Process (always follow)
1. Identify the endpoint contract you’re changing (path + method).
2. Update backend Pydantic models first:
   - Request model(s)
   - Response model(s)
   - Any nested models
3. Immediately update the corresponding TypeScript interfaces:
   - Prefer colocated feature types (example: `apps/web/types/speaking.ts`)
   - Field names must match backend JSON keys exactly (snake_case vs camelCase is not negotiable—mirror the API)
4. Verify “shape parity”:
   - Required vs optional fields
   - `null` vs omitted
   - Arrays vs single objects
   - Enum/union constraints (represent with TS unions when appropriate)
5. Update usage sites:
   - Backend: `response_model=...` is correct for the endpoint.
   - Frontend: API client (`apps/web/lib/api.ts`) returns the right type and validates basic assumptions.

## Contract discipline rules
- Treat the backend response model as the source of truth.
- Never “fix it in the UI” by widening types (`any`, `unknown`, or overly-permissive optionals).
- Don’t introduce parallel schemas (duplicate interfaces/models with slightly different fields).

## Quick parity checklist
- Are all JSON keys identical across backend + frontend?
- Do TS optional properties exactly match backend optional fields?
- Are nested objects/arrays aligned 1:1?
- If a field changed, did you update both the API client return type and any UI rendering that depends on it?
