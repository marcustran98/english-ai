# Cursor Agent Instructions

## Project Overview
AI English Learning App — monorepo with:
- `apps/web` → Next.js 14 (TypeScript, App Router)
- `apps/api` → Python FastAPI

## Absolute Rules (never break these)
- MVP only: no auth, no database, no over-engineering
- Never add libraries not listed in the tech stack (ask via chat if needed; otherwise do not add)
- Never create files outside the defined folder structure
- Always use TypeScript in frontend (no `.js` files)
- Always return structured JSON from backend — never plain text
- All backend routes are prefixed with `/api/`
- Environment variables: frontend uses `NEXT_PUBLIC_API_URL`, backend uses `OPENAI_API_KEY`

## Where these instructions apply
- This file is the source of truth for Cursor Agents working in this repo.
- Keep project rules here (or add persistent rules under `.cursor/rules/` if you later adopt Cursor Rules).

## Monorepo Structure (fixed, do not change)
```
/
├── apps/
│   ├── web/          ← Next.js frontend
│   └── api/          ← FastAPI backend
├── .cursor/
│   └── copilot-instructions.md
└── README.md
```

## Cursor workflow expectations
- Read before edit: inspect relevant files before making changes.
- Prefer small, focused diffs aligned with MVP scope.
- After edits, run the smallest relevant checks (lint/typecheck/tests) available in the repo and fix introduced issues.
- Don’t change tooling/config (formatters, linters, tsconfig, pyproject, etc.) unless explicitly requested.

## Code Style
- Python: use type hints everywhere, Pydantic for all models
- TypeScript: use interfaces for all data shapes, no `any`
- Functions must be small and single-purpose
- No inline comments explaining obvious code