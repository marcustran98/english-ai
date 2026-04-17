---
name: fastapi-endpoint
description: Enforces consistent FastAPI endpoint structure for this repo: /api/ prefix, Pydantic request/response models, structured JSON errors, and robust error handling. Use when adding or modifying backend routes in apps/api, FastAPI endpoints, request validation, response models, or error handling.
---

# FastAPI Endpoint (repo-standard)

## Guardrails (must follow)
- Routes are always prefixed with `/api/`.
- Responses are JSON objects (never plain text responses).
- Use Pydantic models for request bodies and response shapes.
- Don’t invent a new routing style: match existing `apps/api` patterns (router placement, naming, imports).

## Implementation checklist
1. Read the existing route module(s) closest to your change and copy their structure (router creation, tags, prefix, response_model usage).
2. Define/extend **Pydantic models** for:
   - Request body (if any)
   - Success response
   - Error response (if the repo has a standard error schema, reuse it)
3. Add the endpoint with:
   - Proper HTTP method and path under `/api/...`
   - `response_model=...` for success response
   - Clear status codes (200/201/4xx/5xx as appropriate)
4. Error handling:
   - Validate inputs explicitly beyond Pydantic when needed (length limits, allowed values, empty strings).
   - Catch expected failures and raise `HTTPException(status_code=..., detail={...})` with **structured JSON** detail.
   - Avoid leaking internal exceptions/messages; map to a stable error shape for clients.
5. Ensure OpenAI or external calls (if any) have timeouts and failures are translated into stable JSON errors.

## “Don’t do this”
- Don’t return `PlainTextResponse`, raw strings, or ad-hoc dicts without a response model.
- Don’t add a route outside `/api/`.
- Don’t skip error paths (“it probably won’t fail”)—handle them explicitly.

## Quick self-review
- Does the endpoint use `/api/...`?
- Are request/response shapes represented by Pydantic models?
- On failure, does the client still get predictable JSON?
- Are status codes correct and consistent?
