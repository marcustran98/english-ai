---
name: openai-integration
description: Implements reliable OpenAI calls for this repo without hardcoded prompts: uses OPENAI_API_KEY, JSON-mode/structured outputs, prompt files under prompts/, and robust error handling/timeouts. Use when adding or modifying OpenAI integration in apps/api or when adjusting prompts and response parsing.
---

# OpenAI Integration (repo-standard)

## Non-negotiables
- API key comes from `OPENAI_API_KEY` (never hardcode; never commit secrets).
- Prompts are not hardcoded in code:
  - Store editable prompt text in `prompts/` and load it, or keep a minimal template with external prompt content.
- Responses must be **structured JSON** for the frontend.
- Handle API failures explicitly (timeouts, rate limits, invalid JSON, upstream errors).

## Implementation checklist
1. Locate existing OpenAI integration (client init, model selection, helpers). Reuse it—don’t create a second integration style.
2. Prompt handling:
   - Read prompt content from `prompts/...` when the prompt is non-trivial.
   - Parameterize variables (topic, answer, constraints) instead of concatenating ad-hoc strings.
3. Enforce structured output:
   - Use JSON-mode / structured output features supported by the chosen OpenAI SDK/API.
   - Validate the parsed JSON against a Pydantic response model before returning.
4. Reliability:
   - Set reasonable timeouts.
   - Catch and map OpenAI/network errors to stable `HTTPException` JSON details.
   - If parsing fails, return a controlled error JSON (do not return partial text).
5. Keep the frontend contract stable:
   - Backend response must match the Pydantic response model.
   - If you change output fields, apply the `pydantic-schema` skill to sync frontend interfaces.

## “Don’t do this”
- Don’t inline long prompts in Python source.
- Don’t return raw model text to the frontend.
- Don’t assume the API always returns valid JSON—validate and fail safely.
- Don’t swallow errors; always return predictable JSON error responses.

## Quick self-review
- Does the code load prompts from `prompts/` (when appropriate)?
- Is the output validated by Pydantic before returning?
- Are failures converted to stable JSON error responses?
