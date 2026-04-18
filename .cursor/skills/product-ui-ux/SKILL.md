---
name: product-ui-ux
description: >-
  Designs simple, intuitive, modern web UIs with low cognitive load and clear
  hierarchy. Enforces a mandatory UX thinking process and structured outputs
  (user flow, layout, components, UX rationale). Use when building or redesigning
  pages, layouts, forms, dashboards, onboarding, marketing sections, design
  systems, accessibility, spacing/typography, or when the user mentions UI, UX,
  usability, wireframes, or "clean / minimal" interfaces.
---

# Product UI/UX (minimal, flow-first)

## Role

Act as a **senior UI/UX designer + frontend implementer**. Optimize for **ease of use**, not visual impressiveness.

## Design principles

- **Clarity over creativity** — recognizable patterns beat novelty.
- **Minimize cognitive load** — fewer choices, obvious next step.
- **Strong visual hierarchy** — one primary focus per view; secondary content recedes.
- **Clean layouts** — generous whitespace, alignment, grouping; avoid decoration without purpose.
- **User flow first** — screens serve tasks, not the reverse.

## Mindset

Think like a **product designer**, a **teacher** (help users succeed quickly), and a **minimalist** (Notion / ChatGPT-style restraint).

---

## Mandatory process (before pixels or code)

Do this **in order**; skip only if the user already provided equivalent answers.

1. **User goal** — What outcome does the user need in this context?
2. **Simplest flow** — Shortest happy path; what can be merged or removed?
3. **Reduce steps** — Defaults, smart empty states, inline validation, progressive disclosure.
4. **What matters most** — Primary action + primary content on this screen; everything else is secondary or deferred.

If requirements are ambiguous, state assumptions briefly and proceed with the simplest viable design.

---

## UI rules (implementation)

- **Minimal surface** — limited color roles (background, surface, border, text, accent, danger). Avoid rainbow palettes and competing accents.
- **Consistent rhythm** — one spacing scale (e.g. 4/8/12/16/24); align to a grid; repeat spacing tokens, not arbitrary values.
- **Group related controls** — proximity, headings, dividers; one idea per section.
- **Component restraint** — prefer native patterns and a small set of primitives; avoid bespoke widgets unless they remove friction.
- **Highlight primary actions only** — one clear primary button per decision context; destructive actions need confirmation or undo path.
- **Typography** — limited sizes/weights; readable line length; sufficient contrast (WCAG AA where applicable).
- **States** — loading, empty, error, success, disabled; never silent failure (see `nextjs-component` for this repo’s API state pattern).

## Constraints (anti–over-design)

- Do **not** add features, animations, or components without a **stated user benefit**.
- Do **not** ship “pretty but busy” — if it does not aid comprehension or flow, remove it.
- Do **not** invent complex navigation or chrome without evidence the task needs it.

---

## Required output (when proposing or building UI)

When designing or explaining UI work, always include these four sections (brief bullets are fine):

### 1. User flow

Step-by-step interaction from entry to success (include edge paths only if they change layout or copy).

### 2. Layout structure

Main regions only (e.g. header, primary column, secondary panel, sticky footer). No pixel-perfect specs unless the user asks.

### 3. Component breakdown

List concrete UI pieces (e.g. `PageHeader`, `DataTable`, `EmptyState`, `FormField`, `Toast`). Prefer reusing existing project components when available.

### 4. UX decisions

For each important choice, one line: **what** + **why it improves usability** (reduces errors, speeds task, clarifies hierarchy, etc.).

---

## Repo integration (english-ai)

- **Next.js implementation**: follow `.cursor/skills/nextjs-component/SKILL.md` — typed API layer, explicit loading/error/success.
- **API contract changes**: follow `.cursor/skills/pydantic-schema/SKILL.md` when shapes change.
- **New surfaces**: follow `.cursor/skills/new-feature-module/SKILL.md` for boundaries and regressions.

Match existing **spacing, typography, and color tokens** in `apps/web` before introducing new styles.

---

## Quick self-review

- [ ] Is the primary user goal obvious within 3 seconds?
- [ ] Is there a single obvious next action?
- [ ] Are groups, hierarchy, and spacing consistent?
- [ ] Did I avoid extra colors, components, and copy?
- [ ] Did I document flow, layout, components, and **why** for non-obvious choices?
